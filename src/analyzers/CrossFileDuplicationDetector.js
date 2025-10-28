import Parser from 'tree-sitter';
import { createRequire } from 'module';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
const PHP = require('tree-sitter-php');

const getParser = () => {
  const parser = new Parser();
  parser.setLanguage(PHP);
  return parser;
};

/**
 * Межфайловый детектор дублирования кода
 * 
 * Решает проблему: находить дублирование между разными файлами
 */
export class CrossFileDuplicationDetector {
  constructor(allFiles = []) {
    this.parser = getParser();
    this.allFiles = allFiles;
    this.minLinesForDuplication = 5;
    this.similarityThreshold = 0.85;
    this.methodHashes = new Map();
  }

  /**
   * Анализирует все файлы на межфайловое дублирование
   * 
   * @param array filesData Массив { filePath, content }
   * @return array
   */
  analyze(filesData) {
    const issues = [];
    
    // Шаг 1: Извлекаем все методы из всех файлов
    const allMethods = this.extractAllMethodsFromFiles(filesData);
    
    // Шаг 2: Группируем методы по хешам
    const methodGroups = this.groupMethodsByHash(allMethods);
    
    // Шаг 3: Находим дублирование между группами
    for (const [hash, methods] of methodGroups.entries()) {
      if (methods.length > 1) {
        // Нашли дублирование!
        const duplicates = this.findDuplicatePairs(methods);
        
        for (const duplicate of duplicates) {
          issues.push({
            type: 'cross_file_duplication',
            severity: 'major',
            message: `Method "${duplicate.method1.name}" in ${duplicate.file1}:${duplicate.line1} is ${Math.round(duplicate.similarity * 100)}% similar to "${duplicate.method2.name}" in ${duplicate.file2}:${duplicate.line2}`,
            filePath: duplicate.file1,
            line: duplicate.line1,
            suggestion: 'Extract common logic into a shared Service, Trait, or Helper class',
            refactorInfo: {
              method1: {
                file: duplicate.file1,
                name: duplicate.method1.name,
                lines: `${duplicate.line1}-${duplicate.endLine1}`
              },
              method2: {
                file: duplicate.file2,
                name: duplicate.method2.name,
                lines: `${duplicate.line2}-${duplicate.endLine2}`
              },
              similarity: duplicate.similarity
            }
          });
        }
      }
    }

    return issues;
  }

  /**
   * Извлекает все методы из всех файлов
   */
  extractAllMethodsFromFiles(filesData) {
    const allMethods = [];

    for (const fileData of filesData) {
      try {
        const tree = this.parser.parse(fileData.content);
        const methods = this.extractMethods(tree.rootNode);
        
        for (const method of methods) {
          allMethods.push({
            ...method,
            filePath: fileData.filePath
          });
        }
      } catch (error) {
          console.warn(`Error parsing ${fileData.filePath}:`, error.message);
        }
    }

    return allMethods;
  }

  /**
   * Извлекает методы из AST узла
   */
  extractMethods(node) {
    const methods = [];

    const walk = (n) => {
      if (n.type === 'method_declaration') {
        const name = this.getMethodName(n);
        const body = n.text;
        const normalized = this.normalizeCode(body);
        const linesCount = n.endPosition.row - n.startPosition.row;

        // Пропускаем слишком короткие методы
        if (linesCount < this.minLinesForDuplication) {
          return;
        }

        methods.push({
          name,
          body,
          normalized,
          line: n.startPosition.row + 1,
          endLine: n.endPosition.row + 1,
          linesCount
        });
      }

      for (const child of n.children) {
        walk(child);
      }
    };

    walk(node);
    return methods;
  }

  /**
   * Группирует методы по хешу для быстрого поиска
   */
  groupMethodsByHash(methods) {
    const groups = new Map();

    for (const method of methods) {
      const hash = this.hashCode(method.normalized);
      
      if (!groups.has(hash)) {
        groups.set(hash, []);
      }
      
      groups.get(hash).push(method);
    }

    return groups;
  }

  /**
   * Находит пары дублирующихся методов
   */
  findDuplicatePairs(methods) {
    const duplicates = [];

    for (let i = 0; i < methods.length; i++) {
      for (let j = i + 1; j < methods.length; j++) {
        const method1 = methods[i];
        const method2 = methods[j];

        // Пропускаем если методы в одном файле (это задача обычного DuplicationDetector)
        if (method1.filePath === method2.filePath) {
          continue;
        }

        const similarity = this.calculateSimilarity(method1.normalized, method2.normalized);

        if (similarity >= this.similarityThreshold) {
          duplicates.push({
            method1,
            method2,
            file1: method1.filePath,
            file2: method2.filePath,
            line1: method1.line,
            line2: method2.line,
            endLine1: method1.endLine,
            endLine2: method2.endLine,
            similarity
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Нормализует код для сравнения
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
   * Вычисляет схожесть
   */
  calculateSimilarity(normalized1, normalized2) {
    const tokens1 = this.tokenize(normalized1);
    const tokens2 = this.tokenize(normalized2);

    if (tokens1.length === 0 || tokens2.length === 0) {
      return 0;
    }

    const intersection = tokens1.filter(token => tokens2.includes(token));
    const union = [...new Set([...tokens1, ...tokens2])];

    if (union.length === 0) {
      return 0;
    }

    return intersection.length / union.length;
  }

  /**
   * Токенизирует код
   */
  tokenize(code) {
    return code
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Создает хеш для быстрого сравнения
   */
  hashCode(str) {
    const hash = crypto.createHash('md5');
    hash.update(str);
    return hash.digest('hex');
  }

  /**
   * Получает имя метода
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

