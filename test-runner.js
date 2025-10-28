import { CodeAnalyzer } from './src/CodeAnalyzer.js';
import { SecurityAnalyzer } from './src/analyzers/SecurityAnalyzer.js';
import { NPlusOneDetector } from './src/analyzers/NPlusOneDetector.js';
import { PerformanceAnalyzer } from './src/analyzers/PerformanceAnalyzer.js';
import { MethodSizeAnalyzer } from './src/analyzers/MethodSizeAnalyzer.js';
import { LogicAnalyzer } from './src/analyzers/LogicAnalyzer.js';
import { TypeChecker } from './src/analyzers/TypeChecker.js';
import { DocBlockAnalyzer } from './src/analyzers/DocBlockAnalyzer.js';
import { ArchitectureAnalyzer } from './src/analyzers/ArchitectureAnalyzer.js';
import { CodeSmellDetector } from './src/analyzers/CodeSmellDetector.js';
import { DuplicationDetector } from './src/analyzers/DuplicationDetector.js';
import { Linter } from './src/linters/Linter.js';
import fs from 'fs/promises';

const codeAnalyzer = new CodeAnalyzer({
  basePath: 'tests/laravel-test',
  excludePatterns: [],
  verbose: true
});

const analyzers = [
  new SecurityAnalyzer(),
  new NPlusOneDetector(),
  new PerformanceAnalyzer(),
  new MethodSizeAnalyzer({ maxLines: 15 }),
  new LogicAnalyzer(),
  new TypeChecker(),
  new DocBlockAnalyzer(),
  new ArchitectureAnalyzer(),
  new CodeSmellDetector(),
  new DuplicationDetector()
];

const linter = new Linter({ fix: false });

async function main() {
  console.log('Starting analysis...\n');
  
  const files = await codeAnalyzer.findFiles();
  console.log(`Found ${files.length} files\n`);
  
  const results = await codeAnalyzer.analyze(files, analyzers, linter);
  
  await fs.writeFile('tests/test-results.json', JSON.stringify(results, null, 2));
  
  console.log('Analysis complete!');
  console.log(`Total issues: ${results.statistics.totalIssues}`);
  console.log(`Results saved to: tests/test-results.json\n`);
  
  // Print summary
  console.log('Issue breakdown:');
  for (const [type, count] of Object.entries(results.statistics.byType)) {
    console.log(`  ${type}: ${count}`);
  }
}

main().catch(console.error);

