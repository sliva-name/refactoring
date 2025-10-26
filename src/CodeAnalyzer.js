import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

export class CodeAnalyzer {
  constructor({ basePath, excludePatterns = [], verbose = false }) {
    this.basePath = basePath;
    this.excludePatterns = excludePatterns;
    this.verbose = verbose;
  }

  async findFiles() {
    const patterns = this.excludePatterns.map(p => `**/${p}/**`);
    const ignore = patterns;
    
    return await glob('**/*.php', {
      cwd: this.basePath,
      ignore: ignore,
      dot: false
    });
  }

  async readFile(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return { filePath, content, fullPath };
    } catch (error) {
      if (this.verbose) {
        console.warn(`Could not read file: ${filePath}`);
      }
      return null;
    }
  }

  async analyze(files, analyzers, linter) {
    const results = {
      totalFiles: files.length,
      analyzedFiles: 0,
      issues: [],
      statistics: {
        totalIssues: 0,
        byType: {},
        bySeverity: { critical: 0, major: 0, minor: 0, info: 0 }
      }
    };

    for (const file of files) {
      const fileData = await this.readFile(file);
      if (!fileData) continue;

      results.analyzedFiles++;

      for (const analyzer of analyzers) {
        try {
          const analyzerResults = analyzer.analyze(fileData.content, fileData.filePath);
          if (analyzerResults && analyzerResults.length > 0) {
            results.issues.push(...analyzerResults);
          }
        } catch (error) {
          if (this.verbose) {
            console.error(`Error in ${analyzer.constructor.name} for ${file}:`, error.message);
          }
        }
      }

      const linterResults = await linter.check(fileData.fullPath);
      if (linterResults && linterResults.issues && linterResults.issues.length > 0) {
        linterResults.issues.forEach(issue => {
          results.issues.push({
            ...issue,
            filePath: fileData.filePath,
            type: 'linting'
          });
        });
      }
    }

    results.issues.forEach(issue => {
      const type = issue.type || 'unknown';
      const severity = issue.severity || 'info';
      
      results.statistics.totalIssues++;
      results.statistics.byType[type] = (results.statistics.byType[type] || 0) + 1;
      results.statistics.bySeverity[severity] = (results.statistics.bySeverity[severity] || 0) + 1;
    });

    return results;
  }
}

