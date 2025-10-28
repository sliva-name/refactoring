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
 * Анализатор безопасности для поиска потенциальных уязвимостей
 */
export class SecurityAnalyzer {
  constructor() {
    this.parser = getParser();
  }

  /**
   * Анализирует код на наличие проблем безопасности
   *
   * @param string code Исходный код PHP
   * @param string filePath Путь к файлу
   * @return array
   */
  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    this.checkSqlInjection(code, filePath, tree.rootNode, issues);
    this.checkXssVulnerabilities(code, filePath, tree.rootNode, issues);
    this.checkMassAssignment(code, filePath, issues);
    this.checkDangerousFunctions(code, filePath, tree.rootNode, issues);
    this.checkPasswordSecurity(code, filePath, tree.rootNode, issues);
    this.checkFileUploadSecurity(code, filePath, tree.rootNode, issues);
    this.checkCsrfProtection(code, filePath, issues);
    
    // Проверка extract() один раз на весь файл
    this.checkExtractUsage(code, filePath, issues);

    return issues;
  }

  /**
   * Проверяет наличие SQL Injection уязвимостей
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkSqlInjection(code, filePath, node, issues) {
    const text = node.text || '';

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = text;
      const line = node.startPosition.row + 1;

      // Проверяем DB::raw с переменными (но исключаем уже безопасный код)
      if (methodText.includes('DB::raw')) {
        const hasVariableInterpolation = /DB::raw\s*\(\s*["'][^"']*\$[^"']*["']/.test(methodText);
        const hasParameterBinding = /DB::raw\s*\([^,]+,\s*\[/.test(methodText);
        
        if (hasVariableInterpolation && !hasParameterBinding) {
          issues.push({
            type: 'sql_injection_risk',
            severity: 'critical',
            message: 'Potential SQL Injection: DB::raw() with string interpolation',
            filePath,
            line: line,
            endLine: node.endPosition.row + 1,
            suggestion: 'Use parameter binding: DB::raw("query WHERE id = ?", [$id]) or use Query Builder methods'
          });
        }
      }

      // Проверяем whereRaw/selectRaw с переменными
      if (methodText.includes('whereRaw') || methodText.includes('selectRaw')) {
        const hasVariableInRaw = /(whereRaw|selectRaw)\s*\(\s*["'][^"']*\$[^"']*["']/.test(methodText);
        const hasConcatenation = /(whereRaw|selectRaw)\s*\([^)]*\./.test(methodText);
        const hasBinding = /(whereRaw|selectRaw)\s*\([^,]+,\s*\[/.test(methodText);
        
        if ((hasVariableInRaw || hasConcatenation) && !hasBinding) {
          issues.push({
            type: 'sql_injection_risk',
            severity: 'critical',
            message: 'Potential SQL Injection: Raw query methods with variables',
            filePath,
            line: line,
            endLine: node.endPosition.row + 1,
            suggestion: 'Use parameter binding with ? placeholders and pass variables as second argument'
          });
        }
      }

      const rawQueryPattern = /query\s*\(\s*["'].*\$.*["']\s*\)/;
      if (rawQueryPattern.test(methodText)) {
        issues.push({
          type: 'sql_injection_risk',
          severity: 'critical',
          message: 'Potential SQL Injection: String concatenation in query',
          filePath,
          line: line,
          endLine: node.endPosition.row + 1,
          suggestion: 'Never concatenate user input into SQL queries. Use parameter binding'
        });
      }
    }

    for (const child of node.children) {
      this.checkSqlInjection(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет наличие XSS уязвимостей
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkXssVulnerabilities(code, filePath, node, issues) {
    const text = node.text || '';

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = text;
      const line = node.startPosition.row + 1;

      if (methodText.includes('{!!') && !methodText.includes('csrf')) {
        issues.push({
          type: 'xss_vulnerability',
          severity: 'critical',
          message: 'Potential XSS: Unescaped output with {!! !!}',
          filePath,
          line: line,
          endLine: node.endPosition.row + 1,
          suggestion: 'Use {{ }} for automatic escaping unless you explicitly trust the content'
        });
      }

      // Проверяем только если есть прямое использование невалидированных данных из $request
      if (methodText.includes('response()->json') && 
          (methodText.includes('$request->input') || 
           methodText.includes('$request->all()') || 
           methodText.includes('$request->get(') ||
           methodText.includes('$request->post(') ||
           methodText.includes('$request->query('))) {
        issues.push({
          type: 'xss_risk',
          severity: 'major',
          message: 'User input directly in JSON response without validation',
          filePath,
          line: line,
          endLine: node.endPosition.row + 1,
          suggestion: 'Validate and sanitize user input before outputting, use Resources for API responses'
        });
      }
    }

    for (const child of node.children) {
      this.checkXssVulnerabilities(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет защиту от Mass Assignment
   *
   * @param string code
   * @param string filePath
   * @param array issues
   * @return void
   */
  checkMassAssignment(code, filePath, issues) {
    const isModel = code.includes('extends Model') || code.includes('use HasFactory');

    if (isModel) {
      if (!code.includes('$fillable') && !code.includes('$guarded')) {
        issues.push({
          type: 'mass_assignment_vulnerability',
          severity: 'critical',
          message: 'Model without $fillable or $guarded protection',
          filePath,
          line: 1,
          suggestion: 'Add protected $fillable = [...] to prevent mass assignment vulnerabilities'
        });
      }

      if (code.includes('$guarded = []')) {
        issues.push({
          type: 'mass_assignment_risk',
          severity: 'major',
          message: 'Model with empty $guarded allows mass assignment of all fields',
          filePath,
          line: 1,
          suggestion: 'Use $fillable with explicit field list instead of empty $guarded'
        });
      }

      if (code.includes('::create($request->all())') || code.includes('::update($request->all())')) {
        issues.push({
          type: 'mass_assignment_risk',
          severity: 'critical',
          message: 'Using $request->all() for mass assignment without validation',
          filePath,
          line: 1,
          suggestion: 'Use validated data: Model::create($request->validated())'
        });
      }
    }
  }

  /**
   * Проверяет использование опасных функций
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkDangerousFunctions(code, filePath, node, issues) {
    const dangerousFunctions = ['eval', 'exec', 'shell_exec', 'system', 'passthru', 'unserialize'];

    if (node.type === 'function_call_expression') {
      const functionName = this.getFunctionName(node);
      
      if (dangerousFunctions.includes(functionName)) {
        const line = node.startPosition.row + 1;
        issues.push({
          type: 'dangerous_function',
          severity: 'critical',
          message: `Dangerous function ${functionName}() can lead to code execution vulnerabilities`,
          filePath,
          line: line,
          endLine: line,  // Одна строка для вызова функции
          suggestion: `Avoid using ${functionName}(). If absolutely necessary, sanitize all inputs rigorously`
        });
      }
    }

    for (const child of node.children) {
      this.checkDangerousFunctions(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет использование extract() с суперглобальными переменными
   *
   * @param string code
   * @param string filePath
   * @param array issues
   * @return void
   */
  checkExtractUsage(code, filePath, issues) {
    // Проверяем только если есть extract()
    if (code.includes('extract(')) {
      // Находим все использования extract() через AST для точной локализации
      const tree = this.parser.parse(code);
      
      const extractInfo = [];
      
      const findExtractCalls = (node) => {
        if (node.type === 'function_call_expression') {
          const functionName = this.getFunctionName(node);
          const nodeText = node.text || '';
          
          if (functionName === 'extract' || nodeText.includes('extract($_')) {
            // Получаем аргумент extract()
            const args = this.getFunctionArguments(node);
            const line = node.startPosition.row + 1;
            const endLine = node.endPosition.row + 1;
            
            // Проверяем аргумент на наличие суперглобальных
            const hasSuperGlobal = nodeText.includes('$_GET') || 
                                  nodeText.includes('$_POST') || 
                                  nodeText.includes('$_REQUEST') || 
                                  nodeText.includes('$_ENV') ||
                                  nodeText.includes('$_SERVER') || 
                                  nodeText.includes('$_FILES');
            
            extractInfo.push({
              line,
              endLine,
              hasSuperGlobal
            });
          }
        }
        
        for (const child of node.children || []) {
          findExtractCalls(child);
        }
      };
      
      findExtractCalls(tree.rootNode);
      
      // Добавляем проблему только один раз на каждый вызов extract()
      extractInfo.forEach(info => {
        const message = info.hasSuperGlobal
          ? 'Using extract() with superglobals can overwrite variables'
          : 'Using extract() is dangerous and can cause security issues';
          
        issues.push({
          type: 'dangerous_extract',
          severity: 'major',
          message: message,
          filePath,
          line: info.line,
          endLine: info.endLine,
          suggestion: 'Avoid extract() or use EXTR_SKIP flag and never with user input'
        });
      });
    }
  }
  
  getFunctionArguments(node) {
    const args = [];
    let foundArgs = false;
    
    for (const child of node.children || []) {
      if (foundArgs && child.type === 'arguments') {
        // Извлекаем текстовые аргументы
        const argText = child.text || '';
        if (argText.length > 0) {
          args.push(argText);
        }
      }
      if (child.type === 'call_expression') {
        foundArgs = true;
      }
    }
    
    return args;
  }

  /**
   * Проверяет безопасность работы с паролями
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkPasswordSecurity(code, filePath, node, issues) {
    const text = node.text || '';

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = text;
      const line = node.startPosition.row + 1;

      // Проверяем только прямые присваивания пароля из невалидированных источников
      const hasPasswordAssignment = (methodText.includes('password') || methodText.includes('pwd')) &&
                                    (methodText.includes('= $request->') || 
                                     methodText.includes('= $_POST') ||
                                     methodText.includes('= $_GET') ||
                                     methodText.includes('->password =') ||
                                     methodText.includes('[\'password\'] ='));
      
      const hasHashing = methodText.includes('password_hash') || 
                        methodText.includes('Hash::make') || 
                        methodText.includes('bcrypt(') ||
                        methodText.includes('Hash::check');

      // Флагим только если есть присвоение пароля БЕЗ хеширования
      if (hasPasswordAssignment && !hasHashing) {
      issues.push({
        type: 'password_not_hashed',
        severity: 'critical',
        message: 'Password stored without hashing',
        filePath,
        line: line,
        endLine: node.endPosition.row + 1,
        suggestion: 'Use Hash::make($password) or bcrypt($password) to hash passwords'
      });
      }

      if (methodText.includes('md5') || methodText.includes('sha1')) {
        issues.push({
          type: 'weak_hashing',
          severity: 'major',
          message: 'Using weak hashing algorithm (md5/sha1)',
          filePath,
          line: line,
          endLine: node.endPosition.row + 1,
          suggestion: 'Use bcrypt or Hash::make() for password hashing'
        });
      }
    }

    for (const child of node.children) {
      this.checkPasswordSecurity(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет безопасность загрузки файлов
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkFileUploadSecurity(code, filePath, node, issues) {
    const text = node.text || '';

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = text;
      const line = node.startPosition.row + 1;

      if (methodText.includes('$request->file') || methodText.includes('hasFile')) {
        const hasValidation = methodText.includes('mimes:') || 
                             methodText.includes('mimetypes:') ||
                             methodText.includes('max:');

        if (!hasValidation) {
          issues.push({
            type: 'file_upload_no_validation',
            severity: 'major',
            message: 'File upload without validation',
            filePath,
            line: line,
            endLine: node.endPosition.row + 1,
            suggestion: 'Validate file type, size and extension. Use Form Request validation with mimes: and max: rules'
          });
        }

        if (methodText.includes('move') && !methodText.includes('store')) {
          issues.push({
            type: 'unsafe_file_storage',
            severity: 'major',
            message: 'Using move() instead of Laravel storage methods',
            filePath,
            line: line,
            endLine: node.endPosition.row + 1,
            suggestion: 'Use $request->file()->store() or storeAs() for secure file handling'
          });
        }
      }
    }

    for (const child of node.children) {
      this.checkFileUploadSecurity(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет наличие CSRF защиты
   *
   * @param string code
   * @param string filePath
   * @param array issues
   * @return void
   */
  checkCsrfProtection(code, filePath, issues) {
    if (filePath.includes('views/') && code.includes('<form') && !code.includes('@csrf')) {
      issues.push({
        type: 'missing_csrf',
        severity: 'critical',
        message: 'Form without @csrf token',
        filePath,
        line: 1,
        suggestion: 'Add @csrf directive inside all forms for CSRF protection'
      });
    }
  }

  /**
   * Получает имя вызываемой функции
   *
   * @param object node
   * @return string
   */
  getFunctionName(node) {
    for (const child of node.children) {
      // Ищем qualified_name или name в children
      if (child.type === 'name' || child.type === 'qualified_name') {
        return child.text;
      }
      // Возможно имя вложено глубже
      if (child.children) {
        for (const grandchild of child.children) {
          if (grandchild.type === 'name') {
            return grandchild.text;
          }
        }
      }
    }
    return '';
  }
}

