#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CodeAnalyzer } from './src/CodeAnalyzer.js';
import { MethodSizeAnalyzer } from './src/analyzers/MethodSizeAnalyzer.js';
import { LogicAnalyzer } from './src/analyzers/LogicAnalyzer.js';
import { TypeChecker } from './src/analyzers/TypeChecker.js';
import { DocBlockAnalyzer } from './src/analyzers/DocBlockAnalyzer.js';
import { ArchitectureAnalyzer } from './src/analyzers/ArchitectureAnalyzer.js';
import { TraitScopeAnalyzer } from './src/analyzers/TraitScopeAnalyzer.js';
import { Linter } from './src/linters/Linter.js';
import { Reporter } from './src/Reporter.js';
import chalk from 'chalk';
import path from 'path';

const argv = yargs(hideBin(process.argv))
  .option('path', {
    alias: 'p',
    type: 'string',
    description: 'Path to analyze',
    default: '.'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Output file path',
    default: 'code-report.json'
  })
  .option('refactor-dir', {
    alias: 'r',
    type: 'string',
    description: 'Refactoring directory in project (e.g. refactoring/)',
    default: null
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Verbose output',
    default: false
  })
  .option('fix', {
    alias: 'f',
    type: 'boolean',
    description: 'Auto-fix issues',
    default: false
  })
  .option('exclude', {
    alias: 'e',
    type: 'string',
    description: 'Exclude patterns (comma-separated)',
    default: 'vendor,tests,node_modules'
  })
  .option('compact', {
    alias: 'c',
    type: 'boolean',
    description: 'Compact mode - only major/critical issues',
    default: false
  })
  .option('top', {
    alias: 't',
    type: 'number',
    description: 'Max issues per file',
    default: null
  })
  .help()
  .alias('help', 'h')
  .argv;

async function main() {
  console.log(chalk.blue.bold('\n🔍 Laravel Code Improver\n'));

  const codeAnalyzer = new CodeAnalyzer({
    basePath: argv.path,
    excludePatterns: argv.exclude.split(','),
    verbose: argv.verbose
  });

  const analyzers = [
    new MethodSizeAnalyzer({ maxLines: 15 }),
    new LogicAnalyzer(),
    new TypeChecker(),
    new DocBlockAnalyzer(),
    new ArchitectureAnalyzer(),
    new TraitScopeAnalyzer()
  ];

  const linter = new Linter({ fix: argv.fix });
  
  // Determine output path
  let outputPath = argv.output;
  
  if (argv.refactorDir) {
    // If refactoring directory is specified, save to project's refactoring folder
    outputPath = path.join(argv.path, argv.refactorDir, 'code-report.json');
    console.log(chalk.gray(`Reports will be saved to: ${outputPath}\n`));
  }
  
  const reporter = new Reporter(outputPath, {
    compact: argv.compact,
    maxIssuesPerFile: argv.top
  });

  try {
    const files = await codeAnalyzer.findFiles();
    console.log(chalk.gray(`Found ${files.length} PHP files to analyze\n`));

    const results = await codeAnalyzer.analyze(files, analyzers, linter);

    await reporter.generateReport(results);
    
    console.log(chalk.green.bold('\n✓ Analysis complete!'));
    console.log(chalk.cyan(`Report saved to: ${outputPath}\n`));
    
    // If saving to project, also save file-based reports
    if (argv.refactorDir) {
      console.log(chalk.gray('Generating additional reports...\n'));
      
      const { FileReporter } = await import('./src/FileReporter.js');
      const fileReporter = new FileReporter(
        path.join(argv.path, argv.refactorDir, 'split')
      );
      await fileReporter.generateReport(results);
      
      console.log(chalk.cyan('\n✓ File-based reports created'));
    }

    process.exit(0);
  } catch (error) {
    console.error(chalk.red.bold('\n✗ Error:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

