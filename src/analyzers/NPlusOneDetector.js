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
 * Детектор N+1 проблем с запросами к базе данных
 */
export class NPlusOneDetector {
  constructor() {
    this.parser = getParser();
  }

  /**
   * Анализирует код на наличие N+1 запросов
   *
   * @param string code Исходный код PHP
   * @param string filePath Путь к файлу
   * @return array
   */
  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    this.detectNPlusOne(code, filePath, tree.rootNode, issues);

    return issues;
  }

  /**
   * Определяет паттерны N+1 запросов
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  detectNPlusOne(code, filePath, node, issues) {
    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodText = node.text;
      const methodName = this.getMethodName(node);
      const line = node.startPosition.row + 1;

      const hasLoop = this.hasLoop(methodText);
      const hasRelationshipAccess = this.hasRelationshipAccess(methodText);
      const hasEagerLoading = this.hasEagerLoading(methodText);

      if (hasLoop && hasRelationshipAccess && !hasEagerLoading) {
        issues.push({
          type: 'n_plus_one_query',
          severity: 'critical',
          message: `Potential N+1 query in "${methodName}": relationship access inside loop without eager loading`,
          filePath,
          line: line,
          suggestion: 'Use eager loading with ->with([\'relationName\']) before the loop to prevent N+1 queries',
          refactorInfo: {
            methodName,
            pattern: 'loop_with_relationship',
            recommendation: 'Add ->with() to the query before looping'
          }
        });
      }

      if (this.hasLazyLoadingInBlade(methodText)) {
        issues.push({
          type: 'n_plus_one_blade',
          severity: 'major',
          message: `Potential N+1 in view: passing collection without eager loading`,
          filePath,
          line: line,
          suggestion: 'Eager load relationships before passing to view: $items->load(\'relation\')'
        });
      }

      if (this.hasQueryInLoop(methodText)) {
        issues.push({
          type: 'query_in_loop',
          severity: 'critical',
          message: 'Database query inside loop',
          filePath,
          line: line,
          suggestion: 'Move query outside loop and eager load data, or use whereIn() with collected IDs'
        });
      }

      if (this.hasMissingWith(code, methodText)) {
        issues.push({
          type: 'missing_eager_loading',
          severity: 'major',
          message: 'Model query without eager loading before collection iteration',
          filePath,
          line: line,
          suggestion: 'Add ->with([\'relationships\']) to prevent lazy loading during iteration'
        });
      }
    }

    for (const child of node.children) {
      this.detectNPlusOne(code, filePath, child, issues);
    }
  }

  /**
   * Проверяет наличие цикла в коде
   *
   * @param string text
   * @return bool
   */
  hasLoop(text) {
    return text.includes('foreach') || 
           text.includes('for (') || 
           text.includes('while (') ||
           text.includes('->each(') ||
           text.includes('->map(');
  }

  /**
   * Проверяет обращение к отношениям модели
   *
   * @param string text
   * @return bool
   */
  hasRelationshipAccess(text) {
    // Проверяем обращение к relationships (НЕ методы!)
    // Relationships обычно без скобок: $user->posts, $post->comments
    // Методы со скобками: $user->getName(), $post->isPublished()
    
    const relationshipPatterns = [
      // Property access БЕЗ скобок и не id/name/title/etc
      /\$\w+->((?!id|name|title|email|created_at|updated_at|deleted_at)[a-z_]\w*)\b(?!\s*\()/,
      /->load\(/,
      /->loadMissing\(/
    ];

    return relationshipPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Проверяет наличие eager loading
   *
   * @param string text
   * @return bool
   */
  hasEagerLoading(text) {
    return text.includes('->with(') || 
           text.includes('::with(') ||
           text.includes('->load(');
  }

  /**
   * Проверяет lazy loading в Blade шаблонах
   *
   * @param string text
   * @return bool
   */
  hasLazyLoadingInBlade(text) {
    const hasViewReturn = text.includes('view(') || text.includes('return view');
    const hasModelGet = text.includes('->get()') || text.includes('::all()');
    const noEagerLoading = !this.hasEagerLoading(text);

    return hasViewReturn && hasModelGet && noEagerLoading;
  }

  /**
   * Проверяет наличие запроса внутри цикла
   *
   * @param string text
   * @return bool
   */
  hasQueryInLoop(text) {
    const loops = text.match(/foreach.*?\{[\s\S]*?\}/g) || 
                  text.match(/for\s*\(.*?\).*?\{[\s\S]*?\}/g) ||
                  [];

    for (const loop of loops) {
      if (loop.includes('::find') || 
          loop.includes('::where') || 
          loop.includes('::first') ||
          loop.includes('DB::')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Проверяет отсутствие with() перед использованием коллекции
   *
   * @param string fullCode
   * @param string methodText
   * @return bool
   */
  hasMissingWith(fullCode, methodText) {
    const hasGetOrAll = methodText.includes('->get()') || methodText.includes('::all()');
    const hasNoWith = !methodText.includes('->with(') && !methodText.includes('::with(');
    const usesRelationships = this.hasRelationshipAccess(methodText);
    const hasLoop = this.hasLoop(methodText);

    // Не флажим если в методе есть ->with() где-то
    // (может быть выше по коду, вне цикла)
    if (methodText.includes('with(')) {
      return false;
    }

    // Не флажим если есть eager loading и цикл
    // Это значит что отношения предзагружены
    if (hasLoop && hasGetOrAll && !hasNoWith) {
      return false;
    }

    return hasGetOrAll && hasNoWith && usesRelationships && hasLoop;
  }

  /**
   * Получает имя метода
   *
   * @param object node
   * @return string
   */
  getMethodName(node) {
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }
    return 'anonymous';
  }
}

