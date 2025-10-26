/**
 * Example usage of Laravel Code Improver
 * 
 * This file demonstrates how to use the Code Improver programmatically
 */

import { CodeAnalyzer } from './src/CodeAnalyzer.js';
import { MethodSizeAnalyzer } from './src/analyzers/MethodSizeAnalyzer.js';
import { LogicAnalyzer } from './src/analyzers/LogicAnalyzer.js';
import { TypeChecker } from './src/analyzers/TypeChecker.js';
import { DocBlockAnalyzer } from './src/analyzers/DocBlockAnalyzer.js';
import { ArchitectureAnalyzer } from './src/analyzers/ArchitectureAnalyzer.js';

// Example: Analyze a single file
async function analyzeSingleFile(filePath) {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');

  const analyzer = new MethodSizeAnalyzer({ maxLines: 15 });
  const issues = analyzer.analyze(content, filePath);

  console.log(`Found ${issues.length} issues in ${filePath}`);
  issues.forEach(issue => {
    console.log(`- ${issue.message} at line ${issue.line}`);
  });

  return issues;
}

// Example: Analyze a Laravel controller for architecture issues
async function analyzeController(filePath) {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');

  const analyzers = [
    new ArchitectureAnalyzer(),
    new MethodSizeAnalyzer({ maxLines: 20 }),
    new TypeChecker(),
    new DocBlockAnalyzer()
  ];

  const allIssues = [];

  analyzers.forEach(analyzer => {
    const issues = analyzer.analyze(content, filePath);
    allIssues.push(...issues);
  });

  console.log(`\n=== Controller Analysis: ${filePath} ===`);
  console.log(`Total issues: ${allIssues.length}`);

  const byType = {};
  allIssues.forEach(issue => {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
  });

  console.log('\nIssues by type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  return allIssues;
}

// Example: Generate questions for code review
async function generateQuestions(filePath) {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');

  const analyzer = new LogicAnalyzer();
  const issues = analyzer.analyze(content, filePath);

  const questions = issues
    .filter(issue => issue.type === 'logic_question')
    .map(issue => issue.message);

  console.log(`\n=== Generated Questions for ${filePath} ===`);
  questions.forEach((q, i) => {
    console.log(`${i + 1}. ${q}`);
  });

  return questions;
}

// Example: Custom configuration
async function analyzeWithCustomConfig(filePath) {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');

  const config = {
    maxLines: 10,
    maxComplexity: 5,
    strictTypes: true
  };

  const analyzers = [
    new MethodSizeAnalyzer({ maxLines: config.maxLines }),
    new LogicAnalyzer()
  ];

  const allIssues = [];
  
  analyzers.forEach(analyzer => {
    const issues = analyzer.analyze(content, filePath);
    allIssues.push(...issues);
  });

  return allIssues;
}

// Export functions for use
export {
  analyzeSingleFile,
  analyzeController,
  generateQuestions,
  analyzeWithCustomConfig
};

