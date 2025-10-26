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
    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const complexity = this.calculateComplexity(node);
      const questions = this.generateQuestions(code, node, complexity);

      questions.forEach(question => {
        issues.push({
          type: 'logic_question',
          severity: 'info',
          message: question,
          filePath,
          line: node.startPosition.row + 1,
          suggestion: 'Review this logic for clarity and potential improvements'
        });
      });

      if (complexity > 10) {
        issues.push({
          type: 'high_complexity',
          severity: 'major',
          message: `High cyclomatic complexity (${complexity})`,
          filePath,
          line: node.startPosition.row + 1,
          suggestion: 'Consider simplifying the logic or extracting parts into separate methods'
        });
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

    if (text.includes('null') && text.includes('??')) {
      questions.push(`Is the null coalescing operator (??) used correctly at line ${line}?`);
    }

    if (text.includes('array') && text.includes('count')) {
      questions.push(`Could array_* functions or Laravel collections be used instead at line ${line}?`);
    }

    if (text.includes('DB::') && !text.includes('transaction')) {
      questions.push(`Is database transaction handling appropriate at line ${line}?`);
    }

    if (complexity > 5) {
      questions.push(`Could this complex logic be simplified by extracting methods?`);
    }

    if (text.includes('if (') && (text.match(/if \(/g) || []).length > 3) {
      questions.push(`Are there multiple conditions that could be extracted into guard clauses?`);
    }

    return questions;
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
        suggestion: 'Extract deeply nested code into separate methods'
      });
    }
  }

  getNestingDepth(node, current = 0, max = 0) {
    const newDepth = current;
    const newMax = Math.max(max, newDepth);

    for (const child of node.children) {
      if (['if_statement', 'while_statement', 'for_statement', 
           'foreach_statement', 'try_statement'].includes(child.type)) {
        return this.getNestingDepth(child, newDepth + 1, newMax);
      }
    }

    return newMax;
  }

  checkMagicNumbers(node, code, filePath, issues) {
    const text = node.text;
    const magicNumbers = text.match(/\b\d{3,}\b/g);

    if (magicNumbers) {
      issues.push({
        type: 'magic_number',
        severity: 'minor',
        message: `Magic numbers detected: ${magicNumbers.join(', ')}`,
        filePath,
        line: node.startPosition.row + 1,
        suggestion: 'Consider extracting these numbers into named constants or configuration'
      });
    }
  }
}

