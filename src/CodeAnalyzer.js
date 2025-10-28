import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export class CodeAnalyzer {
  constructor({ basePath, excludePatterns = [], verbose = false, specificFiles = null }) {
    this.basePath = basePath;
    this.excludePatterns = excludePatterns;
    this.verbose = verbose;
    this.specificFiles = specificFiles;
  }

  async findFiles() {
    if (this.specificFiles && this.specificFiles.length > 0) {
      return this.specificFiles.filter(file => file.endsWith('.php'));
    }

    const patterns = this.excludePatterns.map(p => `**/${p}/**`);
    const ignore = patterns;
    
    return await glob('**/*.php', {
      cwd: this.basePath,
      ignore: ignore,
      dot: false
    });
  }

  async findGitChangedFiles(staged = false) {
    try {
      const command = staged ? 'git diff --cached --name-only' : 'git diff --name-only';
      const result = execSync(command, { 
        cwd: this.basePath,
        encoding: 'utf-8'
      });
      
      return result
        .split('\n')
        .filter(file => file.trim() && file.endsWith('.php'))
        .map(file => file.trim());
    } catch (error) {
      if (this.verbose) {
        console.warn('Git command failed:', error.message);
      }
      return [];
    }
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

    // Собираем все файлы для кросс-анализа
    const allFilesContent = {};
    for (const file of files) {
      const fileData = await this.readFile(file);
      if (fileData) {
        allFilesContent[fileData.filePath] = fileData.content;
      }
    }

    for (const file of files) {
      const fileData = await this.readFile(file);
      if (!fileData) continue;

      results.analyzedFiles++;

      for (const analyzer of analyzers) {
        try {
          // Передаем все файлы для ClassConflictAnalyzer и других кросс-анализаторов
          const analyzerResults = analyzer.analyze(fileData.content, fileData.filePath, allFilesContent);
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

