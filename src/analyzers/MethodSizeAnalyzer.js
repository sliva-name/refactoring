import Parser from 'tree-sitter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PHP = require('tree-sitter-php');

const getParser = () => {
  const parser = new Parser();
  parser.setLanguage(PHP);
  return parser;
};

export class MethodSizeAnalyzer {
  constructor({ maxLines = 15 }) {
    this.maxLines = maxLines;
    this.parser = getParser();
  }

  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    this.walkTree(tree.rootNode, code, filePath, issues);

    return issues;
  }

  walkTree(node, code, filePath, issues) {
    if (node.type === 'method_declaration' || node.type === 'function_declaration') {
      const methodName = this.getMethodName(node, code);
      const startLine = node.startPosition.row + 1;
      const endLine = node.endPosition.row + 1;
      const linesCount = endLine - startLine + 1;

      if (linesCount > this.maxLines) {
        issues.push({
          type: 'method_size',
          severity: 'major',
          message: `Method "${methodName}" is too long (${linesCount} lines, max recommended: ${this.maxLines})`,
          filePath,
          line: startLine,
          suggestion: 'Consider breaking down this method into smaller, focused methods following Single Responsibility Principle',
          refactorInfo: {
            methodName,
            startLine,
            endLine,
            linesCount,
            suggestedLines: this.maxLines
          }
        });
      }
    }

    for (const child of node.children) {
      this.walkTree(child, code, filePath, issues);
    }
  }

  getMethodName(node, code) {
    for (const child of node.children) {
      if (child.type === 'name' || child.type === 'simple_identifier') {
        return child.text;
      }
    }

    // Find name node by searching children
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }

    return 'anonymous';
  }
}

