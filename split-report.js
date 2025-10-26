import { ReportSplitter } from './src/ReportSplitter.js';

const reportFile = process.argv[2] || '/home/ghost/saasApp/refactoring/code-report.json';
const outputDir = '/home/ghost/saasApp/refactoring/split';

console.log('📊 Splitting report...\n');

const splitter = new ReportSplitter(reportFile, outputDir);
await splitter.splitReport();

console.log('\n✅ Done! Report split into multiple manageable files.');
console.log(`📁 Check: ${outputDir}`);

