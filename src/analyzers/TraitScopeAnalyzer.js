import Parser from 'tree-sitter';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PHP = require('tree-sitter-php');

const getParser = () => {
  const parser = new Parser();
  parser.setLanguage(PHP);
  return parser;
};

export class TraitScopeAnalyzer {
  constructor() {
    this.parser = getParser();
  }

  analyze(code, filePath) {
    const tree = this.parser.parse(code);
    const issues = [];

    this.walkTree(tree.rootNode, code, filePath, issues);

    return issues;
  }

  walkTree(node, code, filePath, issues) {
    if (node.type === 'class_declaration') {
      this.analyzeClass(node, code, filePath, issues);
    }

    for (const child of node.children) {
      this.walkTree(child, code, filePath, issues);
    }
  }

  analyzeClass(node, code, filePath, issues) {
    const className = this.getClassName(node);
    if (!className) return;

    const isModel = filePath.includes('Models/') || 
                    filePath.includes('models/') ||
                    this.isExtendingModel(node, code);

    if (isModel) {
      const queries = this.findQueryBuilders(code);
      const relations = this.findRelations(code);

      this.suggestScopes(filePath, className, queries, issues);
      this.suggestTraits(filePath, className, relations, code, issues);
    }
  }

  isExtendingModel(node, code) {
    for (const child of node.children) {
      if (child.type === 'base_clause') {
        return /extends\s+Model/.test(child.text);
      }
    }
    return false;
  }

  getClassName(node) {
    for (const child of node.children) {
      if (child.type === 'name') {
        return child.text;
      }
    }
    return null;
  }

  findQueryBuilders(code) {
    const queries = [];
    
    const patterns = {
      where: code.match(/->where\([^)]+\)/g) || [],
      whereIn: code.match(/->whereIn\([^)]+\)/g) || [],
      orderBy: code.match(/->orderBy\([^)]+\)/g) || [],
      with: code.match(/->with\([^)]+\)/g) || [],
      has: code.match(/->has\([^)]+\)/g) || [],
      whereHas: code.match(/->whereHas\([^)]+\)/g) || []
    };
    
    Object.entries(patterns).forEach(([type, matches]) => {
      if (matches && matches.length > 1) {
        queries.push({ type, count: matches.length, queries: matches });
      }
    });
    
    return queries;
  }

  findRelations(code) {
    const relations = [];
    const relationPatterns = {
      hasOne: /->hasOne\([^)]+\)/g,
      hasMany: /->hasMany\([^)]+\)/g,
      belongsTo: /->belongsTo\([^)]+\)/g,
      belongsToMany: /->belongsToMany\([^)]+\)/g,
      morphTo: /->morphTo\([^)]*\)/g,
      morphOne: /->morphOne\([^)]+\)/g,
      morphMany: /->morphMany\([^)]+\)/g
    };

    Object.entries(relationPatterns).forEach(([type, pattern]) => {
      const matches = code.match(pattern);
      if (matches) {
        relations.push({ type, count: matches.length, relations: matches });
      }
    });

    return relations;
  }

  suggestScopes(filePath, className, queries, issues) {
    queries.forEach(query => {
      issues.push({
        type: 'suggest_scope',
        severity: 'info',
        message: `Consider creating a 'scope${this.capitalize(query.type)}' method for repeated ${query.type} queries (used ${query.count} times)`,
        filePath,
        line: 1,
        suggestion: `Create a scope method: public function scope${this.capitalize(query.type)}(Builder $query, ...args) { return $query->${query.type}(...); }`,
        refactorInfo: {
          queryType: query.type,
          occurrences: query.count,
          suggestedScope: `scope${this.capitalize(query.type)}`
        }
      });
    });
  }

  suggestTraits(filePath, className, relations, code, issues) {
    const totalRelations = relations.reduce((sum, r) => sum + r.count, 0);
    
    // Предлагаем trait для relations только если их много и нет кастомного trait
    const hasCustomTrait = /use\s+\w+Trait;/.test(code);
    
    if (totalRelations > 5 && !hasCustomTrait) {
      issues.push({
        type: 'suggest_trait',
        severity: 'info',
        message: `Model has ${totalRelations} relationships - consider extracting into a reusable trait`,
        filePath,
        line: 1,
        suggestion: 'Create a trait with relationship definitions for better code organization'
      });
    }

    // SoftDeletes - НЕ предлагать если уже используется
    const hasSoftDeletesTrait = /use\s+SoftDeletes;/.test(code);
    const hasSoftDeletesColumn = code.includes('softDeletes()') || code.includes('deleted_at');
    
    if (hasSoftDeletesColumn && !hasSoftDeletesTrait) {
      issues.push({
        type: 'suggest_trait',
        severity: 'minor',
        message: 'Model has soft delete column but not using SoftDeletes trait',
        filePath,
        line: 1,
        suggestion: 'Add "use SoftDeletes;" trait from Illuminate\\Database\\Eloquent\\SoftDeletes'
      });
    }

    // Timestamps - это встроено в Laravel, не нужен отдельный trait
    // Убираем это предложение
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
