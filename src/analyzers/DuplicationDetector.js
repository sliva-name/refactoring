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
 * Продвинутый детектор дублирования кода
 */
export class DuplicationDetector {
  constructor() {
    this.parser = getParser();
    this.minLinesForDuplication = 5;
    this.similarityThreshold = 0.85;
  }

  /**
   * Анализирует код на дублирование
   *
   * @param string code Исходный код PHP
   * @param string filePath Путь к файлу
   * @return array
   */
  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    this.detectDuplicateMethods(code, filePath, tree.rootNode, issues);
    this.detectDuplicateBlocks(code, filePath, tree.rootNode, issues);

    return issues;
  }

  /**
   * Находит дублирующиеся методы
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  detectDuplicateMethods(code, filePath, node, issues) {
    const methods = this.extractAllMethods(node);
    
    if (methods.length < 2) {
      return;
    }

    const compared = new Set();

    for (let i = 0; i < methods.length; i++) {
      for (let j = i + 1; j < methods.length; j++) {
        const method1 = methods[i];
        const method2 = methods[j];

        // Пропускаем если это тот же метод (по имени и строке)
        if (method1.name === method2.name && method1.line === method2.line) {
          continue;
        }

        const key = `${method1.name}:${method2.name}`;
        if (compared.has(key)) continue;
        compared.add(key);

        const similarity = this.calculateSimilarity(
          method1.body,
          method2.body
        );

        // Similarity не может быть больше 1.0
        const normalizedSimilarity = Math.min(similarity, 1.0);

        // Пропускаем очень маленькие методы (например геттеры/сеттеры)
        if (method1.linesCount < 3 || method2.linesCount < 3) {
          continue;
        }

        if (normalizedSimilarity >= this.similarityThreshold) {
          issues.push({
            type: 'duplicate_method',
            severity: 'major',
            message: `Methods "${method1.name}" and "${method2.name}" are ${Math.round(normalizedSimilarity * 100)}% similar`,
            filePath,
            line: method1.line,
            suggestion: 'Extract common logic into a shared private method or trait',
            refactorInfo: {
              method1: method1.name,
              method2: method2.name,
              similarity: normalizedSimilarity,
              lines1: `${method1.line}-${method1.endLine}`,
              lines2: `${method2.line}-${method2.endLine}`
            }
          });
        }
      }
    }
  }

  /**
   * Находит дублирующиеся блоки кода
   *
   * @param string code
   * @param string filePath
   * @param object node
   * @param array issues
   * @return void
   */
  detectDuplicateBlocks(code, filePath, node, issues) {
    const blocks = this.extractCodeBlocks(code, node);
    const compared = new Set();

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const block1 = blocks[i];
        const block2 = blocks[j];

        // Пропускаем если это тот же самый блок
        if (block1.startLine === block2.startLine && block1.endLine === block2.endLine) {
          continue;
        }

        // Пропускаем если блоки перекрываются
        if (this.blocksOverlap(block1, block2)) {
          continue;
        }

        const key = `${block1.startLine}:${block2.startLine}`;
        if (compared.has(key)) continue;
        compared.add(key);

        const linesCount = block1.endLine - block1.startLine;
        if (linesCount < this.minLinesForDuplication) {
          continue;
        }

        const similarity = this.calculateSimilarity(block1.code, block2.code);

        // Similarity не может быть больше 1.0 (100%)
        if (similarity > 1.0) {
          similarity = 1.0;
        }

        // Фильтруем маршруты и конфигурацию (они часто похожи но не дублируются)
        if (this.isRouteLikeCode(block1.code) && this.isRouteLikeCode(block2.code)) {
          continue;
        }

        if (similarity >= this.similarityThreshold) {
          issues.push({
            type: 'duplicate_code_block',
            severity: 'minor',
            message: `Code block at lines ${block1.startLine}-${block1.endLine} is ${Math.round(similarity * 100)}% similar to lines ${block2.startLine}-${block2.endLine}`,
            filePath,
            line: block1.startLine,
            suggestion: 'Extract duplicate code into a separate method',
            refactorInfo: {
              block1Lines: `${block1.startLine}-${block1.endLine}`,
              block2Lines: `${block2.startLine}-${block2.endLine}`,
              similarity: similarity,
              linesCount: linesCount
            }
          });
        }
      }
    }
  }

  /**
   * Извлекает все методы из кода
   *
   * @param object node
   * @return array
   */
  extractAllMethods(node) {
    const methods = [];

    const walk = (n) => {
      if (n.type === 'method_declaration') {
        const name = this.getMethodName(n);
        const body = this.normalizeCode(n.text);
        const linesCount = n.endPosition.row - n.startPosition.row;

        if (linesCount >= this.minLinesForDuplication) {
          methods.push({
            name: name,
            body: body,
            line: n.startPosition.row + 1,
            endLine: n.endPosition.row + 1,
            linesCount: linesCount
          });
        }
      }

      for (const child of n.children) {
        walk(child);
      }
    };

    walk(node);
    return methods;
  }

  /**
   * Извлекает блоки кода
   *
   * @param string code
   * @param object node
   * @return array
   */
  extractCodeBlocks(code, node) {
    const blocks = [];
    const lines = code.split('\n');

    const walk = (n) => {
      if (n.type === 'compound_statement' || n.type === 'expression_statement') {
        const startLine = n.startPosition.row;
        const endLine = n.endPosition.row;
        const linesCount = endLine - startLine;

        if (linesCount >= this.minLinesForDuplication) {
          const blockCode = lines.slice(startLine, endLine + 1).join('\n');
          const normalized = this.normalizeCode(blockCode);

          blocks.push({
            code: normalized,
            startLine: startLine + 1,
            endLine: endLine + 1,
            linesCount: linesCount
          });
        }
      }

      for (const child of n.children) {
        walk(child);
      }
    };

    walk(node);
    return blocks;
  }

  /**
   * Вычисляет схожесть двух блоков кода
   *
   * @param string code1
   * @param string code2
   * @return number
   */
  calculateSimilarity(code1, code2) {
    const tokens1 = this.tokenize(code1);
    const tokens2 = this.tokenize(code2);

    if (tokens1.length === 0 || tokens2.length === 0) {
      return 0;
    }

    const intersection = tokens1.filter(token => tokens2.includes(token));
    const union = [...new Set([...tokens1, ...tokens2])];

    // Дополнительная защита от деления на 0 (хотя технически невозможно)
    if (union.length === 0) {
      return 0;
    }

    return intersection.length / union.length;
  }

  /**
   * Токенизирует код
   *
   * @param string code
   * @return array
   */
  tokenize(code) {
    const normalized = this.normalizeCode(code);
    
    return normalized
      .split(/\s+/)
      .filter(token => token.length > 0)
      .filter(token => !this.isComment(token));
  }

  /**
   * Нормализует код для сравнения
   *
   * @param string code
   * @return string
   */
  normalizeCode(code) {
    return code
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\$[a-zA-Z_][a-zA-Z0-9_]*/g, '$VAR')
      .replace(/'[^']*'/g, "'STRING'")
      .replace(/"[^"]*"/g, '"STRING"')
      .replace(/\d+/g, 'NUM')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Проверяет является ли токен комментарием
   *
   * @param string token
   * @return bool
   */
  isComment(token) {
    return token.startsWith('//') || 
           token.startsWith('/*') || 
           token.startsWith('*');
  }

  /**
   * Получает имя метода
   *
   * @param object node
   * @return string
   */
  /**
   * Проверяет перекрываются ли блоки
   *
   * @param object block1
   * @param object block2
   * @return bool
   */
  blocksOverlap(block1, block2) {
    return (block1.startLine <= block2.endLine && block1.endLine >= block2.startLine);
  }

  /**
   * Проверяет является ли код маршрутами или конфигурацией
   *
   * @param string code
   * @return bool
   */
  isRouteLikeCode(code) {
    // Маршруты (routes)
    if (code.includes('Route::') && 
        (code.includes('->group(') || code.includes('->middleware(') || code.includes('->prefix('))) {
      return true;
    }

    // Конфигурация
    if (code.match(/['"][a-z_]+['"]\s*=>\s*['"]/) && code.includes('[') && code.includes(']')) {
      return true;
    }

    // Миграции с похожей структурой
    if (code.includes('$table->') && code.includes('Schema::')) {
      return true;
    }

    return false;
  }

  getMethodName(node) {
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }
    return 'anonymous';
  }
}

