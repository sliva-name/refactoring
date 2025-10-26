import { execa } from 'execa';
import path from 'path';
import fs from 'fs/promises';

export class Linter {
  constructor({ fix = false }) {
    this.fix = fix;
    this.phpcsCmd = 'vendor/bin/phpcs';
    this.phpmdCmd = 'vendor/bin/phpmd';
    this.phpstanCmd = 'vendor/bin/phpstan';
  }

  async check(filePath) {
    const issues = [];
    
    try {
      await this.checkPHPCS(filePath, issues);
    } catch (error) {
      // PHPCS not installed or failed
    }

    try {
      await this.checkPHPMD(filePath, issues);
    } catch (error) {
      // PHPMD not installed or failed
    }

    return { issues };
  }

  async checkPHPCS(filePath, issues) {
    try {
      const result = await execa(this.phpcsCmd, [
        '--standard=PSR12',
        '--report=json',
        filePath
      ], { 
        reject: false,
        cwd: path.dirname(filePath)
      });

      if (result.stdout) {
        const data = JSON.parse(result.stdout);
        if (data.files && data.files[filePath]) {
          const fileIssues = data.files[filePath].messages || [];
          
          fileIssues.forEach(issue => {
            issues.push({
              type: 'coding_standard',
              severity: issue.severity === 5 ? 'critical' : 'minor',
              message: issue.message,
              line: issue.line,
              rule: issue.source,
              tool: 'PHPCS'
            });
          });
        }
      }
    } catch (error) {
      // Tool not available
    }
  }

  async checkPHPMD(filePath, issues) {
    try {
      const result = await execa(this.phpmdCmd, [
        filePath,
        'json',
        'codesize,design,naming,unusedcode'
      ], { 
        reject: false,
        cwd: path.dirname(filePath)
      });

      if (result.stdout) {
        const data = JSON.parse(result.stdout);
        
        if (data.files && data.files[0] && data.files[0].violations) {
          data.files[0].violations.forEach(violation => {
            issues.push({
              type: 'code_smell',
              severity: this.mapPHPMDSeverity(violation.priority),
              message: violation.message,
              line: violation.beginLine,
              rule: violation.rule,
              tool: 'PHPMD'
            });
          });
        }
      }
    } catch (error) {
      // Tool not available
    }
  }

  mapPHPMDSeverity(priority) {
    if (priority >= 5) return 'critical';
    if (priority >= 3) return 'major';
    return 'minor';
  }

  async checkPHPStan(filePath) {
    try {
      const result = await execa(this.phpstanCmd, [
        'analyse',
        '--no-progress',
        '--error-format=json',
        filePath
      ], { 
        reject: false
      });

      if (result.stdout) {
        const data = JSON.parse(result.stdout);
        return data;
      }
    } catch (error) {
      // Tool not available
    }

    return { files: [] };
  }

  getSeverity(rule) {
    if (rule.includes('security') || rule.includes('error')) {
      return 'critical';
    }
    if (rule.includes('warning') || rule.includes('design')) {
      return 'major';
    }
    return 'minor';
  }
}

