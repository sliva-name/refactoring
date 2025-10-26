import fs from 'fs/promises';
import path from 'path';

/**
 * Генератор промптов для Cursor AI
 * Создает готовые промпты для исправления проблем
 */
export class CursorPromptGenerator {
  constructor(basePath) {
    this.basePath = basePath;
  }

  /**
   * Генерирует промпты для всех файлов с проблемами
   *
   * @param object results Результаты анализа
   * @return array
   */
  generatePrompts(results) {
    const prompts = [];
    const filesByPriority = this.groupByPriority(results.issues);

    for (const [priority, files] of Object.entries(filesByPriority)) {
      for (const [filePath, issues] of Object.entries(files)) {
        const prompt = this.generateFilePrompt(filePath, issues, priority);
        prompts.push(prompt);
      }
    }

    return prompts;
  }

  /**
   * Группирует проблемы по приоритету и файлам
   *
   * @param array issues
   * @return object
   */
  groupByPriority(issues) {
    const priorities = {
      critical: {},
      major: {},
      minor: {},
      info: {}
    };

    for (const issue of issues) {
      const severity = issue.severity || 'info';
      const file = issue.filePath;

      if (!priorities[severity][file]) {
        priorities[severity][file] = [];
      }

      priorities[severity][file].push(issue);
    }

    return priorities;
  }

  /**
   * Генерирует промпт для конкретного файла
   *
   * @param string filePath
   * @param array issues
   * @param string priority
   * @return object
   */
  generateFilePrompt(filePath, issues, priority) {
    const issuesByType = this.groupIssuesByType(issues);
    const prompt = this.buildPromptText(filePath, issuesByType, priority);

    return {
      file: filePath,
      priority: priority,
      issueCount: issues.length,
      issueTypes: Object.keys(issuesByType),
      prompt: prompt,
      cursorCommand: this.generateCursorCommand(filePath, prompt)
    };
  }

  /**
   * Группирует проблемы по типу
   *
   * @param array issues
   * @return object
   */
  groupIssuesByType(issues) {
    const grouped = {};

    for (const issue of issues) {
      const type = issue.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(issue);
    }

    return grouped;
  }

  /**
   * Создает текст промпта
   *
   * @param string filePath
   * @param object issuesByType
   * @param string priority
   * @return string
   */
  buildPromptText(filePath, issuesByType, priority) {
    const lines = [];

    lines.push(`# 🔧 Исправление проблем в ${filePath}`);
    lines.push('');
    lines.push(`**Приоритет:** ${this.getPriorityEmoji(priority)} ${priority.toUpperCase()}`);
    lines.push('');

    lines.push('## 📋 Найденные проблемы:');
    lines.push('');

    for (const [type, issues] of Object.entries(issuesByType)) {
      lines.push(`### ${this.getTypeEmoji(type)} ${this.formatTypeName(type)}`);
      lines.push('');

      const uniqueIssues = this.deduplicateIssues(issues);
      
      for (const issue of uniqueIssues) {
        lines.push(`**Строка ${issue.line}:**`);
        lines.push(`- ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`- 💡 Рекомендация: ${issue.suggestion}`);
        }
        lines.push('');
      }
    }

    lines.push('## 🎯 Задачи:');
    lines.push('');
    lines.push(`1. Открой файл \`${filePath}\``);
    lines.push('2. Исправь все проблемы следуя рекомендациям выше');
    lines.push('3. Следуй принципам:');
    lines.push('   - SOLID principles');
    lines.push('   - PSR-12 coding style');
    lines.push('   - Laravel best practices');
    lines.push('   - Типизация (type hints + return types)');
    lines.push('   - PHPDoc для публичных методов');
    lines.push('');

    lines.push('## ✅ Критерии успеха:');
    lines.push('');
    
    for (const [type, issues] of Object.entries(issuesByType)) {
      lines.push(`- [ ] Исправлено: ${this.formatTypeName(type)} (${issues.length} проблем)`);
    }
    lines.push('- [ ] Код следует Laravel conventions');
    lines.push('- [ ] Добавлены type hints и return types');
    lines.push('- [ ] Добавлены PHPDoc комментарии');
    lines.push('- [ ] Код читаемый и поддерживаемый');
    lines.push('');

    const strategy = this.getFixStrategy(issuesByType);
    if (strategy) {
      lines.push('## 📚 Стратегия исправления:');
      lines.push('');
      lines.push(strategy);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Удаляет дублирующиеся проблемы
   *
   * @param array issues
   * @return array
   */
  deduplicateIssues(issues) {
    const seen = new Set();
    const unique = [];

    for (const issue of issues) {
      const key = `${issue.line}:${issue.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(issue);
      }
    }

    return unique;
  }

  /**
   * Генерирует стратегию исправления
   *
   * @param object issuesByType
   * @return string
   */
  getFixStrategy(issuesByType) {
    const types = Object.keys(issuesByType);
    const strategies = [];

    if (types.includes('sql_injection_risk')) {
      strategies.push('### 🔒 Security First!');
      strategies.push('1. Исправь SQL Injection - используй parameter binding');
      strategies.push('2. Замени `DB::raw("... $var")` на `DB::raw("... ?", [$var])`');
      strategies.push('3. Используй Query Builder вместо raw queries где возможно');
      strategies.push('');
    }

    if (types.includes('n_plus_one_query')) {
      strategies.push('### ⚡ Performance - N+1 Queries');
      strategies.push('1. Найди все циклы с обращением к relationships');
      strategies.push('2. Добавь `->with([\'relationName\'])` перед циклом');
      strategies.push('3. Для вложенных отношений: `->with([\'relation.nested\'])`');
      strategies.push('');
    }

    if (types.includes('method_size') || types.includes('high_complexity')) {
      strategies.push('### 📏 Рефакторинг больших методов');
      strategies.push('1. **Сначала** определи логические блоки в методе');
      strategies.push('2. Извлеки каждый блок в отдельный private метод');
      strategies.push('3. Дай методам понятные имена (что делают, не как)');
      strategies.push('4. **Важно:** после рефакторинга проверь на дублирование!');
      strategies.push('');
    }

    if (types.includes('duplicate_code')) {
      strategies.push('### 🧹 Дублирование кода');
      strategies.push('1. **Внимание:** Если есть большие методы - сначала их разбей!');
      strategies.push('2. После разбиения найди похожие методы');
      strategies.push('3. Извлеки общую логику в отдельный метод');
      strategies.push('4. Если дублирование между классами - создай trait или базовый класс');
      strategies.push('');
    }

    if (types.includes('business_logic_in_controller') || types.includes('thick_controller')) {
      strategies.push('### 🏗️ Architecture - Service Layer');
      strategies.push('1. Создай Service класс (например, `OrderService`)');
      strategies.push('2. Перенеси бизнес-логику из контроллера в сервис');
      strategies.push('3. Inject сервис через constructor');
      strategies.push('4. В контроллере оставь только: валидацию, вызов сервиса, возврат response');
      strategies.push('');
    }

    if (types.includes('too_many_parameters')) {
      strategies.push('### 📦 DTO для множества параметров');
      strategies.push('1. Создай DTO класс (Data Transfer Object)');
      strategies.push('2. Используй typed properties (PHP 8.0+)');
      strategies.push('3. Замени список параметров на один DTO объект');
      strategies.push('');
    }

    return strategies.length > 0 ? strategies.join('\n') : null;
  }

  /**
   * Генерирует команду для Cursor
   *
   * @param string filePath
   * @param string prompt
   * @return string
   */
  generateCursorCommand(filePath, prompt) {
    return `@${filePath} ${prompt.split('\n').slice(0, 3).join(' ')}`;
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
      major: '🟠',
      minor: '🟡',
      info: '🔵'
    };
    return emojis[priority] || '⚪';
  }

  /**
   * Получает emoji для типа проблемы
   *
   * @param string type
   * @return string
   */
  getTypeEmoji(type) {
    const emojis = {
      sql_injection_risk: '🔒',
      xss_vulnerability: '🔒',
      mass_assignment_vulnerability: '🔒',
      n_plus_one_query: '⚡',
      query_in_loop: '⚡',
      missing_cache: '🚀',
      method_size: '📏',
      high_complexity: '🧠',
      duplicate_code: '🔄',
      god_class: '🏛️',
      business_logic_in_controller: '🏗️'
    };
    return emojis[type] || '📋';
  }

  /**
   * Форматирует название типа проблемы
   *
   * @param string type
   * @return string
   */
  formatTypeName(type) {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Сохраняет промпты в файлы
   *
   * @param array prompts
   * @param string outputDir
   * @return void
   */
  async savePrompts(prompts, outputDir) {
    await fs.mkdir(outputDir, { recursive: true });

    const indexFile = {
      generatedAt: new Date().toISOString(),
      totalFiles: prompts.length,
      byPriority: {
        critical: prompts.filter(p => p.priority === 'critical').length,
        major: prompts.filter(p => p.priority === 'major').length,
        minor: prompts.filter(p => p.priority === 'minor').length,
        info: prompts.filter(p => p.priority === 'info').length
      },
      files: prompts.map(p => ({
        file: p.file,
        priority: p.priority,
        issueCount: p.issueCount,
        issueTypes: p.issueTypes
      }))
    };

    await fs.writeFile(
      path.join(outputDir, 'prompts-index.json'),
      JSON.stringify(indexFile, null, 2)
    );

    for (const prompt of prompts) {
      const fileName = this.sanitizeFileName(prompt.file);
      const filePath = path.join(outputDir, `${fileName}.md`);
      await fs.writeFile(filePath, prompt.prompt);
    }

    const masterPrompt = this.generateMasterPrompt(prompts);
    await fs.writeFile(
      path.join(outputDir, 'MASTER_PROMPT.md'),
      masterPrompt
    );

    console.log(`\n✅ Промпты сохранены в ${outputDir}/`);
    console.log(`📄 Всего файлов: ${prompts.length}`);
    console.log(`🔴 Critical: ${indexFile.byPriority.critical}`);
    console.log(`🟠 Major: ${indexFile.byPriority.major}`);
    console.log(`\n💡 Используй: cursor ${outputDir}/MASTER_PROMPT.md\n`);
  }

  /**
   * Генерирует мастер-промпт для всего проекта
   *
   * @param array prompts
   * @return string
   */
  generateMasterPrompt(prompts) {
    const lines = [];

    lines.push('# 🚀 Master Plan - Рефакторинг проекта');
    lines.push('');
    lines.push(`Дата создания: ${new Date().toLocaleString('ru-RU')}`);
    lines.push('');

    const byPriority = {
      critical: prompts.filter(p => p.priority === 'critical'),
      major: prompts.filter(p => p.priority === 'major'),
      minor: prompts.filter(p => p.priority === 'minor'),
      info: prompts.filter(p => p.priority === 'info')
    };

    lines.push('## 📊 Статистика');
    lines.push('');
    lines.push(`- Всего файлов с проблемами: **${prompts.length}**`);
    lines.push(`- 🔴 Critical: **${byPriority.critical.length}** файлов`);
    lines.push(`- 🟠 Major: **${byPriority.major.length}** файлов`);
    lines.push(`- 🟡 Minor: **${byPriority.minor.length}** файлов`);
    lines.push(`- 🔵 Info: **${byPriority.info.length}** файлов`);
    lines.push('');

    lines.push('## 🎯 Стратегия исправления');
    lines.push('');
    lines.push('### Фаза 1: Security (Critical) 🔒');
    lines.push('');
    
    if (byPriority.critical.length > 0) {
      lines.push('**Файлы для исправления:**');
      lines.push('');
      for (const prompt of byPriority.critical) {
        lines.push(`1. \`${prompt.file}\` - ${prompt.issueCount} проблем`);
        lines.push(`   - Типы: ${prompt.issueTypes.join(', ')}`);
        lines.push(`   - Промпт: см. \`${this.sanitizeFileName(prompt.file)}.md\``);
        lines.push('');
      }
    } else {
      lines.push('✅ Нет critical проблем!');
      lines.push('');
    }

    lines.push('### Фаза 2: Architecture & Performance (Major) ⚡');
    lines.push('');
    
    if (byPriority.major.length > 0) {
      const topFiles = byPriority.major
        .sort((a, b) => b.issueCount - a.issueCount)
        .slice(0, 10);
      
      lines.push('**Топ-10 файлов с проблемами:**');
      lines.push('');
      for (let i = 0; i < topFiles.length; i++) {
        const prompt = topFiles[i];
        lines.push(`${i + 1}. \`${prompt.file}\` - ${prompt.issueCount} проблем`);
      }
      lines.push('');
    }

    lines.push('### Фаза 3: Code Quality (Minor) 🧹');
    lines.push('');
    lines.push(`- ${byPriority.minor.length} файлов с minor проблемами`);
    lines.push('- Исправляются после critical и major');
    lines.push('');

    lines.push('## 🔄 Workflow');
    lines.push('');
    lines.push('### Для каждого файла:');
    lines.push('');
    lines.push('1. Открой соответствующий `.md` промпт файл');
    lines.push('2. Скопируй промпт полностью');
    lines.push('3. В Cursor AI вставь: `@path/to/file.php <промпт>`');
    lines.push('4. Проверь предложенные изменения');
    lines.push('5. Примени исправления');
    lines.push('6. Запусти тесты (если есть)');
    lines.push('7. Коммит: `fix: resolve <issue-type> in <file>`');
    lines.push('');

    lines.push('## ⚠️ Важные замечания');
    lines.push('');
    lines.push('### Порядок исправления проблем:');
    lines.push('');
    lines.push('1. **Security (Critical)** - исправляем ПЕРВЫМИ');
    lines.push('2. **N+1 Queries** - добавляем eager loading');
    lines.push('3. **Большие методы** - РАЗБИВАЕМ НА ЧАСТИ');
    lines.push('4. **Дублирование кода** - ПОСЛЕ разбиения методов!');
    lines.push('5. **Architecture** - Service Layer, Repository');
    lines.push('6. **Code Smells** - рефакторинг качества');
    lines.push('');

    lines.push('### ⚡ Критически важно:');
    lines.push('');
    lines.push('> **Если в файле есть и "большие методы" и "дублирование кода":**');
    lines.push('> 1. СНАЧАЛА разбей большие методы на маленькие');
    lines.push('> 2. ПОТОМ запусти анализ заново на этот файл');
    lines.push('> 3. ТОЛЬКО ПОТОМ исправляй дублирование');
    lines.push('>');
    lines.push('> Иначе после разбиения методов дублирование может исчезнуть само!');
    lines.push('');

    lines.push('## 📋 Quick Commands');
    lines.push('');
    lines.push('```bash');
    lines.push('# Повторный анализ после исправлений');
    lines.push('npm start -- --file=path/to/fixed-file.php');
    lines.push('');
    lines.push('# Анализ всех исправленных файлов');
    lines.push('npm start -- --git-diff --compact');
    lines.push('');
    lines.push('# Проверка прогресса');
    lines.push('npm start -- --path=. --compact');
    lines.push('```');
    lines.push('');

    lines.push('---');
    lines.push('');
    lines.push('✨ **Начни с файлов Critical priority!**');
    lines.push('');

    return lines.join('\n');
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

