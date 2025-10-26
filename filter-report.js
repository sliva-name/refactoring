import fs from 'fs/promises';

async function filterReport() {
  console.log('Reading report...');
  const data = await fs.readFile('code-report.json', 'utf-8');
  const report = JSON.parse(data);
  
  console.log(`Original issues: ${report.issues.length}`);
  
  // Keep only critical and major issues
  const filtered = report.issues.filter(issue => 
    issue.severity === 'critical' || issue.severity === 'major'
  );
  
  console.log(`Filtered issues: ${filtered.length}`);
  
  // Update summary
  report.issues = filtered;
  report.summary.totalIssues = filtered.length;
  
  // Recalculate stats
  report.summary.bySeverity = { critical: 0, major: 0, minor: 0, info: 0 };
  report.summary.byType = {};
  
  filtered.forEach(issue => {
    report.summary.bySeverity[issue.severity]++;
    report.summary.byType[issue.type] = (report.summary.byType[issue.type] || 0) + 1;
  });
  
  // Save compact version
  await fs.writeFile('code-report-compact.json', JSON.stringify(report, null, 2));
  
  console.log('✅ Saved compact report: code-report-compact.json');
  console.log(`📊 Stats: ${filtered.length} issues (${report.summary.bySeverity.major} major)`);
}

filterReport().catch(console.error);

