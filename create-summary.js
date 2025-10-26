import fs from 'fs/promises';

async function createSummary() {
  console.log('Creating top issues summary...');
  const data = await fs.readFile('code-report.json', 'utf-8');
  const report = JSON.parse(data);
  
  // Group by file and take top 5 per file
  const issuesByFile = {};
  report.issues.forEach(issue => {
    if (!issuesByFile[issue.filePath]) {
      issuesByFile[issue.filePath] = [];
    }
    issuesByFile[issue.filePath].push(issue);
  });
  
  // Prioritize: major > minor > info
  const severityOrder = { critical: 0, major: 1, minor: 2, info: 3 };
  
  // Take top issues per file
  const topIssues = [];
  Object.entries(issuesByFile).forEach(([filePath, issues]) => {
    const sorted = issues.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.line - b.line;
    });
    
    // Take top 5 per file
    topIssues.push(...sorted.slice(0, 5));
  });
  
  console.log(`Original issues: ${report.issues.length}`);
  console.log(`After filtering: ${topIssues.length}`);
  
  report.issues = topIssues;
  report.summary.totalIssues = topIssues.length;
  
  // Recalculate stats
  report.summary.bySeverity = { critical: 0, major: 0, minor: 0, info: 0 };
  report.summary.byType = {};
  
  topIssues.forEach(issue => {
    report.summary.bySeverity[issue.severity]++;
    report.summary.byType[issue.type] = (report.summary.byType[issue.type] || 0) + 1;
  });
  
  // Save
  await fs.writeFile('code-report-top5.json', JSON.stringify(report, null, 2));
  
  console.log('✅ Created: code-report-top5.json');
  
  // Also create HTML summary
  const html = generateHTML(report);
  await fs.writeFile('code-report-summary.html', html);
  console.log('✅ Created: code-report-summary.html');
}

function generateHTML(report) {
  const issuesByFile = {};
  report.issues.forEach(issue => {
    if (!issuesByFile[issue.filePath]) {
      issuesByFile[issue.filePath] = [];
    }
    issuesByFile[issue.filePath].push(issue);
  });
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Code Analysis Report</title>
  <style>
    body { font-family: sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    .file { margin: 20px 0; border-left: 3px solid #007acc; padding-left: 10px; }
    .issue { margin: 10px 0; padding: 10px; background: #fff; border-radius: 4px; }
    .major { border-left: 4px solid #f44336; }
    .minor { border-left: 4px solid #ff9800; }
    .info { border-left: 4px solid #2196f3; }
    .type { font-weight: bold; color: #555; }
    .line { color: #888; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>📊 Code Analysis Report</h1>
  <div class="summary">
    <p><strong>Total Issues:</strong> ${report.summary.totalIssues}</p>
    <p><strong>Files Analyzed:</strong> ${report.summary.analyzedFiles}</p>
    <p><strong>Major Issues:</strong> ${report.summary.bySeverity.major}</p>
  </div>
  
  <h2>Issues by File</h2>
  ${Object.entries(issuesByFile).map(([filePath, issues]) => `
    <div class="file">
      <h3>${filePath}</h3>
      ${issues.map(issue => `
        <div class="issue ${issue.severity}">
          <div class="type">${issue.type}</div>
          <div class="line">Line ${issue.line}</div>
          <div>${issue.message}</div>
          ${issue.suggestion ? `<div style="color: #666; margin-top: 5px;">💡 ${issue.suggestion}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('')}
</body>
</html>`;
}

createSummary().catch(console.error);

