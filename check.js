#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

async function checkSetup() {
  console.log(chalk.blue.bold('🔍 Checking Laravel Code Improver Setup...\n'));

  let issues = [];

  // Check if package.json exists
  try {
    await fs.access('package.json');
    console.log(chalk.green('✓ package.json found'));
  } catch (error) {
    issues.push('package.json missing');
    console.log(chalk.red('✗ package.json missing'));
  }

  // Check if node_modules exists
  try {
    await fs.access('node_modules');
    console.log(chalk.green('✓ node_modules found'));
  } catch (error) {
    issues.push('node_modules missing - run: npm install');
    console.log(chalk.yellow('⚠ node_modules missing'));
  }

  // Check analyzers
  const requiredFiles = [
    'src/CodeAnalyzer.js',
    'src/Reporter.js',
    'src/analyzers/MethodSizeAnalyzer.js',
    'src/analyzers/LogicAnalyzer.js',
    'src/analyzers/TypeChecker.js',
    'src/analyzers/DocBlockAnalyzer.js',
    'src/analyzers/ArchitectureAnalyzer.js',
    'src/linters/Linter.js',
    'index.js'
  ];

  console.log(chalk.blue('\nChecking required files:'));
  
  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      console.log(chalk.green(`✓ ${file}`));
    } catch (error) {
      issues.push(`Missing file: ${file}`);
      console.log(chalk.red(`✗ ${file}`));
    }
  }

  // Check documentation
  console.log(chalk.blue('\nChecking documentation:'));
  const docs = ['README.md', 'QUICK_START.md', 'CURSOR_INTEGRATION.md', 'CONTRIBUTING.md'];
  
  for (const doc of docs) {
    try {
      await fs.access(doc);
      console.log(chalk.green(`✓ ${doc}`));
    } catch (error) {
      console.log(chalk.yellow(`⚠ ${doc} missing (optional)`));
    }
  }

  // Summary
  console.log(chalk.blue.bold('\n=== Summary ==='));
  
  if (issues.length === 0) {
    console.log(chalk.green.bold('✓ Setup is complete!'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log('  1. npm install');
    console.log('  2. npm start');
    console.log('  3. See README.md for usage instructions\n');
  } else {
    console.log(chalk.yellow.bold(`⚠ Found ${issues.length} issues:`));
    issues.forEach(issue => {
      console.log(chalk.gray(`  - ${issue}`));
    });
    console.log(chalk.cyan('\nRun: npm install\n'));
  }
}

checkSetup().catch(console.error);

