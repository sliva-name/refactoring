import Parser from 'tree-sitter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PHP = require('tree-sitter-php');

const getParser = () => {
  const parser = new Parser();
  parser.setLanguage(PHP);
  return parser;
};

export class ArchitectureAnalyzer {
  constructor() {
    this.parser = getParser();
    this.rules = {
      controllersShouldBeThin: true,
      useServiceLayer: true,
      useRepositories: true,
      avoidBusinessLogicInControllers: true,
      useResourceTransformers: true
    };
  }

  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    // Проверки файла целиком (ОДИН РАЗ!)
    this.checkCommonArchitectureIssues(code, filePath, issues);

    // Рекурсивный обход AST для методов и классов
    this.analyzeArchitecture(code, filePath, tree.rootNode, issues);

    return issues;
  }

  analyzeArchitecture(code, filePath, node, issues) {
    const isController = filePath.includes('Controller.php');
    const isModel = filePath.includes('Models/') || code.includes('extends Model');
    const isService = filePath.includes('Services/');
    const isRepository = filePath.includes('Repositories/');

    // Проверки для конкретных типов файлов (НЕ рекурсивно, только для class_declaration)
    if (node.type === 'class_declaration') {
      if (isService) {
        this.analyzeService(code, filePath, node, issues);
      }

      if (isRepository) {
        this.analyzeRepository(code, filePath, node, issues);
      }
    }

    // Проверки для методов (рекурсивно)
    if (isController) {
      this.analyzeController(code, filePath, node, issues);
    }

    if (isModel) {
      this.analyzeModel(code, filePath, node, issues);
    }

    // Рекурсия для обхода детей
    for (const child of node.children) {
      this.analyzeArchitecture(code, filePath, child, issues);
    }
  }

  analyzeController(code, filePath, node, issues) {
    if (node.type === 'method_declaration') {
      const methodName = this.getMethodName(node);
      const methodText = node.text;

      if (this.isModelMethod(methodText)) {
        issues.push({
          type: 'business_logic_in_controller',
          severity: 'major',
          message: `Controller method "${methodName}" contains direct model logic`,
          filePath,
          line: node.startPosition.row + 1,
          suggestion: 'Move model queries to Service Layer or Repository'
        });
      }

      if (this.hasComplexLogic(methodText)) {
        issues.push({
          type: 'thick_controller',
          severity: 'major',
          message: `Controller method "${methodName}" is doing too much work`,
          filePath,
          line: node.startPosition.row + 1,
          suggestion: 'Extract business logic to Service Layer'
        });
      }

      if (methodText.includes('DB::') && !methodName.includes('index')) {
        issues.push({
          type: 'raw_query_in_controller',
          severity: 'major',
          message: `Controller method "${methodName}" uses raw database queries`,
          filePath,
          line: node.startPosition.row + 1,
          suggestion: 'Use Eloquent ORM or move to Repository/Service layer'
        });
      }

      // Не проверяем __construct и другие служебные методы
      const isServiceMethod = methodName === '__construct' || 
                            methodName === '__destruct' ||
                            methodName === 'middleware' ||
                            methodName.startsWith('validate');
      
      if (!isServiceMethod && 
          (!methodText.includes('return') || 
          (!methodText.includes('view') && !methodText.includes('json') && 
           !methodText.includes('redirect') && !methodText.includes('response')))) {
        issues.push({
          type: 'missing_response',
          severity: 'info',
          message: `Controller method "${methodName}" may be missing proper response`,
          filePath,
          line: node.startPosition.row + 1,
          suggestion: 'Ensure method returns proper Laravel Response (view/json/redirect)'
        });
      }
    }
  }

  analyzeModel(code, filePath, node, issues) {
    // Проверяем $fillable/$guarded только один раз для класса (не для каждого метода!)
    if (node.type === 'class_declaration') {
      if (!code.includes('protected $fillable') && !code.includes('protected $guarded')) {
        issues.push({
          type: 'missing_fillable',
          severity: 'major',
          message: 'Model is missing $fillable or $guarded property',
          filePath,
          line: 1,
          suggestion: 'Add protected $fillable array to prevent mass assignment vulnerabilities'
        });
      }
    }

    if (node.type === 'method_declaration') {
      const methodText = node.text;

      if (this.hasBusinessLogic(methodText)) {
        issues.push({
          type: 'fat_model',
          severity: 'minor',
          message: 'Model contains business logic',
          filePath,
          line: node.startPosition.row + 1,
          suggestion: 'Move business logic to Service Layer'
        });
      }

      if (methodText.includes('DB::')) {
        issues.push({
          type: 'raw_query_in_model',
          severity: 'info',
          message: 'Model uses raw database queries',
          filePath,
          line: node.startPosition.row + 1,
          suggestion: 'Prefer Eloquent query builder methods'
        });
      }
    }
  }

  analyzeService(code, filePath, node, issues) {
    if (node.type === 'class_declaration') {
      const hasDependencyInjection = code.includes('public function __construct');

      if (!hasDependencyInjection) {
        issues.push({
          type: 'missing_di',
          severity: 'info',
          message: 'Service class may benefit from Dependency Injection',
          filePath,
          line: node.startPosition.row + 1,
          suggestion: 'Inject dependencies through constructor'
        });
      }
    }
  }

  analyzeRepository(code, filePath, node, issues) {
    if (!code.includes('interface') && !filePath.includes('Interface')) {
      issues.push({
        type: 'missing_repository_interface',
        severity: 'info',
        message: 'Repository is missing interface',
        filePath,
        line: 1,
        suggestion: 'Create interface for Repository to improve testability'
      });
    }
  }

  checkCommonArchitectureIssues(code, filePath, issues) {
    // Исключаем migrations, seeders, factories - DB facade там валиден
    const isExcludedFile = filePath.includes('migrations') || 
                          filePath.includes('seeders') || 
                          filePath.includes('factories') ||
                          filePath.includes('Migration') ||
                          filePath.includes('Seeder') ||
                          filePath.includes('Factory');
    
    if (code.includes('use Illuminate\\Support\\Facades\\DB;') && !isExcludedFile) {
      const hasCorrectContext = filePath.includes('Services/') || 
                                filePath.includes('Repositories/') ||
                                filePath.includes('Models/');

      if (!hasCorrectContext) {
        issues.push({
          type: 'direct_db_facade',
          severity: 'minor',
          message: 'Direct use of DB facade in non-migration file',
          filePath,
          line: 1,
          suggestion: 'Consider using Eloquent or Repository pattern'
        });
      }
    }

    // Auth facade валиден в Controller, Middleware, Policy, Gate, некоторых Service
    const validAuthContexts = [
      'Controller',
      'Middleware', 
      'Policy',
      'Gate',
      'AuthService',
      'NotificationService'
    ];
    
    const isValidAuthContext = validAuthContexts.some(context => filePath.includes(context));
    
    if (code.includes('use Illuminate\\Support\\Facades\\Auth;') && !isValidAuthContext) {
      issues.push({
        type: 'global_facade',
        severity: 'minor',
        message: 'Use of global facade outside typical contexts (Controller/Middleware/Policy)',
        filePath,
        line: 1,
        suggestion: 'Inject dependencies through constructor instead of using facades (unless in Policy/Gate)'
      });
    }
  }

  isModelMethod(text) {
    return text.includes('::where') || 
           text.includes('::find') || 
           text.includes('::create') ||
           text.includes('::update');
  }

  hasComplexLogic(text) {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.length > 20 || 
           (text.match(/if \(/g) || []).length > 3 ||
           (text.match(/foreach/g) || []).length > 1;
  }

  hasBusinessLogic(text) {
    return (text.includes('if (') && text.includes('calculate')) ||
           (text.includes('foreach') && text.includes('process')) ||
           text.includes('validate') ||
           text.includes('transform');
  }

  getMethodName(node) {
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }
    return 'unknown';
  }
}

