import Parser from 'tree-sitter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PHP = require('tree-sitter-php');

const getParser = () => {
  const parser = new Parser();
  parser.setLanguage(PHP);
  return parser;
};

export class LogicAnalyzer {
  constructor() {
    this.parser = getParser();
    this.complexityPatterns = {
      nestedIf: { threshold: 3, message: 'Too many nested if statements' },
      longConditional: { threshold: 3, message: 'Complex conditional expression' },
      magicNumbers: { pattern: /\b\d{3,}\b/, message: 'Magic number detected' },
      deepNesting: { threshold: 4, message: 'Code is too deeply nested' }
    };
  }

  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    this.analyzeLogic(code, filePath, tree.rootNode, issues);

    return issues;
  }

  analyzeLogic(code, filePath, node, issues) {
    // Исключаем migrations, seeders, factories - там сложная логика нормальна
    const isExcludedFile = filePath.includes('migrations') || 
                          filePath.includes('seeders') || 
                          filePath.includes('factories');
    
    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const complexity = this.calculateComplexity(node);
      const questions = this.generateQuestions(code, node, complexity);

      if (!isExcludedFile) {
        questions.forEach(question => {
          issues.push({
            type: 'logic_question',
            severity: 'info',
            message: question,
            filePath,
            line: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
            suggestion: 'Review this logic for clarity and potential improvements'
          });
        });
      }

      // Проверяем имя метода для исключения служебных
      const methodName = this.getMethodName(node);
      const isServiceMethod = methodName === '__construct' || methodName === '__destruct' ||
                              methodName === '__invoke' || methodName === '__get' ||
                              methodName === '__set' || methodName.startsWith('scope');
      
      // Предупреждаем о высокой сложности, но не для служебных методов
      if (complexity > 50 && !isExcludedFile && !isServiceMethod) {
        issues.push({
          type: 'high_complexity',
          severity: 'major',
          message: `High cyclomatic complexity (${complexity})`,
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Consider simplifying the logic or extracting parts into separate methods'
        });
      }
      
      // Для методов с complexity 1-2 (просто return) не предупреждаем
      if (complexity <= 2) {
        this.checkMagicNumbers(node, code, filePath, issues);
        return; // Не проверяем дальше
      }

      this.checkNestedStructures(node, code, filePath, issues);
      this.checkMagicNumbers(node, code, filePath, issues);
    }

    for (const child of node.children) {
      this.analyzeLogic(code, filePath, child, issues);
    }
  }

  calculateComplexity(node) {
    let complexity = 1;

    const complexityKeywords = ['if_statement', 'elseif_clause', 'else_clause', 
                                'while_statement', 'for_statement', 'foreach_statement',
                                'case_statement', 'catch_clause', '&&', '||'];

    const text = node.text;
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'g');
      const matches = text.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  generateQuestions(code, node, complexity) {
    const questions = [];
    const text = node.text;
    const line = node.startPosition.row + 1;
    const methodName = this.getMethodName(node);

    // Простые helper методы в Trait не требуют вопросов
    const isSimpleHelper = methodName.includes('success') || 
                           methodName.includes('error') || 
                           methodName.includes('data') ||
                           methodName.includes('created') ||
                           methodName.includes('notFound') ||
                           methodName.includes('forbidden') ||
                           methodName.includes('unauthorized');
    
    // Конструкторы не требуют вопросов о сложности
    const isConstructor = methodName === '__construct' || methodName === '__destruct';
    
    // Простые методы (один return без условий) не требуют вопросов
    const hasConditionals = text.includes('if') || text.includes('foreach') || text.includes('for') || text.includes('while');
    const isSimpleMethod = complexity <= 2 && !hasConditionals;
    
    // Ранний возврат для простых методов
    if (isSimpleMethod || isConstructor) {
      return [];
    }

    if (!isConstructor && !isSimpleMethod && text.includes('null') && text.includes('??')) {
      questions.push(`Is the null coalescing operator (??) used correctly at line ${line}?`);
    }

    if (text.includes('array') && text.includes('count') && !isSimpleHelper) {
      questions.push(`Could array_* functions or Laravel collections be used instead at line ${line}?`);
    }

    if (text.includes('DB::') && !text.includes('transaction')) {
      questions.push(`Is database transaction handling appropriate at line ${line}?`);
    }

    // Для простых helper методов не показываем вопросы о сложности
    if (complexity > 5 && !isSimpleHelper) {
      questions.push(`Could this complex logic be simplified by extracting methods?`);
    }

    if (text.includes('if (') && (text.match(/if \(/g) || []).length > 3) {
      questions.push(`Are there multiple conditions that could be extracted into guard clauses?`);
    }

    return questions;
  }
  
  /**
   * Получает имя метода
   *
   * @param object node
   * @return string
   */
  getMethodName(node) {
    for (const child of node.children) {
      if (child.type === 'name' || child.type === 'simple_identifier') {
        return child.text;
      }
    }
    return 'anonymous';
  }

  checkNestedStructures(node, code, filePath, issues) {
    const depth = this.getNestingDepth(node);
    
    if (depth > this.complexityPatterns.deepNesting.threshold) {
      issues.push({
        type: 'deep_nesting',
        severity: 'major',
        message: `Deep nesting detected (depth: ${depth})`,
        filePath,
        line: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        suggestion: 'Extract deeply nested code into separate methods'
      });
    }
  }

  getNestingDepth(node, current = 0, max = 0) {
    let maxDepth = Math.max(max, current);

    for (const child of node.children) {
      if (['if_statement', 'while_statement', 'for_statement', 
           'foreach_statement', 'try_statement'].includes(child.type)) {
        // Рекурсивно проверяем КАЖДОГО child, не возвращаясь на первом
        const childDepth = this.getNestingDepth(child, current + 1, maxDepth);
        maxDepth = Math.max(maxDepth, childDepth);
      } else {
        // Проверяем и другие children тоже
        const childDepth = this.getNestingDepth(child, current, maxDepth);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }

    return maxDepth;
  }

  checkMagicNumbers(node, code, filePath, issues) {
    const text = node.text;
    const allNumbers = text.match(/\b\d{3,}\b/g);

    if (!allNumbers) return;

    // Исключаем очевидные не-magic numbers
    const commonNumbers = [
      '200', '201', '204', '301', '302', '400', '401', '403', '404', '422', '500', '503',  // HTTP codes
      '1000', '2000', '3000', '5000', '10000',  // round numbers (часто константы)
      '100', '1024', '2048', '4096',  // степени двойки
    ];

    // Исключаем timestamps (10 цифр)
    const magicNumbers = allNumbers.filter(num => {
      // Не HTTP коды и не round numbers
      if (commonNumbers.includes(num)) return false;
      
      // Не timestamps (10-13 цифр)
      if (num.length >= 10 && num.length <= 13) return false;
      
      // Не коды состояния/версии (xxx, xxxx)
      if (/^[1-9]00$/.test(num)) return false;
      
      return true;
    });

    if (magicNumbers.length > 0) {
      issues.push({
        type: 'magic_number',
        severity: 'minor',
        message: `Magic numbers detected: ${magicNumbers.join(', ')}`,
        filePath,
        line: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        suggestion: 'Consider extracting these numbers into named constants or configuration'
      });
    }
  }
}

