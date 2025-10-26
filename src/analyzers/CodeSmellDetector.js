import Parser from 'tree-sitter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PHP = require('tree-sitter-php');

const getParser = () => {
  const parser = new Parser();
  parser.setLanguage(PHP);
  return parser;
};

/**
 * Детектор code smells и антипаттернов
 */
export class CodeSmellDetector {
  constructor() {
    this.parser = getParser();
  }

  /**
   * Анализирует код на наличие code smells
   *
   * @param string code Исходный код PHP
   * @param string filePath Путь к файлу
   * @return array
   */
  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    // Проверка unused imports ОДИН РАЗ для всего файла (не рекурсивно!)
    this.checkUnusedImports(code, filePath, issues);

    // Остальные проверки с рекурсией по AST
    this.checkTooManyParameters(code, filePath, tree.rootNode, issues);
    this.checkGodClass(code, filePath, tree.rootNode, issues);
    this.checkDuplicateCode(code, filePath, tree.rootNode, issues);
    this.checkUnusedPrivateMethods(code, filePath, tree.rootNode, issues);
    this.checkLongParameterList(code, filePath, tree.rootNode, issues);
    this.checkPrimitiveObsession(code, filePath, tree.rootNode, issues);
    this.checkFeatureEnvy(code, filePath, tree.rootNode, issues);

    return issues;
  }

  /**
   * Проверяет слишком много параметров в методах
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkTooManyParameters(code, filePath, node, issues) {
    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodName = this.getMethodName(node);
      const params = this.getParameters(node);
      const line = node.startPosition.row + 1;

      if (params.length > 4) {
        issues.push({
          type: 'too_many_parameters',
          severity: 'major',
          message: `Method "${methodName}" has ${params.length} parameters (recommended max: 4)`,
          filePath,
          line: line,
          suggestion: 'Consider using DTO (Data Transfer Object) or Request object to group parameters'
        });
      }

      if (params.length > 3 && !this.isConstructor(methodName)) {
        const allPrimitive = params.every(p => this.isPrimitiveType(p.type));
        
        if (allPrimitive) {
          issues.push({
            type: 'primitive_parameter_list',
            severity: 'minor',
            message: `Method "${methodName}" has many primitive parameters`,
            filePath,
            line: line,
            suggestion: 'Create a dedicated class or DTO to encapsulate these parameters'
          });
        }
      }
    }

    for (const child of node.children) {
      this.checkTooManyParameters(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет God Class (слишком много методов/ответственностей)
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkGodClass(code, filePath, node, issues) {
    if (node.type === 'class_declaration') {
      const className = this.getClassName(node);
      const methods = this.countMethods(node);
      const properties = this.countProperties(node);
      const line = node.startPosition.row + 1;

      // Контексты где много методов - это норма
      const isController = className.includes('Controller') || filePath.includes('Controller');
      const isRepository = className.includes('Repository') || filePath.includes('Repository');
      const isFacade = className.includes('Facade') || className.includes('Service') && methods > 10;
      const isModel = code.includes('extends Model');
      
      // Для Controllers/Repositories допустимо больше методов (CRUD + вспомогательные)
      const methodThreshold = (isController || isRepository) ? 20 : 15;
      const propertyThreshold = isModel ? 15 : 10;

      if (methods > methodThreshold && !isFacade) {
        issues.push({
          type: 'god_class',
          severity: 'major',
          message: `Class "${className}" has ${methods} methods (too many responsibilities)`,
          filePath,
          line: line,
          suggestion: 'Consider splitting this class into smaller, focused classes following Single Responsibility Principle'
        });
      }

      if (properties > propertyThreshold) {
        issues.push({
          type: 'too_many_properties',
          severity: 'minor',
          message: `Class "${className}" has ${properties} properties`,
          filePath,
          line: line,
          suggestion: 'Consider if this class is doing too much and should be split'
        });
      }

      const linesOfCode = node.endPosition.row - node.startPosition.row;
      if (linesOfCode > 300) {
        issues.push({
          type: 'large_class',
          severity: 'major',
          message: `Class "${className}" is ${linesOfCode} lines (too large)`,
          filePath,
          line: line,
          suggestion: 'Break down large class into smaller, cohesive classes'
        });
      }
    }

    for (const child of node.children) {
      this.checkGodClass(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет дублирование кода
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkDuplicateCode(code, filePath, node, issues) {
    if (node.type === 'class_declaration') {
      const methods = this.getAllMethods(node);
      const signatures = new Map();

      for (const method of methods) {
        const signature = this.getMethodSignature(method);
        
        if (signatures.has(signature)) {
          const line = method.startPosition.row + 1;
          issues.push({
            type: 'duplicate_code',
            severity: 'minor',
            message: 'Similar method structure detected (possible code duplication)',
            filePath,
            line: line,
            suggestion: 'Extract common logic into shared private method or trait'
          });
        } else {
          signatures.set(signature, method);
        }
      }
    }

    for (const child of node.children) {
      this.checkDuplicateCode(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет неиспользуемые импорты (вызывается ОДИН РАЗ для файла)
   *
   * @param string code
   * @param string filePath
   * @param array issues
   * @return void
   */
  checkUnusedImports(code, filePath, issues) {
    const useStatements = this.extractUseStatements(code);
    for (const useStmt of useStatements) {
      const className = useStmt.split('\\').pop();
      const usagePattern = new RegExp(`\\b${className}\\b`, 'g');
      const allMatches = (code.match(usagePattern) || []).length;

      // Вычитаем сам use statement (1 использование)
      // Если осталось 0-1 использование - возможно неиспользуется
      // (1 может быть в PHPDoc, type hint)
      const actualUsages = allMatches - 1;

      // Проверяем нет ли в PHPDoc или type hints
      const inPhpDoc = new RegExp(`@(param|return|var|throws)\\s+${className}\\b`).test(code);
      const inTypeHint = new RegExp(`(:|function\\s+\\w+\\()\\s*${className}\\b`).test(code);

      if (actualUsages === 0 && !inPhpDoc && !inTypeHint) {
        issues.push({
          type: 'unused_import',
          severity: 'info',
          message: `Unused import: ${className}`,
          filePath,
          line: 1,
          suggestion: 'Remove unused use statements to keep code clean'
        });
      }
    }
  }

  /**
   * Проверяет неиспользуемые private методы (рекурсивно)
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkUnusedPrivateMethods(code, filePath, node, issues) {
    if (node.type === 'method_declaration') {
      const methodName = this.getMethodName(node);
      const visibility = this.getVisibility(node);
      const line = node.startPosition.row + 1;

      if (visibility === 'private') {
        const usageCount = (code.match(new RegExp(`->${methodName}\\(`, 'g')) || []).length;
        
        if (usageCount <= 1) {
          issues.push({
            type: 'unused_private_method',
            severity: 'info',
            message: `Private method "${methodName}" may be unused`,
            filePath,
            line: line,
            suggestion: 'Remove unused methods or consider if they should be protected/public'
          });
        }
      }
    }

    for (const child of node.children) {
      this.checkUnusedPrivateMethods(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет длинные списки параметров
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkLongParameterList(code, filePath, node, issues) {
    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodName = this.getMethodName(node);
      const params = this.getParameters(node);
      const line = node.startPosition.row + 1;

      const hasArrayParam = params.some(p => p.type === 'array');
      
      if (params.length > 3 && hasArrayParam) {
        issues.push({
          type: 'array_parameter_smell',
          severity: 'minor',
          message: `Method "${methodName}" uses array parameter with other params`,
          filePath,
          line: line,
          suggestion: 'Consider using typed objects instead of arrays for better IDE support'
        });
      }
    }

    for (const child of node.children) {
      this.checkLongParameterList(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет примитивную одержимость
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkPrimitiveObsession(code, filePath, node, issues) {
    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = node.text;
      const methodName = this.getMethodName(node);
      const line = node.startPosition.row + 1;

      const hasEmailValidation = methodText.includes('filter_var') && methodText.includes('FILTER_VALIDATE_EMAIL');
      const hasUrlValidation = methodText.includes('filter_var') && methodText.includes('FILTER_VALIDATE_URL');
      
      if (hasEmailValidation || hasUrlValidation) {
        issues.push({
          type: 'primitive_obsession',
          severity: 'info',
          message: `Method "${methodName}" validates primitives inline`,
          filePath,
          line: line,
          suggestion: 'Create Value Objects (Email, Url classes) to encapsulate validation logic'
        });
      }

      // Не проверяем primitive obsession для scope-методов и методов с одной строкой return
      const isScopeMethod = methodName.startsWith('scope');
      const isSimpleMethod = methodText.trim().split('\n').filter(l => l.trim() && !l.trim().startsWith('/')).length <= 3;
      
      if (!isScopeMethod && (methodText.match(/\$\w+(Id|ID)\b/g) || []).length > 2) {
        issues.push({
          type: 'id_primitive_obsession',
          severity: 'info',
          message: 'Multiple ID parameters - consider using domain objects',
          filePath,
          line: line,
          suggestion: 'Use typed domain objects instead of passing multiple IDs'
        });
      }
    }

    for (const child of node.children) {
      this.checkPrimitiveObsession(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет Feature Envy (метод использует данные другого класса больше своих)
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkFeatureEnvy(code, filePath, node, issues) {
    // Исключаем migrations, seeders, factories - там использование внешних объектов норма
    const isExcludedFile = filePath.includes('migrations') || 
                          filePath.includes('seeders') || 
                          filePath.includes('factories');
    
    if (node.type === 'method_declaration') {
      const methodText = node.text;
      const methodName = this.getMethodName(node);
      const line = node.startPosition.row + 1;

      const externalCalls = (methodText.match(/\$\w+->(?!save|delete|update|create)\w+/g) || []).length;
      const thisCalls = (methodText.match(/\$this->\w+/g) || []).length;

      if (externalCalls > thisCalls && externalCalls > 3 && !isExcludedFile) {
        issues.push({
          type: 'feature_envy',
          severity: 'minor',
          message: `Method "${methodName}" uses external object data more than its own`,
          filePath,
          line: line,
          suggestion: 'Consider moving this method to the class it uses most'
        });
      }
    }

    for (const child of node.children) {
      this.checkFeatureEnvy(code, filePath, child, issues);
    }
  }

  getMethodName(node) {
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }
    return 'anonymous';
  }

  getClassName(node) {
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }
    return 'Unknown';
  }

  getParameters(node) {
    const params = [];
    let paramList = null;

    for (const child of node.children) {
      if (child.type === 'formal_parameters') {
        paramList = child;
        break;
      }
    }

    if (!paramList) return params;

    this.walkParameters(paramList, params);
    return params;
  }

  walkParameters(node, params) {
    if (node.type === 'simple_parameter' || node.type === 'property_promotion_parameter') {
      let paramType = null;
      for (const child of node.children) {
        if (child.type.includes('type') || child.type === 'primitive_type') {
          paramType = child.text;
        }
      }
      params.push({ type: paramType || 'mixed' });
    }

    for (const child of node.children) {
      this.walkParameters(child, params);
    }
  }

  countMethods(node) {
    let count = 0;
    for (const child of node.children) {
      if (child.type === 'method_declaration') {
        count++;
      }
      count += this.countMethods(child);
    }
    return count;
  }

  countProperties(node) {
    let count = 0;
    for (const child of node.children) {
      if (child.type === 'property_declaration') {
        count++;
      }
    }
    return count;
  }

  getAllMethods(node) {
    const methods = [];
    for (const child of node.children) {
      if (child.type === 'method_declaration') {
        methods.push(child);
      }
    }
    return methods;
  }

  getMethodSignature(node) {
    const lines = node.text.split('\n').slice(0, 5);
    return lines.join('').replace(/\s+/g, ' ').substring(0, 100);
  }

  getVisibility(node) {
    for (const child of node.children) {
      if (child.type === 'visibility_modifier') {
        return child.text;
      }
    }
    return 'public';
  }

  extractUseStatements(code) {
    const usePattern = /use\s+([\w\\]+);/g;
    const matches = [];
    let match;
    
    while ((match = usePattern.exec(code)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  }

  isPrimitiveType(type) {
    const primitives = ['int', 'string', 'bool', 'float', 'array', 'mixed'];
    return !type || primitives.includes(type);
  }

  isConstructor(name) {
    return name === '__construct';
  }
}

