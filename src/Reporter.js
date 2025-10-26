import fs from 'fs/promises';
import path from 'path';

export class Reporter {
  constructor(outputPath, options = {}) {
    this.outputPath = outputPath;
    this.compact = options.compact || false;
    this.filterSeverity = options.filterSeverity || null;
    this.maxIssuesPerFile = options.maxIssuesPerFile || null;
  }

  async generateReport(results) {
    // Group issues by file with line-by-line structure
    const issuesByFile = {};
    results.issues.forEach(issue => {
      if (!issuesByFile[issue.filePath]) {
        issuesByFile[issue.filePath] = {
          file: issue.filePath,
          issues: {}
        };
      }
      
      // Group by line number
      const line = issue.line || 0;
      if (!issuesByFile[issue.filePath].issues[line]) {
        issuesByFile[issue.filePath].issues[line] = [];
      }
      issuesByFile[issue.filePath].issues[line].push({
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
        suggestion: issue.suggestion
      });
    });

    // Apply filters and limits
    const severityOrder = { critical: 0, major: 1, minor: 2, info: 3 };
    
    const filteredByFile = {};
    Object.entries(issuesByFile).forEach(([filePath, fileData]) => {
      const issuesObj = fileData.issues;
      const lines = Object.keys(issuesObj);
      
      // Filter and limit issues per line
      const filteredIssues = {};
      let issueCount = 0;
      
      for (const line of lines) {
        if (this.maxIssuesPerFile && issueCount >= this.maxIssuesPerFile) {
          break;
        }
        
        let lineIssues = issuesObj[line];

        // Filter by severity if specified
        if (this.filterSeverity) {
          lineIssues = lineIssues.filter(issue => 
            severityOrder[issue.severity] >= severityOrder[this.filterSeverity]
          );
        }

        // Compact mode - only major/critical
        if (this.compact) {
          lineIssues = lineIssues.filter(issue => 
            issue.severity === 'critical' || issue.severity === 'major'
          );
        }

        if (lineIssues.length > 0) {
          filteredIssues[line] = lineIssues;
          issueCount += lineIssues.length;
        }
      }

      if (Object.keys(filteredIssues).length > 0) {
        filteredByFile[filePath] = {
          file: filePath,
          issueCount: issueCount,
          issues: filteredIssues
        };
      }
    });

    // Build report with files structure
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: results.issues.length,
        totalFiles: Object.keys(issuesByFile).length,
        filesWithIssues: Object.keys(filteredByFile).length,
        byType: results.statistics.byType,
        bySeverity: results.statistics.bySeverity
      },
      files: Object.values(filteredByFile)
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

  severityLevel(severity) {
    const levels = { critical: 0, major: 1, minor: 2, info: 3 };
    return levels[severity] || 3;
  }
}
