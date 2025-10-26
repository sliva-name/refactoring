import fs from 'fs/promises';
import path from 'path';

export class FileReporter {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }

  async generateReport(results) {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Define problem descriptions
    const problemDescriptions = {
      'missing_fillable': {
        message: 'Model missing $fillable or $guarded property',
        fix: 'Add protected $fillable = [...] with all fillable fields'
      },
      'method_size': {
        message: 'Method is too long',
        fix: 'Break this method into smaller, focused methods (SRP)'
      },
      'high_complexity': {
        message: 'High cyclomatic complexity',
        fix: 'Simplify logic or extract parts into separate methods'
      },
      'missing_return_type': {
        message: 'Missing return type declaration',
        fix: 'Add return type to method signature'
      },
      'missing_method_doc': {
        message: 'Missing PHPDoc for method',
        fix: 'Add @param and @return annotations'
      },
      'missing_param_doc': {
        message: 'Missing @param documentation',
        fix: 'Add @param tags for each parameter'
      },
      'logic_question': {
        message: 'Complex logic that could be simplified',
        fix: 'Extract methods for better readability'
      },
      'thick_controller': {
        message: 'Controller has too many responsibilities',
        fix: 'Extract business logic to Service classes'
      },
      'business_logic_in_controller': {
        message: 'Business logic found in controller',
        fix: 'Move to dedicated Service class'
      },
      'missing_response': {
        message: 'Missing response type',
        fix: 'Add return type (JsonResponse, View, etc)'
      },
      'magic_number': {
        message: 'Magic number detected',
        fix: 'Extract to named constant'
      }
    };
    
    // Group issues by file
    const issuesByFile = {};
    results.issues.forEach(issue => {
      if (!issuesByFile[issue.filePath]) {
        issuesByFile[issue.filePath] = {
          file: issue.filePath,
          problems: {}
        };
      }
      
      // Group by problem type with line ranges and descriptions
      const problemType = issue.type;
      const description = problemDescriptions[problemType] || {
        message: issue.message || 'Unknown issue',
        fix: issue.suggestion || 'Please review and fix'
      };
      
      if (!issuesByFile[issue.filePath].problems[problemType]) {
        issuesByFile[issue.filePath].problems[problemType] = {
          ...description,
          locations: []
        };
      }
      
      const lineRange = {
        startLine: issue.line || 0,
        endLine: issue.refactorInfo?.endLine || issue.line || 0
      };
      
      // Check if this range already exists to avoid duplicates
      const exists = issuesByFile[issue.filePath].problems[problemType].locations.some(loc => 
        loc.startLine === lineRange.startLine && loc.endLine === lineRange.endLine
      );
      
      if (!exists) {
        issuesByFile[issue.filePath].problems[problemType].locations.push(lineRange);
      }
    });

    // Save each file separately
    for (const [filePath, data] of Object.entries(issuesByFile)) {
      const fileName = this.getFileName(filePath);
      const fileReportPath = path.join(this.outputDir, `${fileName}.json`);
      
      await fs.writeFile(
        fileReportPath, 
        JSON.stringify(data, null, 2), 
        'utf-8'
      );
      
      console.log(`✓ Created: ${fileName}.json (${this.getIssueCount(data)} problems)`);
    }

    // Create index
    const index = {
      timestamp: new Date().toISOString(),
      totalFiles: Object.keys(issuesByFile).length,
      totalIssues: results.issues.length,
      files: Object.keys(issuesByFile).map(fp => ({
        file: fp,
        count: this.getIssueCount(issuesByFile[fp])
      })).sort((a, b) => b.count - a.count)
    };
    
    await fs.writeFile(
      path.join(this.outputDir, 'index.json'),
      JSON.stringify(index, null, 2),
      'utf-8'
    );
    
    console.log(`✓ Created: index.json`);
    console.log(`\n📁 Reports saved to: ${this.outputDir}`);
  }

  getFileName(filePath) {
    // Convert path to safe filename
    return filePath
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/^app_/, '')
      .replace(/^database_/, '');
  }

  getIssueCount(data) {
    return Object.values(data.problems).reduce((sum, obj) => sum + obj.locations.length, 0);
  }
  
  generatePrompt(fileData) {
    const prompt = `Исправь проблемы в файле ${fileData.file}:\n\n`;
    const fixes = Object.entries(fileData.problems).map(([type, details]) => {
      const locations = details.locations.map(l => 
        l.startLine === l.endLine ? `строка ${l.startLine}` : `строки ${l.startLine}-${l.endLine}`
      ).join(', ');
      return `- ${details.message} (${locations})\n  Решение: ${details.fix}`;
    }).join('\n\n');
    return prompt + fixes;
  }
}

