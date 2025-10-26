import fs from 'fs/promises';
import path from 'path';

export class ReportSplitter {
  constructor(inputFile, outputDir) {
    this.inputFile = inputFile;
    this.outputDir = outputDir;
  }

  async splitReport() {
    console.log('Reading report...');
    const data = await fs.readFile(this.inputFile, 'utf-8');
    const report = JSON.parse(data);

    // Create summary
    await this.createSummary(report);

    // Split by issue type
    await this.splitByType(report);

    // Split by severity
    await this.splitBySeverity(report);

    // Split by file count
    await this.splitByFileCount(report);

    console.log('✓ Report split into multiple files');
  }

  async createSummary(report) {
    const summary = {
      timestamp: report.timestamp,
      totalIssues: report.summary.totalIssues,
      totalFiles: report.summary.totalFiles,
      byType: report.summary.byType,
      bySeverity: report.summary.bySeverity,
      topFiles: report.files
        .sort((a, b) => b.issueCount - a.issueCount)
        .slice(0, 20)
        .map(f => ({
          filePath: f.filePath,
          issueCount: f.issueCount,
          issuesByType: f.issuesByType,
          topIssues: f.issues.slice(0, 3)
        }))
    };

    await this.saveFile('report-summary.json', summary);
  }

  async splitByType(report) {
    const types = Object.keys(report.summary.byType);
    
    for (const type of types) {
      const filteredFiles = report.files
        .map(f => ({
          ...f,
          issues: f.issues.filter(i => i.type === type)
        }))
        .filter(f => f.issues.length > 0);

      if (filteredFiles.length > 0) {
        await this.saveFile(
          `report-by-type-${type}.json`,
          {
            type,
            count: report.summary.byType[type],
            files: filteredFiles
          }
        );
      }
    }
  }

  async splitBySeverity(report) {
    const severities = ['critical', 'major', 'minor', 'info'];
    
    for (const severity of severities) {
      const filteredFiles = report.files
        .map(f => ({
          ...f,
          issues: f.issues.filter(i => i.severity === severity),
          issueCount: f.issues.filter(i => i.severity === severity).length
        }))
        .filter(f => f.issueCount > 0);

      if (filteredFiles.length > 0) {
        await this.saveFile(
          `report-by-severity-${severity}.json`,
          {
            severity,
            count: report.summary.bySeverity[severity],
            files: filteredFiles
          }
        );
      }
    }
  }

  async splitByFileCount(report) {
    const sorted = [...report.files].sort((a, b) => b.issueCount - a.issueCount);
    
    // Save top 20
    await this.saveFile('report-top-20-files.json', {
      timestamp: report.timestamp,
      files: sorted.slice(0, 20),
      summary: {
        issueCount: sorted.slice(0, 20).reduce((sum, f) => sum + f.issueCount, 0)
      }
    });

    // Save top 10
    await this.saveFile('report-top-10-files.json', {
      timestamp: report.timestamp,
      files: sorted.slice(0, 10),
      summary: {
        issueCount: sorted.slice(0, 10).reduce((sum, f) => sum + f.issueCount, 0)
      }
    });

    // Split into chunks of 10 files
    const chunkSize = 10;
    for (let i = 0; i < sorted.length; i += chunkSize) {
      const chunk = sorted.slice(i, i + chunkSize);
      await this.saveFile(`report-chunk-${Math.floor(i / chunkSize) + 1}.json`, {
        timestamp: report.timestamp,
        chunk: Math.floor(i / chunkSize) + 1,
        totalChunks: Math.ceil(sorted.length / chunkSize),
        files: chunk
      });
    }
  }

  async saveFile(filename, data) {
    const filePath = path.join(this.outputDir, filename);
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`✓ Created: ${filename}`);
  }
}

