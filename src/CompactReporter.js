import fs from 'fs/promises';
import path from 'path';

export class CompactReporter {
  constructor(outputPath) {
    this.outputPath = outputPath;
  }

  async generateReport(results) {
    // Group issues by file with compact line-by-line structure
    const issuesByFile = {};
    results.issues.forEach(issue => {
      if (!issuesByFile[issue.filePath]) {
        issuesByFile[issue.filePath] = {
          file: issue.filePath,
          total: 0,
          byType: {},
          issues: {}  // line -> unique types
        };
      }
      
      const line = issue.line || 0;
      
      // Count by type
      issuesByFile[issue.filePath].byType[issue.type] = 
        (issuesByFile[issue.filePath].byType[issue.type] || 0) + 1;
      
      // Store unique types per line
      if (!issuesByFile[issue.filePath].issues[line]) {
        issuesByFile[issue.filePath].issues[line] = new Set();
      }
      issuesByFile[issue.filePath].issues[line].add(issue.type);
      
      issuesByFile[issue.filePath].total++;
    });
    
    // Convert Sets to arrays
    Object.values(issuesByFile).forEach(file => {
      const issues = {};
      Object.entries(file.issues).forEach(([line, types]) => {
        issues[line] = Array.from(types);
      });
      file.issues = issues;
    });

    // Get top 20 files
    const topFiles = Object.values(issuesByFile)
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    const report = {
      summary: {
        totalIssues: results.issues.length,
        totalFiles: Object.keys(issuesByFile).length,
        topFiles: topFiles.length
      },
      topFiles: topFiles
    };

    await this.saveReport(report);
    return report;
  }

  async saveReport(report) {
    try {
      const dir = path.dirname(this.outputPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.outputPath, JSON.stringify(report, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save report:', error);
      throw error;
    }
  }
}

