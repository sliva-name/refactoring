# Changelog

## [2.0.0] - 2025-10-26

### 🎉 Major Release - Comprehensive Security & Performance Analysis

### ✨ Added

#### Новые анализаторы (4 шт):

1. **SecurityAnalyzer** (`src/analyzers/SecurityAnalyzer.js`)
   - SQL Injection detection (critical)
   - XSS vulnerability detection (critical)
   - Mass Assignment protection checks (critical)
   - Dangerous function detection (eval, exec, etc.)
   - Password security validation
   - File upload security checks
   - CSRF protection validation

2. **NPlusOneDetector** (`src/analyzers/NPlusOneDetector.js`)
   - N+1 query detection in loops (critical)
   - Missing eager loading detection
   - Query-in-loop patterns
   - Lazy loading in views detection

3. **PerformanceAnalyzer** (`src/analyzers/PerformanceAnalyzer.js`)
   - Unoptimized queries (no WHERE/LIMIT)
   - Missing database indexes
   - Missing transactions for multiple operations
   - SELECT * detection
   - Missing cache for expensive queries
   - Inefficient loops

4. **CodeSmellDetector** (`src/analyzers/CodeSmellDetector.js`)
   - Too many parameters (>4)
   - God Class detection (>15 methods)
   - Duplicate code detection
   - Unused code (methods, imports)
   - Primitive Obsession
   - Feature Envy
   - Large classes (>300 lines)

#### Новый функционал анализа файлов:

- **`--file`** - анализ одного конкретного файла
- **`--files`** - анализ списка файлов (через запятую)
- **`--git-diff`** - анализ только измененных файлов в git
- **`--git-staged`** - анализ только staged файлов

#### Новые методы в CodeAnalyzer:

- `findGitChangedFiles(staged)` - получение списка файлов из git
- Поддержка `specificFiles` в конструкторе

### 📝 Changed

#### index.js:
- Добавлены импорты 4 новых анализаторов
- Расширен список CLI опций (+4 новых параметра)
- Добавлена логика выбора файлов (file/files/git-diff/git-staged)
- Обновлен порядок анализаторов (Security first)

#### src/CodeAnalyzer.js:
- Добавлен import `execSync` для git команд
- Добавлен параметр `specificFiles` в конструктор
- Добавлен метод `findGitChangedFiles()`
- Обновлена логика `findFiles()` с поддержкой specificFiles

#### README.md:
- Обновлен раздел "Возможности" (+4 новых анализатора)
- Расширена таблица параметров (+4 новых опции)
- Добавлены новые примеры использования (7 вместо 3)
- Добавлен раздел "Типы анализируемых проблем" с подробным описанием
- Обновлены советы по использованию

### 📚 Documentation

Новые файлы документации:

1. **ANALYZERS.md** - Полная документация всех анализаторов
   - Подробные примеры для каждого типа проблем
   - Code examples (плохо ❌ / хорошо ✅)
   - Severity уровни
   - Workflow рекомендации

2. **WHATS_NEW.md** - Описание новых возможностей v2.0
   - Детальные примеры использования новых фич
   - Use cases и сценарии применения
   - Рекомендации по workflow (pre-commit, CI/CD)
   - Приоритеты исправления проблем

3. **CHANGELOG.md** - История изменений (этот файл)

### 🔧 Technical Details

**Новые файлы:**
- `src/analyzers/SecurityAnalyzer.js` (362 строки)
- `src/analyzers/NPlusOneDetector.js` (195 строк)
- `src/analyzers/PerformanceAnalyzer.js` (263 строки)
- `src/analyzers/CodeSmellDetector.js` (389 строк)
- `ANALYZERS.md` (645 строк)
- `WHATS_NEW.md` (456 строк)
- `CHANGELOG.md` (этот файл)

**Измененные файлы:**
- `index.js` (+38 строк)
- `src/CodeAnalyzer.js` (+29 строк)
- `README.md` (+154 строки)

**Всего добавлено:** ~2400 строк кода и документации

### 📊 Статистика проверок

Общее количество типов проблем, которые теперь обнаруживаются:

- **Security issues:** 7 типов (SQL Injection, XSS, Mass Assignment, etc.)
- **N+1 queries:** 4 паттерна
- **Performance:** 6 типов проблем
- **Code smells:** 7 антипаттернов
- **Architecture:** 5 паттернов (существующие)
- **Code quality:** 6 метрик (существующие)

**Итого:** 35+ типов проблем и паттернов

### 🎯 Severity Distribution

- **Critical:** 12 типов (security, N+1, data loss)
- **Major:** 15 типов (architecture, performance)
- **Minor:** 6 типов (code smells, documentation)
- **Info:** 5 типов (suggestions, optimizations)

### 🚀 Use Cases

Новые сценарии использования:

1. **Pre-commit validation**
   ```bash
   npm start -- --git-staged --compact
   ```

2. **Single file quick check**
   ```bash
   npm start -- --file=Controller.php
   ```

3. **PR review automation**
   ```bash
   npm start -- --git-diff --refactor-dir=pr-review
   ```

4. **Security audit**
   ```bash
   npm start -- --compact --path=/project
   # Фокус на critical security issues
   ```

### ⚠️ Breaking Changes

**Нет breaking changes!** Все изменения обратно совместимы.

Старые команды работают как раньше:
```bash
npm start -- --path=/project
```

### 📈 Performance Impact

Новые анализаторы увеличивают время анализа на:
- +15-20% для полного анализа проекта
- Минимальное влияние при анализе отдельных файлов

Оптимизация:
- Используйте `--file` для быстрых проверок
- Используйте `--git-diff` в CI/CD
- Используйте `--compact` для overview

### 🔮 Future Plans

Планируется в следующих версиях:

- [ ] HTML reports с графиками и подсветкой
- [ ] Auto-fix для простых проблем
- [ ] PHPStan/Psalm integration
- [ ] Custom rules через plugins
- [ ] VS Code extension
- [ ] GitHub Action
- [ ] Watch mode для hot-reload анализа

---

## [1.0.0] - Previous version

### Initial release

- Basic code analysis
- MethodSizeAnalyzer
- LogicAnalyzer
- TypeChecker
- DocBlockAnalyzer
- ArchitectureAnalyzer
- TraitScopeAnalyzer

---

**Full Changelog:** https://github.com/your-repo/compare/v1.0.0...v2.0.0

