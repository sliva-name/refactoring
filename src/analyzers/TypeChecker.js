import Parser from 'tree-sitter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PHP = require('tree-sitter-php');

const getParser = () => {
  const parser = new Parser();
  parser.setLanguage(PHP);
  return parser;
};

export class TypeChecker {
  analyze(code, filePath) {
    const parser = getParser();
    const tree = parser.parse(code);
    const issues = [];

    this.analyzeTypes(code, filePath, tree.rootNode, issues);

    return issues;
  }

  analyzeTypes(code, filePath, node, issues) {
    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      this.checkMethodParameters(node, filePath, issues);
      this.checkReturnTypes(node, filePath, issues);
      this.checkMixedTypes(node, code, filePath, issues);
    }

    for (const child of node.children) {
      this.analyzeTypes(code, filePath, child, issues);
    }
  }

  checkMethodParameters(node, filePath, issues) {
    const parameters = this.getParameters(node);
    
    // Если параметров нет - не проверяем
    if (parameters.length === 0) {
      return;
    }

    parameters.forEach((param, index) => {
      const hasType = param.type;
      
      if (!hasType) {
        issues.push({
          type: 'missing_type_hint',
          severity: 'major',
          message: `Parameter #${index + 1} is missing type hint`,
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Add type hints for better IDE support and code clarity'
        });
      }

      if (param.type === 'mixed') {
        issues.push({
          type: 'mixed_type',
          severity: 'minor',
          message: `Parameter #${index + 1} uses mixed type`,
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Consider using more specific types or union types (int|string|null)'
        });
      }
    });
  }

  checkReturnTypes(node, filePath, issues) {
    const returnType = this.getReturnType(node);
    
    // Конструкторы и деструкторы не требуют return type
    const methodText = node.text || '';
    const isConstructor = methodText.includes('function __construct') || 
                          methodText.includes('function __destruct');

    if (!returnType && !isConstructor) {
      issues.push({
        type: 'missing_return_type',
        severity: 'major',
        message: 'Method is missing return type declaration',
        filePath,
        line: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        suggestion: 'Add return type hints for better type safety'
      });
    }

    if (returnType === 'mixed') {
      issues.push({
        type: 'mixed_return_type',
        severity: 'minor',
        message: 'Return type is mixed',
        filePath,
        line: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        suggestion: 'Consider using more specific return types'
      });
    }
  }

  checkMixedTypes(node, code, filePath, issues) {
    const text = node.text;

    if (text.includes('array') && !text.includes(': array')) {
      const arrays = text.match(/\barray\s*(\(|\[)/g);
      
      if (arrays && !text.includes('@return')) {
        issues.push({
          type: 'missing_doc_type',
          severity: 'info',
          message: 'Array usage without type annotation',
          filePath,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          suggestion: 'Add PHPDoc with array shape or use @return array'
        });
      }
    }
  }

  getParameters(node) {
    const params = [];
    // Find parameters node
    let paramList = null;
    for (const child of node.children) {
      if (child.type === 'formal_parameters' || child.type === 'parameters') {
        paramList = child;
        break;
      }
    }

    if (!paramList) return params;

    this.walkParameters(paramList, params);
    return params;
  }

  walkParameters(node, params) {
    // Обрабатываем только реальные параметры
    if (node.type === 'simple_parameter' || node.type === 'property_promotion_parameter') {
      let paramName = null;
      let typeHint = null;
      
      for (const child of node.children) {
        if (child.type === 'variable_name') paramName = child;
        if (child.type === 'named_type' || child.type === 'primitive_type' || child.type === 'union_type') {
          typeHint = child;
        }
      }

      // Добавляем только если нашли имя параметра (избегаем дубликатов)
      if (paramName) {
        params.push({
          name: paramName.text,
          type: typeHint ? typeHint.text : null
        });
      }
      return; // Не идем глубже для параметров
    }

    // Продолжаем обход для других узлов
    for (const child of node.children) {
      this.walkParameters(child, params);
    }
  }

  getReturnType(node) {
    // Look for return type in children
    for (const child of node.children) {
      if (child.type.includes('return_type') || child.type.includes('type')) {
        return child.text;
      }
    }
    return null;
  }
}

