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
 * Анализатор проблем производительности
 */
export class PerformanceAnalyzer {
  constructor() {
    this.parser = getParser();
  }

  /**
   * Анализирует код на наличие проблем производительности
   *
   * @param string code Исходный код PHP
   * @param string filePath Путь к файлу
   * @return array
   */
  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    this.checkUnoptimizedQueries(code, filePath, tree.rootNode, issues);
    this.checkMissingIndexes(code, filePath, issues);
    this.checkMissingTransactions(code, filePath, tree.rootNode, issues);
    this.checkSelectAll(code, filePath, tree.rootNode, issues);
    this.checkMissingCache(code, filePath, tree.rootNode, issues);
    this.checkInefficinetLoops(code, filePath, tree.rootNode, issues);

    return issues;
  }

  /**
   * Проверяет неоптимизированные запросы
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkUnoptimizedQueries(code, filePath, node, issues) {
    const text = node.text || '';

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = text;
      const line = node.startPosition.row + 1;

      // Проверка неоптимизированных запросов
      if (methodText.includes('->get()') || methodText.includes('::get()')) {
        // Разделяем метод на строки для лучшего анализа
        const lines = methodText.split('\n');
        
        // Проверяем есть ли where условия где-то в методе
        const hasWhere = methodText.includes('->where(') || 
                        methodText.includes('->whereIn(') ||
                        methodText.includes('->whereHas(') ||
                        methodText.includes('->whereNotNull(') ||
                        methodText.includes('->whereNull(') ||
                        methodText.includes('->whereBetween(') ||
                        methodText.includes('->whereDate(') ||
                        methodText.includes('->whereYear(') ||
                        methodText.includes('->whereTime(') ||
                        methodText.includes('::where(');
        
        const hasLimit = methodText.includes('->limit(') || 
                        methodText.includes('->take(') ||
                        methodText.includes('->paginate(') ||
                        methodText.includes('->simplePaginate(');
        
        const hasWith = methodText.includes('->with(') || 
                       methodText.includes('::with(') ||
                       methodText.includes('with([');
        
        const hasSelect = methodText.includes('->select(');
        
        const hasOrderBy = methodText.includes('->orderBy(');
        
        // Если есть ->get() или ::get()
        const hasGet = methodText.includes('->get()') || methodText.includes('::get()');
        
        // Флажим только если:
        // 1. Есть ->get() 
        // 2. НЕТ where, limit, with, select
        // И это не ::get() для справочников
        if (hasGet && !hasWhere && !hasLimit && !hasWith && !hasSelect) {
          // НО не флажим если есть orderBy - значит может быть разумное использование
          if (!hasOrderBy) {
            issues.push({
              type: 'query_without_limit',
              severity: 'major',
              message: 'Query fetches all records without WHERE or LIMIT',
              filePath,
              line: line,
              suggestion: 'Add ->where() conditions or ->limit() to prevent loading all records'
            });
          }
        }
      }

      // ::all() может быть OK для небольших справочных таблиц
      if (methodText.includes('::all()')) {
        // Исключаем очевидные справочники
        const isLikelyReferenceTable = /\b(Status|Type|Role|Permission|Category|Tag)\b/.test(methodText);
        
        if (!isLikelyReferenceTable) {
          issues.push({
            type: 'fetch_all_records',
            severity: 'major',
            message: 'Using ::all() loads entire table into memory',
            filePath,
            line: line,
            suggestion: 'Use ::get() with where() clause or paginate() for large datasets. OK for small reference tables.'
          });
        }
      }

      if (methodText.includes('count()') && methodText.includes('get()')) {
        issues.push({
          type: 'inefficient_count',
          severity: 'minor',
          message: 'Loading records just to count them',
          filePath,
          line: line,
          suggestion: 'Use ->count() directly on query instead of ->get()->count()'
        });
      }

      if (methodText.includes('->first()') && !methodText.includes('->orderBy(')) {
        issues.push({
          type: 'first_without_order',
          severity: 'minor',
          message: 'Using first() without orderBy() can return unpredictable results',
          filePath,
          line: line,
          suggestion: 'Add ->orderBy() before ->first() for consistent results'
        });
      }
    }

    for (const child of node.children) {
      this.checkUnoptimizedQueries(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет отсутствие индексов в миграциях
   *
   * @param string code
   * @param string filePath
   * @param array issues
   * @return void
   */
  checkMissingIndexes(code, filePath, issues) {
    if (!filePath.includes('migrations')) {
      return;
    }

    // Старый синтаксис foreign keys
    const hasOldForeignKey = code.includes('->foreign(');
    
    // Новый синтаксис автоматически создает индексы
    const hasModernForeignKey = code.includes('->foreignId(') || 
                                code.includes('->constrained()');
    
    const hasExplicitIndex = code.includes('->index(') || code.includes('->unique(');

    // Предупреждаем только если используется старый синтаксис БЕЗ индексов
    // (новый синтаксис ->foreignId()->constrained() создает индекс автоматически)
    if (hasOldForeignKey && !hasExplicitIndex && !hasModernForeignKey) {
      issues.push({
        type: 'missing_index',
        severity: 'major',
        message: 'Migration has foreign keys but no explicit indexes',
        filePath,
        line: 1,
        suggestion: 'Add ->index() for foreign key columns, or use ->foreignId()->constrained() (Laravel 7+)'
      });
    }

    const hasTimestamps = code.includes('->timestamps()');
    const hasDateIndex = code.includes('created_at') && code.includes('->index');

    if (hasTimestamps && !hasDateIndex) {
      issues.push({
        type: 'missing_date_index',
        severity: 'info',
        message: 'Consider adding index on created_at if used for sorting/filtering',
        filePath,
        line: 1,
        suggestion: 'Add $table->index(\'created_at\') if this field is frequently used in WHERE or ORDER BY'
      });
    }
  }

  /**
   * Проверяет отсутствие транзакций при множественных операциях
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkMissingTransactions(code, filePath, node, issues) {
    const text = node.text || '';

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = text;
      const line = node.startPosition.row + 1;

      const createCount = (methodText.match(/::create\(/g) || []).length;
      const updateCount = (methodText.match(/->update\(/g) || []).length;
      const deleteCount = (methodText.match(/->delete\(/g) || []).length;
      
      const totalModifications = createCount + updateCount + deleteCount;

      const hasTransaction = methodText.includes('DB::transaction') || 
                            methodText.includes('beginTransaction');

      // Проверяем есть ли IF ветки (операции могут быть в разных ветках)
      const hasConditionals = (methodText.match(/\bif\s*\(/g) || []).length;
      const hasElse = methodText.includes('else');

      // Если много операций И нет транзакции И нет условных веток
      // (условные ветки означают что операции могут не выполниться одновременно)
      if (totalModifications >= 3 && !hasTransaction && !(hasConditionals >= 2 || hasElse)) {
        issues.push({
          type: 'missing_transaction',
          severity: 'major',
          message: `Multiple database modifications (${totalModifications}) without transaction`,
          filePath,
          line: line,
          suggestion: 'Wrap multiple DB operations in DB::transaction(function() {...}) for data integrity'
        });
      }
    }

    for (const child of node.children) {
      this.checkMissingTransactions(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет использование SELECT *
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkSelectAll(code, filePath, node, issues) {
    const text = node.text || '';

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = text;
      const line = node.startPosition.row + 1;

      // Флажим только ->get() без select, где может быть много записей
      // ->first() обычно возвращает одну запись, SELECT * здесь OK
      if (methodText.includes('->get()') && !methodText.includes('->select(')) {
        // НЕ флажим если есть ограничения (where, limit, paginate)
        const hasFilters = methodText.includes('->where(') || 
                          methodText.includes('->whereIn(') ||
                          methodText.includes('->whereHas(') ||
                          methodText.includes('->whereNotNull(') ||
                          methodText.includes('->whereNull(') ||
                          methodText.includes('->whereBetween(') ||
                          methodText.includes('->whereDate(') ||
                          methodText.includes('->orderBy(') ||
                          methodText.includes('->limit(') ||
                          methodText.includes('->take(') ||
                          methodText.includes('->paginate(') ||
                          methodText.includes('->with(') ||
                          methodText.includes('::with(') ||
                          methodText.includes('->groupBy(');
        
        // Не флажим если запрос явно ограничен
        if (!hasFilters) {
          issues.push({
            type: 'select_all_columns',
            severity: 'minor',
            message: 'Query selects all columns (SELECT *)',
            filePath,
            line: line,
            suggestion: 'Use ->select([\'column1\', \'column2\']) to fetch only needed columns and reduce memory usage'
          });
        }
      }
    }

    for (const child of node.children) {
      this.checkSelectAll(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет отсутствие кеширования
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkMissingCache(code, filePath, node, issues) {
    const text = node.text || '';

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = text;
      const line = node.startPosition.row + 1;

      const hasExpensiveQuery = methodText.includes('->count()') || 
                               methodText.includes('->sum(') ||
                               methodText.includes('->avg(') ||
                               methodText.includes('join(') ||
                               methodText.includes('groupBy(');

      const hasCache = methodText.includes('Cache::') || 
                      methodText.includes('->remember(') ||
                      methodText.includes('cache(');

      if (hasExpensiveQuery && !hasCache) {
        issues.push({
          type: 'missing_cache',
          severity: 'info',
          message: 'Expensive query without caching',
          filePath,
          line: line,
          suggestion: 'Consider caching query results: Cache::remember(\'key\', $seconds, function() {...})'
        });
      }

      if (methodText.includes('::all()') && !hasCache && filePath.includes('Controller')) {
        issues.push({
          type: 'uncached_all',
          severity: 'minor',
          message: 'Loading all records without cache in controller',
          filePath,
          line: line,
          suggestion: 'Cache frequently accessed data with Cache::remember()'
        });
      }
    }

    for (const child of node.children) {
      this.checkMissingCache(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет неэффективные циклы
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  checkInefficinetLoops(code, filePath, node, issues) {
    const text = node.text || '';

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = text;
      const line = node.startPosition.row + 1;

      if (methodText.includes('foreach') && methodText.includes('array_push')) {
        issues.push({
          type: 'inefficient_array_build',
          severity: 'minor',
          message: 'Using array_push() in loop is slower than $arr[] = ',
          filePath,
          line: line,
          suggestion: 'Use $array[] = $value instead of array_push($array, $value)'
        });
      }

      if (methodText.includes('foreach') && methodText.includes('count(')) {
        const countPattern = /foreach\s*\([^)]*\)\s*\{[^}]*count\([^)]*\)/;
        if (countPattern.test(methodText)) {
          issues.push({
            type: 'count_in_loop',
            severity: 'minor',
            message: 'Calling count() inside loop on each iteration',
            filePath,
            line: line,
            suggestion: 'Store count() result in variable before loop'
          });
        }
      }
    }

    for (const child of node.children) {
      this.checkInefficinetLoops(code, filePath, child, issues);
    }
  }
}

