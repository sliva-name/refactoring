import Parser from 'tree-sitter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PHP = require('tree-sitter-php');

const getParser = () => {
  const parser = new Parser();
  parser.setLanguage(PHP);
  return parser;
};

export class DocBlockAnalyzer {
  analyze(code, filePath) {
    const parser = getParser();
    const tree = parser.parse(code);
    const issues = [];

    this.analyzeDocBlocks(code, filePath, tree.rootNode, issues);

    return issues;
  }

  analyzeDocBlocks(code, filePath, node, issues) {
    if (node.type === 'class_declaration') {
      this.checkClassDocBlock(node, filePath, issues);
    }

    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      this.checkMethodDocBlock(node, filePath, issues);
    }

    if (node.type === 'property_declaration') {
      this.checkPropertyDocBlock(node, filePath, issues);
    }

    for (const child of node.children) {
      this.analyzeDocBlocks(code, filePath, child, issues);
    }
  }

  checkClassDocBlock(node, filePath, issues) {
    const docBlock = this.getDocBlock(node);
    const className = this.getClassName(node);

    if (!docBlock) {
      issues.push({
        type: 'missing_class_doc',
        severity: 'minor',
        message: `Class "${className}" is missing PHPDoc comment`,
        filePath,
        line: node.startPosition.row + 1,
        suggestion: 'Add PHPDoc comment describing the class purpose'
      });
      return;
    }

    if (!docBlock.includes('@package') && !filePath.includes('app/')) {
      issues.push({
        type: 'missing_package_tag',
        severity: 'info',
        message: 'Class is missing @package tag',
        filePath,
        line: node.startPosition.row + 1,
        suggestion: 'Consider adding @package tag for better organization'
      });
    }
  }

  checkMethodDocBlock(node, filePath, issues) {
    // Исключаем migrations, seeders, factories - там PHPDoc не обязателен
    const isExcludedFile = filePath.includes('migrations') || 
                          filePath.includes('seeders') || 
                          filePath.includes('factories');
    
    const docBlock = this.getDocBlock(node);
    const methodName = this.getMethodName(node);
    const hasParameters = this.hasParameters(node);
    const hasReturn = this.hasReturnStatement(node);

    if (!docBlock && !isExcludedFile) {
      issues.push({
        type: 'missing_method_doc',
        severity: 'minor',
        message: `Method "${methodName}" is missing PHPDoc comment`,
        filePath,
        line: node.startPosition.row + 1,
        suggestion: 'Add PHPDoc comment with @param and @return annotations'
      });
      return;
    }

    if (hasParameters && !docBlock.includes('@param') && !isExcludedFile) {
      issues.push({
        type: 'missing_param_doc',
        severity: 'minor',
        message: `Method "${methodName}" is missing @param documentation`,
        filePath,
        line: node.startPosition.row + 1,
        suggestion: 'Add @param tags for each parameter'
      });
    }

    if (hasReturn && !docBlock.includes('@return') && !isExcludedFile) {
      issues.push({
        type: 'missing_return_doc',
        severity: 'minor',
        message: `Method "${methodName}" is missing @return documentation`,
        filePath,
        line: node.startPosition.row + 1,
        suggestion: 'Add @return tag describing the return value'
      });
    }

    // Проверяем только если return с реальным значением (не просто "return;")
    const hasReturnWithValue = /return\s+[^;]/.test(node.text);
    
    if (docBlock.includes('@return void') && hasReturnWithValue) {
      issues.push({
        type: 'incorrect_return_doc',
        severity: 'minor',
        message: `Method "${methodName}" declares @return void but returns a value`,
        filePath,
        line: node.startPosition.row + 1,
        suggestion: 'Update @return tag to match actual return type'
      });
    }
  }

  checkPropertyDocBlock(node, filePath, issues) {
    const docBlock = this.getDocBlock(node);

    if (!docBlock) {
      issues.push({
        type: 'missing_property_doc',
        severity: 'info',
        message: 'Property is missing PHPDoc comment',
        filePath,
        line: node.startPosition.row + 1,
        suggestion: 'Add PHPDoc comment with @var tag'
      });
    }
  }

  getDocBlock(node) {
    let current = node.previousSibling;
    
    while (current) {
      if (current.type === 'comment') {
        const text = current.text;
        if (text.includes('/**') || text.includes('/*')) {
          return text;
        }
      }
      current = current.previousSibling;
    }

    return null;
  }

  getClassName(node) {
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }
    return 'unknown';
  }

  getMethodName(node) {
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }
    return 'unknown';
  }

  hasParameters(node) {
    for (const child of node.children) {
      if (child.type === 'formal_parameters' || child.type === 'parameters') {
        return child.children.length > 0;
      }
    }
    return false;
  }

  hasReturnStatement(node) {
    const text = node.text || '';
    // Проверяем наличие return с учетом контекста (не в комментариях)
    return /return\s/.test(text);
  }
}

