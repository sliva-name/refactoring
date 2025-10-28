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
 * Анализатор конфликтов классов и архитектурных проблем
 */
export class ClassConflictAnalyzer {
  constructor() {
    this.parser = getParser();
  }

  /**
   * Анализирует код на наличие конфликтов классов
   *
   * @param string code Исходный код PHP
   * @param string filePath Путь к файлу
   * @param array allFiles Все файлы проекта для сравнения
   * @return array
   */
  analyze(code, filePath, allFiles = []) {
    const tree = this.parser.parse(code);
    const issues = [];

    // Проверка на конфликтующие классы (несколько классов для одной таблицы)
    this.checkMultipleClassesForOneTable(code, filePath, allFiles, issues);
    
    // Проверка на parent-dependent logic (parent использует child логику)
    this.checkParentChildDependency(code, filePath, tree.rootNode, issues);
    
    // Проверка на дублирование методов между классами
    this.checkDuplicateMethodsAcrossClasses(code, filePath, allFiles, issues);
    
    // Проверка на conditional logic для определения типа класса
    this.checkConditionalClassType(code, filePath, tree.rootNode, issues);
    
    // Проверка на незакрытые TODO/FIXME
    this.checkTodoComments(code, filePath, issues);
    
    // Проверка на переопределение базовых Laravel методов
    this.checkSaveMethodOverride(code, filePath, tree.rootNode, issues);
    
    // Проверка на другие архитектурные проблемы
    this.checkLongChaining(code, filePath, tree.rootNode, issues);
    this.checkMixinPatterns(code, filePath, allFiles, issues);
    this.checkAnemicDomainModel(code, filePath, tree.rootNode, issues);
    
    // Проверка SOLID violations
    this.checkServiceLocatorAntiPattern(code, filePath, tree.rootNode, issues);
    this.checkControllerFatness(code, filePath, tree.rootNode, issues);
    this.checkStaticMethodAbuse(code, filePath, tree.rootNode, issues);
    this.checkInappropriateIntimacy(code, filePath, tree.rootNode, issues);
    this.checkDataClumps(code, filePath, tree.rootNode, issues);
    this.checkShotgunSurgery(code, filePath, allFiles, issues);

    return issues;
  }

  /**
   * Проверяет несколько классов для одной таблицы
   */
  checkMultipleClassesForOneTable(code, filePath, allFiles, issues) {
    const tableMatch = code.match(/protected\s+\$table\s*=\s*['"]([\w_]+)['"]/);
    if (!tableMatch) return;
    
    const table = tableMatch[1];
    const className = this.getClassName(code);
    
    // Ищем другие классы с той же таблицей
    let conflictCount = 0;
    const conflictingClasses = [];
    
    for (const [otherPath, otherCode] of Object.entries(allFiles)) {
      if (otherPath === filePath) continue;
      
      const otherTableMatch = otherCode.match(/protected\s+\$table\s*=\s*['"]([\w_]+)['"]/);
      if (otherTableMatch && otherTableMatch[1] === table) {
        conflictCount++;
        const otherClassName = this.extractClassName(otherCode);
        conflictingClasses.push(otherClassName || 'Unknown');
      }
    }
    
    if (conflictCount > 0) {
      issues.push({
        type: 'multiple_classes_for_table',
        severity: 'critical',
        message: `Multiple classes (${conflictCount + 1}) use the same table "${table}": ${className}`,
        filePath,
        line: 1,
        endLine: 1,
        suggestion: `Consider using Single Table Inheritance (STI) or separate tables. Conflicting classes: ${conflictingClasses.join(', ')}. This creates confusion about which class to use.`,
        refactorInfo: {
          pattern: 'Multiple classes for one table',
          table: table,
          conflictingClasses: [className, ...conflictingClasses],
          recommendation: 'Use Strategy Pattern or separate tables'
        }
      });
    }
  }

  /**
   * Проверяет когда parent класс зависит от child классов
   */
  checkParentChildDependency(code, filePath, node, issues) {
    if (node.type === 'class_declaration') {
      const className = this.getClassName(code);
      
      // Ищем использование child классов в parent
      const hasDirectChildUsage = code.includes(':?') && 
                                  (code.includes('class') || code.includes('::class'));
      
      const hasConditionalTypeCheck = /if\s*\(.*this->is_\w+\s*\?/s.test(code);
      
      if (hasDirectChildUsage || hasConditionalTypeCheck) {
        issues.push({
          type: 'parent_child_dependency',
          severity: 'major',
          message: `Parent class "${className}" uses child class logic through conditionals`,
          filePath,
          line: 1,
          endLine: 1,
          suggestion: 'Use abstract methods or Strategy Pattern instead of conditional class selection. Parent should not know about child classes.',
          refactorInfo: {
            pattern: 'Parent depends on children',
            recommendation: 'Create abstract methods in parent, implement in children'
          }
        });
      }
    }

    for (const child of node.children || []) {
      this.checkParentChildDependency(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет дублирование методов между классами
   */
  checkDuplicateMethodsAcrossClasses(code, filePath, allFiles, issues) {
    const methods = this.extractMethods(code);
    
    for (const [otherPath, otherCode] of Object.entries(allFiles)) {
      if (otherPath === filePath) continue;
      
      const otherMethods = this.extractMethods(otherCode);
      
      // Сравниваем методы
      for (const method of methods) {
        const matchedMethod = otherMethods.find(m => 
          m.name === method.name && 
          m.signature === method.signature &&
          this.calculateSimilarity(method.body, m.body) > 0.7
        );
        
        if (matchedMethod) {
          issues.push({
            type: 'duplicate_methods',
            severity: 'major',
            message: `Method "${method.name}" is duplicated in classes`,
            filePath,
            line: method.line,
            endLine: method.endLine,
            suggestion: `Extract common logic to parent class or trait. Duplicate exists in: ${this.extractClassName(otherCode)}`,
            refactorInfo: {
              pattern: 'Code duplication between classes',
              methodName: method.name,
              recommendation: 'Extract to parent class or use trait'
            }
          });
        }
      }
    }
  }

  /**
   * Проверяет conditional logic для определения типа класса
   */
  checkConditionalClassType(code, filePath, node, issues) {
    if (node.type === 'method_declaration') {
      const methodText = node.text;
      const methodName = this.getMethodName(node);
      
      // Ищем паттерн: return $something ? ClassA::class : ClassB::class
      const conditionalClassPattern = /return\s+.*\?\s*[\w\\]+::class\s*:\s*[\w\\]+::class/;
      
      if (conditionalClassPattern.test(methodText)) {
        issues.push({
          type: 'conditional_class_type',
          severity: 'critical',
          message: `Method "${methodName}" uses conditional class selection`,
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Replace conditional class selection with abstract methods. Use polymorphism instead of conditionals.',
          refactorInfo: {
            pattern: 'Conditional class type selection',
            methodName: methodName,
            recommendation: 'Use abstract methods in base class, override in children'
          }
        });
      }
    }

    for (const child of node.children || []) {
      this.checkConditionalClassType(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет незакрытые TODO/FIXME
   */
  checkTodoComments(code, filePath, issues) {
    const todoPattern = /@todo\s+(.+)/gi;
    let match;
    
    let lineNumber = 1;
    for (const line of code.split('\n')) {
      if (match = todoPattern.exec(line)) {
        issues.push({
          type: 'unresolved_todo',
          severity: 'major',
          message: `Unresolved TODO: ${match[1]}`,
          filePath,
          line: lineNumber,
          endLine: lineNumber,
          suggestion: 'TODO comments in production code indicate technical debt. Either implement the feature or remove the TODO.',
          refactorInfo: {
            pattern: 'Technical debt indicator',
            todo: match[1],
            recommendation: 'Implement the feature or remove TODO'
          }
        });
      }
      lineNumber++;
    }
  }

  /**
   * Проверяет переопределение базовых методов Laravel
   */
  checkSaveMethodOverride(code, filePath, node, issues) {
    if (node.type === 'method_declaration') {
      const methodName = this.getMethodName(node);
      const methodText = node.text;
      
      // Проверяем переопределение базовых методов
      const laravelBaseMethods = ['save', 'create', 'update', 'delete', 'forceDelete', 'restore'];
      
      if (laravelBaseMethods.includes(methodName)) {
        // Проблема #1: Базовый метод вызывает parent внутри себя
        if (methodText.includes(`parent::${methodName}()`)) {
          issues.push({
            type: 'base_method_override',
            severity: 'critical',
            message: `Base method "${methodName}()" is overridden and calls parent::${methodName}() inside`,
            filePath,
            line: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
            suggestion: `Override of base method "${methodName}()" is a code smell. Consider using Model Events, Observers, or Middleware instead.`,
            refactorInfo: {
              pattern: 'Base method override',
              methodName: methodName,
              recommendation: 'Use Model Events or Observers for side effects'
            }
          });
        }
        
        // Проблема #2: Метод имеет много логики (God Method)
        const lineCount = methodText.split('\n').length;
        if (lineCount > 20) {
          issues.push({
            type: 'base_method_too_complex',
            severity: 'major',
            message: `Base method "${methodName}()" is too complex (${lineCount} lines)`,
            filePath,
            line: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
            suggestion: `Extract ${methodName}() logic into smaller methods or use proper Laravel hooks (events, observers, middleware).`,
            refactorInfo: {
              pattern: 'Complex base method',
              methodName: methodName,
              recommendation: 'Use hooks or extract to helper methods'
            }
          });
        }
        
        // Проблема #3: Транзакция внутри базового метода
        if (methodText.includes('DB::beginTransaction') || methodText.includes('DB::transaction')) {
          issues.push({
            type: 'transaction_in_base_method',
            severity: 'major',
            message: `Transaction inside base method "${methodName}()"`,
            filePath,
            line: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
            suggestion: `Transactions in ${methodName}() create issues with Eloquent lifecycle. Use DB::transaction() at the Service/Repository level.`,
            refactorInfo: {
              pattern: 'Transaction in base method',
              methodName: methodName,
              recommendation: 'Move transactions to Service layer'
            }
          });
        }
      }
    }

    for (const child of node.children || []) {
      this.checkSaveMethodOverride(code, filePath, child, issues);
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Получает имя класса
   */
  getClassName(code) {
    const classMatch = code.match(/class\s+(\w+)/);
    return classMatch ? classMatch[1] : 'Unknown';
  }

  /**
   * Извлекает имя класса из кода
   */
  extractClassName(code) {
    const classMatch = code.match(/class\s+(\w+)/);
    return classMatch ? classMatch[1] : null;
  }

  /**
   * Получает имя метода
   */
  getMethodName(node) {
    for (const child of node.children || []) {
      if (child.type === 'name' || child.type === 'simple_identifier') {
        return child.text;
      }
    }
    return 'anonymous';
  }

  /**
   * Извлекает методы из кода
   */
  extractMethods(code) {
    const methods = [];
    const methodRegex = /(?:public|protected|private)\s+function\s+(\w+)\s*\([^)]*\)(?:\s*:\s*[\w\\|]+)?\s*\{([\s\S]*?)(?=\n\s*(?:public|protected|private|}|\$))/g;
    let match;
    let lineNumber = 1;
    
    for (const line of code.split('\n')) {
      if (match = /function\s+(\w+)/.exec(line)) {
        // Простое извлечение для демо
        const methodName = match[1];
        methods.push({
          name: methodName,
          signature: line,
          body: '', // Для упрощения
          line: lineNumber,
          endLine: lineNumber
        });
      }
      lineNumber++;
    }
    
    return methods;
  }

  /**
   * Вычисляет similarity между двумя строками
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Проверяет длинные цепочки вызовов методов
   */
  checkLongChaining(code, filePath, node, issues) {
    if (node.type === 'method_declaration') {
      const methodText = node.text;
      
      // Ищем длинные цепочки типа $this->method1()->method2()->method3()...
      const chainingPattern = /\$this->[^();]+->[^();]+->[^();]+->[^();]+/g;
      const matches = methodText.match(chainingPattern);
      
      if (matches && matches.length > 0) {
        issues.push({
          type: 'long_method_chaining',
          severity: 'minor',
          message: 'Long method chaining detected',
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Consider extracting intermediate results into variables for better readability and debugging.',
          refactorInfo: {
            pattern: 'Long method chaining',
            recommendation: 'Break chaining into intermediate variables'
          }
        });
      }
    }

    for (const child of node.children || []) {
      this.checkLongChaining(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет Mixin patterns и random методы
   */
  checkMixinPatterns(code, filePath, allFiles, issues) {
    // Ищем классы с множеством необычных методов (возможно mixin)
    const methods = this.extractMethods(code);
    const className = this.getClassName(code);
    
    const unusualMethods = methods.filter(m => 
      m.name.includes('random') ||
      m.name.includes('Random') ||
      m.name.includes('mixed') ||
      m.name.match(/^(get|set)(\w+)$/)
    );
    
    if (unusualMethods.length > 5) {
      issues.push({
        type: 'possible_mixin_pattern',
        severity: 'info',
        message: `Class "${className}" has ${unusualMethods.length} utility methods`,
        filePath,
        line: 1,
        endLine: 1,
        suggestion: 'Consider extracting utility methods into Traits or Helper classes. Too many utility methods in one class indicates mixed responsibilities.',
        refactorInfo: {
          pattern: 'Possible mixin pattern',
          recommendation: 'Extract to Traits or Helper classes'
        }
      });
    }
  }

  /**
   * Проверяет Anemic Domain Model
   */
  checkAnemicDomainModel(code, filePath, node, issues) {
    if (node.type === 'class_declaration') {
      const className = this.getClassName(code);
      const methods = this.extractMethods(code);
      const properties = this.countProperties(code);
      
      // Anemic Domain Model: много свойств, мало методов
      if (properties > 10 && methods.length < 5) {
        issues.push({
          type: 'anemic_domain_model',
          severity: 'minor',
          message: `Class "${className}" might be an Anemic Domain Model (${properties} properties, ${methods.length} methods)`,
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Anemic Domain Model: class has data but no behavior. Move business logic into this class instead of keeping it in services.',
          refactorInfo: {
            pattern: 'Anemic Domain Model',
            recommendation: 'Move business logic into the model'
          }
        });
      }
      
      // God Object: много методов, но модель
      if (methods.length > 20 && code.includes('extends Model')) {
        issues.push({
          type: 'god_model',
          severity: 'major',
          message: `Model "${className}" has ${methods.length} methods (God Model)`,
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Too many methods in a Model. Consider extracting some logic into separate Service classes, Value Objects, or Query Objects.',
          refactorInfo: {
            pattern: 'God Model',
            recommendation: 'Extract logic to Services, VOs, or Query Objects'
          }
        });
      }
    }

    for (const child of node.children || []) {
      this.checkAnemicDomainModel(code, filePath, child, issues);
    }
  }

  /**
   * Считает свойства класса
   */
  countProperties(code) {
    const propertyPattern = /(?:protected|public|private)\s+\$[\w_]+/g;
    const matches = code.match(propertyPattern);
    return matches ? matches.length : 0;
  }

  /**
   * Вычисляет расстояние Левенштейна
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Проверяет Service Locator anti-pattern
   */
  checkServiceLocatorAntiPattern(code, filePath, node, issues) {
    // Пропускаем ServiceLocator для CLI, тестов, и конфигов
    if (filePath.includes('Console') || 
        filePath.includes('Commands') || 
        filePath.includes('Tests') ||
        filePath.includes('config') ||
        filePath.includes('routes')) {
      return;
    }
    
    // Проверка использования app() ВНУТРИ методов классов (не в ServiceProvider)
    if (code.includes('app(') && (code.includes('->') || code.includes('::'))) {
      // Исключаем случаи где app() используется для получения типа
      const lines = code.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Пропускаем комментарии
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
        
        // Ищем использование app()
        if (line.includes('app(')) {
          // Проверяем что это внутри метода класса
          const isInMethod = line.includes('public ') || line.includes('protected ') || line.includes('private ');
          const isInLoop = line.includes('foreach') || line.includes('for') || line.includes('while');
          
          // Пропускаем использование app() в ServiceProviders (это нормально)
          if (filePath.includes('ServiceProvider') || filePath.includes('Provider.php')) continue;
          
          // Пропускаем использование app() для получения типа (это тоже нормально в некоторых случаях)
          if (line.includes('app() instanceof') || line.includes('get_class')) continue;
          
          // Флагим только если app() вызывается внутри метода (не в конструкторе)
          const contextBefore = lines.slice(Math.max(0, i - 5), i).join('\n');
          const isInConstructor = contextBefore.includes('__construct');
          
          if (!isInConstructor && !isInLoop) {
            issues.push({
              type: 'service_locator_antipattern',
              severity: 'major',
              message: 'Service Locator anti-pattern detected (using app() inside method)',
              filePath,
              line: i + 1,
              endLine: i + 1,
              suggestion: 'Use Dependency Injection instead of app(). Pass dependencies through constructor or method parameters.',
              refactorInfo: {
                pattern: 'Service Locator',
                recommendation: 'Use constructor injection or method parameters'
              }
            });
          }
        }
      }
    }
    
    // Проверка Facade usage в non-facade контексте
    if (code.includes('use Illuminate\\Support\\Facades\\') && filePath.includes('app')) {
      const facades = code.match(/use Illuminate\\Support\\Facades\\(\w+)/g);
      if (facades && facades.length > 3) {
        issues.push({
          type: 'facade_abuse',
          severity: 'minor',
          message: `Too many Facades used (${facades.length})`,
          filePath,
          line: 1,
          endLine: 1,
          suggestion: 'Excessive use of Facades makes testing difficult. Consider using Dependency Injection.',
          refactorInfo: {
            pattern: 'Facade abuse',
            recommendation: 'Inject dependencies instead of using Facades'
          }
        });
      }
    }
    
    for (const child of node.children || []) {
      this.checkServiceLocatorAntiPattern(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет толстый контроллер (Fat Controller)
   */
  checkControllerFatness(code, filePath, node, issues) {
    if (node.type === 'class_declaration' && filePath.includes('Controller')) {
      const methods = this.extractMethods(code);
      const className = this.getClassName(code);
      
      // Проверка количества методов в контроллере
      if (methods.length > 15) {
        issues.push({
          type: 'fat_controller',
          severity: 'major',
          message: `Controller "${className}" has ${methods.length} methods`,
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Too many methods in controller. Consider splitting into Resource Controllers or extracting logic to Services.',
          refactorInfo: {
            pattern: 'Fat Controller',
            recommendation: 'Split into smaller controllers or use Service layer'
          }
        });
      }
      
      // Проверка бизнес-логики в контроллере
      for (const method of methods) {
        const methodText = method.body || '';
        if (methodText.includes('DB::') || methodText.includes('Eloquent::')) {
          issues.push({
            type: 'business_logic_in_controller',
            severity: 'major',
            message: `Business logic in controller method "${method.name}"`,
            filePath,
            line: method.line,
            endLine: method.endLine,
            suggestion: 'Move database operations and business logic to Service or Repository layer.',
            refactorInfo: {
              pattern: 'Business logic in controller',
              recommendation: 'Extract to Service layer'
            }
          });
        }
      }
    }
    
    for (const child of node.children || []) {
      this.checkControllerFatness(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет злоупотребление статическими методами
   */
  checkStaticMethodAbuse(code, filePath, node, issues) {
    if (node.type === 'class_declaration') {
      const className = this.getClassName(code);
      const staticPattern = /public\s+static\s+function/g;
      const staticMatches = code.match(staticPattern);
      
      if (staticMatches && staticMatches.length > 8) {
        issues.push({
          type: 'static_method_abuse',
          severity: 'minor',
          message: `Class "${className}" has ${staticMatches.length} static methods`,
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Too many static methods make testing difficult. Consider converting to instance methods or extracting to Helpers.',
          refactorInfo: {
            pattern: 'Static method abuse',
            recommendation: 'Use instance methods for better testability'
          }
        });
      }
    }
    
    for (const child of node.children || []) {
      this.checkStaticMethodAbuse(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет Inappropriate Intimacy (классы знают слишком много о друг друге)
   */
  checkInappropriateIntimacy(code, filePath, node, issues) {
    if (node.type === 'class_declaration') {
      const className = this.getClassName(code);
      
      // Проверка прямого доступа к private свойствам других классов
      const externalPrivateAccess = code.match(/\$[\w]+->[\w]+->[\w]+/g);
      
      if (externalPrivateAccess && externalPrivateAccess.length > 3) {
        issues.push({
          type: 'inappropriate_intimacy',
          severity: 'minor',
          message: `Class "${className}" accesses too many methods of other classes`,
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Classes are too intimate. Consider hiding internal structure or using Facade/Adapter pattern.',
          refactorInfo: {
            pattern: 'Inappropriate Intimacy',
            recommendation: 'Reduce coupling between classes'
          }
        });
      }
    }
    
    for (const child of node.children || []) {
      this.checkInappropriateIntimacy(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет Data Clumps (группы данных всегда вместе)
   */
  checkDataClumps(code, filePath, node, issues) {
    if (node.type === 'class_declaration') {
      const methods = this.extractMethods(code);
      
      // Ищем часто встречающиеся комбинации параметров
      const paramCombinations = new Map();
      
      for (const method of methods) {
        const params = method.body.match(/function\s+\w+\s*\(([^)]*)\)/);
        if (params && params[1]) {
          const paramCount = params[1].split(',').length;
          if (paramCount > 3) {
            paramCombinations.set(method.name, paramCount);
          }
        }
      }
      
      // Если много методов с большим количеством параметров
      if (paramCombinations.size > 5) {
        issues.push({
          type: 'data_clumps',
          severity: 'info',
          message: 'Potential Data Clumps: many methods with multiple parameters',
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Consider grouping related parameters into Data Transfer Objects (DTOs) or Value Objects.',
          refactorInfo: {
            pattern: 'Data Clumps',
            recommendation: 'Create DTOs for related parameters'
          }
        });
      }
    }
    
    for (const child of node.children || []) {
      this.checkDataClumps(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет Shotgun Surgery (изменения раскиданы по многим файлам)
   */
  checkShotgunSurgery(code, filePath, allFiles, issues) {
    const className = this.getClassName(code);
    
    // Смотрим сколько других файлов используют этот класс
    let usageCount = 0;
    for (const [otherPath, otherCode] of Object.entries(allFiles)) {
      if (otherPath !== filePath && otherCode.includes(className)) {
        usageCount++;
      }
    }
    
    // Если класс используется в слишком многих местах
    if (usageCount > 20) {
      issues.push({
        type: 'shotgun_surgery',
        severity: 'minor',
        message: `Class "${className}" is used in ${usageCount} files`,
        filePath,
        line: 1,
        endLine: 1,
        suggestion: 'Shotgun Surgery: Changes require modifications in many files. Consider refactoring to reduce coupling.',
        refactorInfo: {
          pattern: 'Shotgun Surgery',
          recommendation: 'Reduce coupling and create abstraction'
        }
      });
    }
  }

  /**
   * Получает номера строк для паттерна
   */
  getLineNumbers(code, pattern) {
    const lines = code.split('\n');
    const lineNumbers = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (new RegExp(pattern).test(lines[i])) {
        lineNumbers.push(i + 1);
      }
    }
    
    return lineNumbers;
  }
}

