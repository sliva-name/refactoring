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
import { SecurityAnalyzer } from './src/analyzers/SecurityAnalyzer.js';
import { NPlusOneDetector } from './src/analyzers/NPlusOneDetector.js';
import { PerformanceAnalyzer } from './src/analyzers/PerformanceAnalyzer.js';
import { CodeSmellDetector } from './src/analyzers/CodeSmellDetector.js';
import { DuplicationDetector } from './src/analyzers/DuplicationDetector.js';
import { LogicQuestionGenerator } from './src/analyzers/LogicQuestionGenerator.js';
import { ClassConflictAnalyzer } from './src/analyzers/ClassConflictAnalyzer.js';
import { Linter } from './src/linters/Linter.js';
import { Reporter } from './src/Reporter.js';
import { CursorPromptGenerator } from './src/CursorPromptGenerator.js';
import { LogicQAReporter } from './src/LogicQAReporter.js';
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
  .option('file', {
    type: 'string',
    description: 'Analyze single file (relative to --path)',
    default: null
  })
  .option('files', {
    type: 'string',
    description: 'Analyze multiple files (comma-separated, relative to --path)',
    default: null
  })
  .option('git-diff', {
    type: 'boolean',
    description: 'Analyze only files changed in git working directory',
    default: false
  })
  .option('git-staged', {
    type: 'boolean',
    description: 'Analyze only staged files in git',
    default: false
  })
  .option('generate-prompts', {
    type: 'boolean',
    description: 'Generate Cursor AI prompts for fixing issues',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

async function main() {
  console.log(chalk.blue.bold('\n🔍 Laravel Code Improver\n'));

  let specificFiles = null;
  
  if (argv.file) {
    specificFiles = [argv.file];
    console.log(chalk.cyan(`Analyzing single file: ${argv.file}\n`));
  } else if (argv.files) {
    specificFiles = argv.files.split(',').map(f => f.trim());
    console.log(chalk.cyan(`Analyzing ${specificFiles.length} specific files\n`));
  }

  const codeAnalyzer = new CodeAnalyzer({
    basePath: argv.path,
    excludePatterns: argv.exclude.split(','),
    verbose: argv.verbose,
    specificFiles: specificFiles
  });

  const classConflictAnalyzer = new ClassConflictAnalyzer();
  
  const analyzers = [
    new SecurityAnalyzer(),
    new NPlusOneDetector(),
    new PerformanceAnalyzer(),
    new MethodSizeAnalyzer({ maxLines: 15 }),
    new LogicAnalyzer(),
    new LogicQuestionGenerator(),
    new TypeChecker(),
    new DocBlockAnalyzer(),
    new ArchitectureAnalyzer(),
    new TraitScopeAnalyzer(),
    new DuplicationDetector(),
    new CodeSmellDetector(),
    classConflictAnalyzer
  ];

  const linter = new Linter({ fix: argv.fix });
  
  let outputPath = argv.output;
  
  if (argv.refactorDir) {
    outputPath = path.join(argv.path, argv.refactorDir, 'code-report.json');
    console.log(chalk.gray(`Reports will be saved to: ${outputPath}\n`));
  }
  
  const reporter = new Reporter(outputPath, {
    compact: argv.compact,
    maxIssuesPerFile: argv.top
  });

  try {
    let files;
    
    if (argv.gitDiff) {
      console.log(chalk.cyan('Analyzing git changed files...\n'));
      files = await codeAnalyzer.findGitChangedFiles(false);
      if (files.length === 0) {
        console.log(chalk.yellow('No changed PHP files found in git working directory\n'));
        process.exit(0);
      }
    } else if (argv.gitStaged) {
      console.log(chalk.cyan('Analyzing git staged files...\n'));
      files = await codeAnalyzer.findGitChangedFiles(true);
      if (files.length === 0) {
        console.log(chalk.yellow('No staged PHP files found\n'));
        process.exit(0);
      }
    } else {
      files = await codeAnalyzer.findFiles();
    }
    
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
      
      console.log(chalk.cyan('✓ File-based reports created'));
    }

    // Generate Cursor prompts if requested
    if (argv.generatePrompts || argv.refactorDir) {
      console.log(chalk.gray('\nGenerating Cursor AI prompts...\n'));
      
      const promptGenerator = new CursorPromptGenerator(argv.path);
      const prompts = promptGenerator.generatePrompts(results);
      
      if (prompts.length > 0) {
        const promptsDir = argv.refactorDir 
          ? path.join(argv.path, argv.refactorDir, 'cursor-prompts')
          : path.join(path.dirname(outputPath), 'cursor-prompts');
        
        await promptGenerator.savePrompts(prompts, promptsDir);
        
        console.log(chalk.green('✓ Cursor prompts generated!'));
        console.log(chalk.cyan(`\n📝 Usage:`));
        console.log(chalk.gray(`   1. Open: cursor ${promptsDir}/MASTER_PROMPT.md`));
        console.log(chalk.gray(`   2. Copy prompts from individual .md files`));
        console.log(chalk.gray(`   3. Use in Cursor: @path/to/file.php <paste prompt>`));
      }
    }

    // Generate Logic Q&A reports
    if (argv.refactorDir) {
      console.log(chalk.gray('\nGenerating Logic Q&A reports...\n'));
      
      const qaReporter = new LogicQAReporter(argv.path);
      const qaReport = qaReporter.generateQAReport(results.issues);
      
      if (qaReport.total > 0) {
        const qaDir = path.join(argv.path, argv.refactorDir, 'logic-qa');
        await qaReporter.saveQAReports(qaReport, qaDir);
        
        console.log(chalk.green('\n✓ Logic Q&A reports generated!'));
        console.log(chalk.cyan(`\n💡 Review logic:`));
        console.log(chalk.gray(`   cursor ${qaDir}/INTERACTIVE_CHECKLIST.md\n`));
      } else {
        console.log(chalk.gray('No logic questions generated (perfect logic!)\n'));
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(chalk.red.bold('\n✗ Error:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

