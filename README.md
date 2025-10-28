# 🔍 Laravel Code Analyzer

Автоматический инструмент для анализа качества кода Laravel проектов с детекцией архитектурных проблем, уязвимостей безопасности и производительности.

## ✨ Возможности

- 🔒 **Security Analyzer** - SQL Injection, XSS, Mass Assignment, опасные функции
- ⚡ **N+1 Query Detector** - N+1 запросы, отсутствие eager loading
- 🚀 **Performance Analyzer** - Оптимизация запросов, индексы, кеширование
- 🔄 **Duplication Detector** - Продвинутый поиск дублирования (85%+ similarity)
- 🧹 **Code Smell Detector** - Антипаттерны (God Class, Feature Envy, Primitive Obsession)
- 💡 **Logic Analyzer** - Вопросы о корректности логики (edge cases, null safety, транзакции)
- 🤖 **Cursor AI Prompts** - Автоматическая генерация промптов для рефакторинга
- 📏 **Method Size Analyzer** - Выявление слишком длинных методов
- 🧠 **Complexity Analyzer** - Анализ цикломатической сложности
- 📝 **Type Checker** - Валидация type hints и return types
- 📚 **DocBlock Analyzer** - Проверка PHPDoc документации
- 🏗️ **Architecture Analyzer** - Соответствие практикам Laravel (Service Layer, Repository Pattern)
- 🎯 **Class Conflict Analyzer** - Архитектурные проблемы (Multiple Classes per Table, Base Method Override)

## 🚀 Быстрый старт

### Установка

```bash
npm install
```

### Анализ проекта

```bash
# Полный анализ
npm start -- --path=/path/to/project

# Сохранение в папку проекта
npm start -- --path=/path/to/project --refactor-dir=refactoring

# Анализ только измененных файлов
npm start -- --path=/path/to/project --git-diff

# Только критичные проблемы
npm start -- --path=/path/to/project --compact
```

## 📊 Параметры

| Параметр | Описание |
|----------|----------|
| `--path` | Путь к проекту Laravel |
| `--file` | Анализ одного файла |
| `--files` | Анализ списка файлов (через запятую) |
| `--git-diff` | Только измененные файлы |
| `--git-staged` | Только staged файлы |
| `--refactor-dir` | Папка в проекте для отчетов |
| `--compact` | Только major/critical проблемы |
| `--top` | Максимум проблем на файл (по умолчанию 5) |
| `--verbose` | Подробный вывод |
| `--exclude` | Исключить папки (vendor,tests) |

## 🔍 Типы обнаружения

### 🔒 Безопасность
- SQL Injection (`DB::raw` с переменными, `whereRaw`, параметры в SQL)
- XSS уязвимости (неэкранированный `{!! !!}`, `htmlspecialchars` отсутствует)
- Mass Assignment (отсутствие `$fillable` или `$guarded`)
- Опасные функции (`eval()`, `exec()`, `shell_exec()`, `system()`)
- Пароли без хеширования (прямая запись в БД)
- Небезопасная загрузка файлов (без валидации типов)
- `extract()` с суперглобальными переменными

### ⚡ N+1 Queries
- Запросы к БД внутри `foreach`/`while`
- Отсутствие `->with()` для relationships
- Lazy loading при передаче в view
- `whereHas()` без eager loading

### 🚀 Производительность
- Запросы без `WHERE` или `LIMIT`
- `::all()` вместо фильтрации
- Отсутствие индексов в миграциях
- Множественные DB операции без транзакций
- `SELECT *` вместо конкретных колонок
- Отсутствие кеширования для тяжелых запросов

### 🔄 Дублирование
- Дублирующиеся методы (85%+ similarity)
- Дублирующиеся блоки кода (5+ строк)
- Токенизация для точного сравнения

### 🧹 Code Smells
- Слишком много параметров (>4)
- God Class (>15 методов)
- Неиспользуемые private методы
- Primitive Obsession (ID-параметры, валидация примитивов)
- Feature Envy (метод использует внешние объекты)
- Большие классы (>300 строк)

### 🏗️ Архитектура Laravel
- Бизнес-логика в контроллерах
- Отсутствие Service Layer
- Прямые SQL в контроллерах
- Отсутствие Form Requests для валидации
- Fat Controller/Model

### 🎯 Архитектурные конфликты
- **Multiple Classes per Table** - Несколько моделей используют одну таблицу (STI антипаттерн)
- **Base Method Override** - Переопределение `save()`, `create()`, `update()` с транзакциями
- **Parent-Child Dependency** - Parent использует child logic через conditionals
- **Unresolved TODO** - Незакрытые `TODO`/`FIXME` комментарии
- **Long Method Chaining** - Цепочки из 5+ вызовов
- **Service Locator Anti-pattern** - Использование `app()` в бизнес-логике
- **Static Method Abuse** - Избыточное использование статических методов
- **God Model** - Слишком большие модели с множеством ответственностей
- **Anemic Domain Model** - Модели-контейнеры данных
- **Data Clumps** - Группы параметров, проходящие вместе

### 💡 Логика кода
- High complexity (cyclomatic complexity > 10)
- Deep nesting (>4 уровней)
- Magic numbers (неименованные константы)
- Потенциальные edge cases
- Null safety вопросы
- Незакрытые транзакции

### 📝 Качество кода
- Отсутствие type hints
- Отсутствие return types
- Отсутствие PHPDoc
- Методы длиннее 15 строк
- Высокая цикломатическая сложность

## 📁 Структура отчетов

После анализа создаются:

```
project/
└── refactoring/
    ├── code-report.json              # Полный отчет
    ├── code-report-compact.json      # Только major/critical
    └── code-report-top5.json         # Топ-5 проблем на файл
```

## 🤖 Cursor AI Integration

Анализатор автоматически создает промпты для Cursor AI:

```
refactoring/
├── cursor-prompts/
│   ├── MASTER_PROMPT.md          # Мастер-план рефакторинга
│   ├── prompts-index.json        # Индекс всех промптов
│   └── File1.md, File2.md...     # Промпты для каждого файла
└── logic-qa/
    ├── INTERACTIVE_CHECKLIST.md        # Интерактивный чеклист
    ├── LOGIC_QUESTIONS_BY_PRIORITY.md  # По приоритету
    └── by-file/                        # По файлам
```

### Использование:

```bash
# 1. Открыть мастер-план
cursor refactoring/cursor-prompts/MASTER_PROMPT.md

# 2. Скопировать промпт из нужного файла
# 3. В Cursor AI:
@path/to/file.php [вставить промпт]
```

## 💡 Рекомендации по порядку исправления

```
1. Security (Critical) → Сначала безопасность!
2. N+1 Queries → Производительность
3. Большие методы → РАЗБИТЬ НА ЧАСТИ
4. Повторный анализ → npm start -- --file=...
5. Дублирование → ПОСЛЕ разбиения методов!
6. Architecture → Service Layer
7. Code Quality → Полировка
```

## 📚 Документация

- [ANALYZERS.md](./ANALYZERS.md) - Полная документация всех анализаторов
- [CHANGELOG.md](./CHANGELOG.md) - История изменений
- [CURSOR_PROMPTS_GUIDE.md](./CURSOR_PROMPTS_GUIDE.md) - Работа с Cursor AI
- [README_RU.md](./README_RU.md) - Русская версия README
- [README_USAGE_RU.md](./README_USAGE_RU.md) - Детальное руководство

## 🎯 Примеры использования

### Полный анализ проекта:
```bash
npm start -- --path=/home/user/project --refactor-dir=refactoring
```

### Анализ одного файла:
```bash
npm start -- --path=/home/user/project --file=app/Http/Controllers/UserController.php
```

### Анализ измененных файлов:
```bash
npm start -- --path=/home/user/project --git-diff --refactor-dir=reports
```

### Только критичные проблемы:
```bash
npm start -- --path=/home/user/project --compact --top=3
```

## 📈 Статистика

Обнаруживает **50+ типов проблем:**
- **Critical:** 15+ (security, data loss, N+1)
- **Major:** 20+ (architecture, performance)
- **Minor:** 10+ (code smells, documentation)
- **Info:** 5+ (optimizations, suggestions)

## 🔧 Технологии

- **Node.js** - Основной runtime
- **tree-sitter** - Парсинг PHP кода
- **tree-sitter-php** - PHP грамматика
- **Git** - Интеграция с git-diff

---

Made with ❤️ for Laravel developers
