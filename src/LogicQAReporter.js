import fs from 'fs/promises';
import path from 'path';

/**
 * Генератор Q&A отчетов по логике кода
 */
export class LogicQAReporter {
  constructor(basePath) {
    this.basePath = basePath;
  }

  /**
   * Генерирует Q&A отчеты
   *
   * @param array issues Все проблемы из анализа
   * @return object
   */
  generateQAReport(issues) {
    const logicQuestions = issues.filter(issue => issue.type === 'logic_questions');
    
    if (logicQuestions.length === 0) {
      return { total: 0, byFile: {}, byCategory: {} };
    }

    const byFile = this.groupByFile(logicQuestions);
    const byCategory = this.groupByCategory(logicQuestions);
    const byPriority = this.groupByPriority(logicQuestions);

    return {
      total: this.countTotalQuestions(logicQuestions),
      filesWithQuestions: Object.keys(byFile).length,
      byFile,
      byCategory,
      byPriority
    };
  }

  /**
   * Группирует вопросы по файлам
   *
   * @param array logicQuestions
   * @return object
   */
  groupByFile(logicQuestions) {
    const byFile = {};

    for (const issue of logicQuestions) {
      const file = issue.filePath;
      
      if (!byFile[file]) {
        byFile[file] = {
          file: file,
          methods: []
        };
      }

      byFile[file].methods.push({
        line: issue.line,
        message: issue.message,
        questions: issue.questions
      });
    }

    return byFile;
  }

  /**
   * Группирует по категориям
   *
   * @param array logicQuestions
   * @return object
   */
  groupByCategory(logicQuestions) {
    const byCategory = {};

    for (const issue of logicQuestions) {
      for (const q of issue.questions) {
        const category = q.category;
        
        if (!byCategory[category]) {
          byCategory[category] = {
            category: category,
            count: 0,
            questions: []
          };
        }

        byCategory[category].count++;
        byCategory[category].questions.push({
          file: issue.filePath,
          line: issue.line,
          priority: q.priority,
          question: q.question,
          checkPoints: q.checkPoints,
          expectedAnswer: q.expectedAnswer
        });
      }
    }

    return byCategory;
  }

  /**
   * Группирует по приоритету
   *
   * @param array logicQuestions
   * @return object
   */
  groupByPriority(logicQuestions) {
    const byPriority = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    for (const issue of logicQuestions) {
      for (const q of issue.questions) {
        byPriority[q.priority].push({
          file: issue.filePath,
          line: issue.line,
          category: q.category,
          question: q.question,
          checkPoints: q.checkPoints,
          expectedAnswer: q.expectedAnswer
        });
      }
    }

    return byPriority;
  }

  /**
   * Подсчитывает общее количество вопросов
   *
   * @param array logicQuestions
   * @return number
   */
  countTotalQuestions(logicQuestions) {
    let total = 0;
    for (const issue of logicQuestions) {
      total += issue.questions.length;
    }
    return total;
  }

  /**
   * Сохраняет Q&A отчеты
   *
   * @param object qaReport
   * @param string outputDir
   * @return void
   */
  async saveQAReports(qaReport, outputDir) {
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(
      path.join(outputDir, 'logic-qa-summary.json'),
      JSON.stringify(qaReport, null, 2)
    );

    await this.saveByPriorityReport(qaReport.byPriority, outputDir);
    await this.saveByCategoryReport(qaReport.byCategory, outputDir);
    await this.saveByFileReports(qaReport.byFile, outputDir);
    await this.saveInteractiveChecklist(qaReport, outputDir);

    console.log(`\n📋 Logic Q&A Reports generated:`);
    console.log(`   Total questions: ${qaReport.total}`);
    console.log(`   Files with questions: ${qaReport.filesWithQuestions}`);
    console.log(`   Location: ${outputDir}/`);
  }

  /**
   * Сохраняет отчет по приоритетам
   *
   * @param object byPriority
   * @param string outputDir
   * @return void
   */
  async saveByPriorityReport(byPriority, outputDir) {
    const lines = [];

    lines.push('# 🎯 Logic Questions by Priority\n');
    lines.push('## Overview\n');
    lines.push(`- 🔴 Critical: ${byPriority.critical.length} questions`);
    lines.push(`- 🟠 High: ${byPriority.high.length} questions`);
    lines.push(`- 🟡 Medium: ${byPriority.medium.length} questions`);
    lines.push(`- 🟢 Low: ${byPriority.low.length} questions\n`);

    for (const [priority, questions] of Object.entries(byPriority)) {
      if (questions.length === 0) continue;

      const emoji = this.getPriorityEmoji(priority);
      lines.push(`\n## ${emoji} ${priority.toUpperCase()} Priority\n`);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        lines.push(`\n### ${i + 1}. ${q.question}\n`);
        lines.push(`**File:** \`${q.file}\` (line ${q.line})`);
        lines.push(`**Category:** ${q.category}\n`);
        
        lines.push('**Check Points:**');
        for (const cp of q.checkPoints) {
          lines.push(`- [ ] ${cp}`);
        }
        
        lines.push(`\n**Expected Answer:** ${q.expectedAnswer}\n`);
        lines.push('**Your Answer:**');
        lines.push('```\n[ВАШЕ мнение/ответ]\n```\n');
        lines.push('---\n');
      }
    }

    await fs.writeFile(
      path.join(outputDir, 'LOGIC_QUESTIONS_BY_PRIORITY.md'),
      lines.join('\n')
    );
  }

  /**
   * Сохраняет отчет по категориям
   *
   * @param object byCategory
   * @param string outputDir
   * @return void
   */
  async saveByCategoryReport(byCategory, outputDir) {
    const lines = [];

    lines.push('# 📚 Logic Questions by Category\n');

    const categories = Object.keys(byCategory).sort();
    
    for (const category of categories) {
      const data = byCategory[category];
      const emoji = this.getCategoryEmoji(category);
      
      lines.push(`\n## ${emoji} ${this.formatCategoryName(category)}\n`);
      lines.push(`Total questions: **${data.count}**\n`);

      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        lines.push(`\n### Question ${i + 1}\n`);
        lines.push(`**File:** \`${q.file}\` (line ${q.line})`);
        lines.push(`**Priority:** ${this.getPriorityEmoji(q.priority)} ${q.priority}\n`);
        lines.push(`**${q.question}**\n`);
        
        lines.push('**Check Points:**');
        for (const cp of q.checkPoints) {
          lines.push(`- [ ] ${cp}`);
        }
        
        lines.push(`\n**Expected Answer:** ${q.expectedAnswer}\n`);
        lines.push('---\n');
      }
    }

    await fs.writeFile(
      path.join(outputDir, 'LOGIC_QUESTIONS_BY_CATEGORY.md'),
      lines.join('\n')
    );
  }

  /**
   * Сохраняет отчеты по файлам
   *
   * @param object byFile
   * @param string outputDir
   * @return void
   */
  async saveByFileReports(byFile, outputDir) {
    const filesDir = path.join(outputDir, 'by-file');
    await fs.mkdir(filesDir, { recursive: true });

    for (const [filePath, data] of Object.entries(byFile)) {
      const lines = [];
      
      lines.push(`# Logic Questions: ${filePath}\n`);
      lines.push(`## Methods with questions: ${data.methods.length}\n`);

      for (const method of data.methods) {
        lines.push(`\n## Line ${method.line}: ${method.message}\n`);

        for (const q of method.questions) {
          const emoji = this.getPriorityEmoji(q.priority);
          lines.push(`\n### ${emoji} ${q.question}\n`);
          lines.push(`**Category:** ${q.category}`);
          lines.push(`**Priority:** ${q.priority}\n`);
          
          lines.push('**Check Points:**');
          for (const cp of q.checkPoints) {
            lines.push(`- [ ] ${cp}`);
          }
          
          lines.push(`\n**Expected Answer:** ${q.expectedAnswer}\n`);
          lines.push('**Your Answer:**');
          lines.push('```\n[ВАШЕ мнение/ответ]\n```\n');
          lines.push('---\n');
        }
      }

      const fileName = this.sanitizeFileName(filePath) + '.md';
      await fs.writeFile(path.join(filesDir, fileName), lines.join('\n'));
    }
  }

  /**
   * Создает интерактивный чеклист
   *
   * @param object qaReport
   * @param string outputDir
   * @return void
   */
  async saveInteractiveChecklist(qaReport, outputDir) {
    const lines = [];

    lines.push('# ✅ Interactive Logic Review Checklist\n');
    lines.push('## 📊 Statistics\n');
    lines.push(`- Total questions: **${qaReport.total}**`);
    lines.push(`- Files to review: **${qaReport.filesWithQuestions}**`);
    lines.push(`- Critical questions: **${qaReport.byPriority.critical.length}**`);
    lines.push(`- High priority: **${qaReport.byPriority.high.length}**\n`);

    lines.push('## 🎯 Review Strategy\n');
    lines.push('1. Start with **Critical** questions (security, data corruption)');
    lines.push('2. Continue with **High** priority (bugs, edge cases)');
    lines.push('3. Review **Medium** priority (improvements)');
    lines.push('4. Optional: **Low** priority (nice-to-have)\n');

    lines.push('## 🔴 Critical Questions (Review First!)\n');
    
    if (qaReport.byPriority.critical.length > 0) {
      for (let i = 0; i < qaReport.byPriority.critical.length; i++) {
        const q = qaReport.byPriority.critical[i];
        lines.push(`\n### ${i + 1}. ${q.question}\n`);
        lines.push(`\`${q.file}:${q.line}\`\n`);
        
        for (const cp of q.checkPoints) {
          lines.push(`- [ ] ${cp}`);
        }
        
        lines.push(`\n✅ Expected: ${q.expectedAnswer}\n`);
        lines.push('**Status:** [ ] Reviewed [ ] Fixed [ ] N/A\n');
        lines.push('**Notes:**');
        lines.push('```\n\n```\n');
      }
    } else {
      lines.push('✅ No critical questions!\n');
    }

    lines.push('\n## 🟠 High Priority Questions\n');
    lines.push(`Total: ${qaReport.byPriority.high.length} questions\n`);
    lines.push('👉 See: `LOGIC_QUESTIONS_BY_PRIORITY.md` for details\n');

    lines.push('\n## 📝 How to Use This Checklist\n');
    lines.push('1. **Read the question** - understand what needs verification');
    lines.push('2. **Check all points** - mark [x] when verified');
    lines.push('3. **Answer the question** - write your conclusion');
    lines.push('4. **Mark status** - Reviewed/Fixed/N/A');
    lines.push('5. **Add notes** - any important observations\n');

    lines.push('## 💡 Tips\n');
    lines.push('- Review code **before** writing tests');
    lines.push('- Use questions as **test case ideas**');
    lines.push('- Document answers for **team knowledge**');
    lines.push('- Revisit during **code review**\n');

    await fs.writeFile(
      path.join(outputDir, 'INTERACTIVE_CHECKLIST.md'),
      lines.join('\n')
    );
  }

  /**
   * Получает emoji для приоритета
   *
   * @param string priority
   * @return string
   */
  getPriorityEmoji(priority) {
    const emojis = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return emojis[priority] || '⚪';
  }

  /**
   * Получает emoji для категории
   *
   * @param string category
   * @return string
   */
  getCategoryEmoji(category) {
    const emojis = {
      conditions: '🔀',
      loops: '🔄',
      null_safety: '🛡️',
      edge_cases: '⚠️',
      transactions: '💾',
      validation: '✅',
      return_values: '↩️',
      exceptions: '⚠️'
    };
    return emojis[category] || '📋';
  }

  /**
   * Форматирует название категории
   *
   * @param string category
   * @return string
   */
  formatCategoryName(category) {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Санитизирует имя файла
   *
   * @param string filePath
   * @return string
   */
  sanitizeFileName(filePath) {
    return filePath
      .replace(/[\/\\]/g, '_')
      .replace(/\.php$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}

