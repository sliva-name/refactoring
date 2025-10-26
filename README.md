# 🔍 Laravel Code Improver

Автоматический инструмент для анализа и улучшения качества кода Laravel проектов.

## ✨ Возможности

- 🔒 **Security Analyzer** - Поиск уязвимостей (SQL Injection, XSS, Mass Assignment)
- ⚡ **N+1 Query Detector** - Обнаружение N+1 запросов и проблем с eager loading
- 🚀 **Performance Analyzer** - Оптимизация запросов, индексы, кеширование
- 🔄 **Duplication Detector** - Продвинутый поиск дублирования кода (85%+ similarity)
- 🧹 **Code Smell Detector** - Антипаттерны и проблемы проектирования
- 💡 **Logic Q&A Generator** - Вопросы о корректности логики (edge cases, null safety)
- 🤖 **Cursor AI Prompts** - Автоматическая генерация промптов для исправления
- 📏 **Анализ размера методов** - Выявление слишком длинных методов
- 🧠 **Анализ сложности** - Определение сложной логики
- 📝 **Проверка типизации** - Валидация type hints
- 📚 **Анализ документации** - Проверка PHPDoc
- 🏗️ **Архитектурный анализ** - Соответствие практикам Laravel
- 📊 **Детальные отчеты** - JSON, HTML и Cursor AI промпты

## 🚀 Быстрый старт

### Анализ с сохранением в проект

```bash
# Быстрый запуск
./quick-start.sh

# Или напрямую
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=refactoring \
  --verbose
```

Отчеты будут сохранены в папку `refactoring/` вашего Laravel проекта!

### Файлы отчетов

После анализа в папке `refactoring/` появится:

- ✅ **code-report-top5.json** - Топ-5 проблем на файл (для Cursor)
- ✅ **code-report-compact.json** - Только major проблемы
- ✅ **code-report.json** - Полный отчет

## 📊 Использование отчетов в Cursor

### 1. Откройте отчет:
```bash
# В терминале Cursor
cursor /home/ghost/saasApp/refactoring/code-report-top5.json
```

### 2. Используйте с AI:
```
@refactoring/code-report-top5.json Какие самые критичные проблемы?
```

### 3. Или в чате Cursor:
```
@refactoring/code-report-top5.json Создай план рефакторинга
```

## 🛠️ Параметры

| Параметр | Описание | Пример |
|----------|----------|--------|
| `--path` | Путь к проекту | `--path=/home/ghost/saasApp` |
| `--file` | Анализ одного файла | `--file=app/Models/User.php` |
| `--files` | Анализ нескольких файлов | `--files="Model.php,Controller.php"` |
| `--git-diff` | Только измененные файлы | `--git-diff` |
| `--git-staged` | Только staged файлы | `--git-staged` |
| `--refactor-dir` | Папка в проекте для отчетов | `--refactor-dir=refactoring` |
| `--compact` | Только major/critical | `--compact` |
| `--top` | Макс проблем на файл | `--top=5` |
| `--verbose` | Подробный вывод | `--verbose` |
| `--exclude` | Исключения | `--exclude=vendor,tests` |

## 📋 Примеры

### Полный анализ в проект:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=refactoring
```

### Анализ одного файла:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --file=app/Http/Controllers/ProductController.php
```

### Анализ нескольких файлов:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --files="app/Models/User.php,app/Services/OrderService.php"
```

### Анализ только измененных файлов (git):
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --git-diff \
  --refactor-dir=refactoring
```

### Анализ staged файлов перед коммитом:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --git-staged
```

### Компактный отчет (только major/critical):
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=reports \
  --compact
```

### Топ-3 проблемы на файл:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=reports \
  --top=3
```

### С автоматической генерацией промптов для Cursor:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=refactoring

# Результат:
# ✓ code-report.json
# ✓ cursor-prompts/MASTER_PROMPT.md
# ✓ cursor-prompts/File1.md, File2.md, ...
```

## 🔧 Установка

```bash
# В WSL
sudo apt-get install -y build-essential python3-dev nodejs

# Установка зависимостей
npm install
```

## 📁 Структура отчетов

```
saasApp/
└── refactoring/
    ├── code-report.json         # Полный отчет
    ├── code-report-compact.json # Только major
    └── code-report-top5.json    # Топ-5 (для Cursor)
```

## 🔍 Типы анализируемых проблем

### 🔒 Безопасность (SecurityAnalyzer)
- SQL Injection риски (DB::raw с переменными)
- XSS уязвимости (неэкранированный вывод)
- Mass Assignment без $fillable/$guarded
- Опасные функции (eval, exec, shell_exec)
- Небезопасное хранение паролей
- Отсутствие валидации при загрузке файлов
- CSRF защита в формах

### ⚡ N+1 Queries (NPlusOneDetector)
- Обращение к relationship внутри цикла
- Отсутствие eager loading (->with())
- Запросы к БД внутри foreach
- Lazy loading при передаче в view

### 🚀 Производительность (PerformanceAnalyzer)
- Запросы без WHERE или LIMIT
- Использование ::all() вместо фильтрации
- Отсутствие индексов в миграциях
- Множественные DB операции без транзакций
- SELECT * вместо выбора нужных колонок
- Отсутствие кеширования для тяжелых запросов
- Неэффективные циклы

### 🔄 Дублирование кода (DuplicationDetector)
- Дублирующиеся методы (85%+ similarity)
- Дублирующиеся блоки кода (5+ строк)
- Умная нормализация (игнорирует имена переменных, строки, числа)
- Токенизация для точного сравнения

### 🧹 Code Smells (CodeSmellDetector)
- Слишком много параметров (>4)
- God Class (>15 методов)
- Неиспользуемые методы и импорты
- Primitive Obsession
- Feature Envy
- Большие классы (>300 строк)

### 🏗️ Архитектура (ArchitectureAnalyzer)
- Бизнес-логика в контроллерах
- Отсутствие Service Layer
- "Жирные" контроллеры и модели
- Прямые SQL запросы в контроллерах
- Отсутствие валидации через Form Requests

### 📝 Качество кода
- Методы длиннее 15 строк
- Высокая цикломатическая сложность
- Отсутствие type hints
- Отсутствие PHPDoc документации
- Magic numbers в коде

## 🤖 Cursor AI Prompts

### Автоматическая генерация промптов

Анализатор автоматически создает **готовые промпты для Cursor AI**!

```bash
npm start -- --path=/project --refactor-dir=refactoring

# Создается:
refactoring/cursor-prompts/
├── MASTER_PROMPT.md          # Мастер-план рефакторинга
├── prompts-index.json        # Индекс всех промптов
└── File1.md, File2.md...     # Промпты для каждого файла

# + Logic Q&A Reports:
refactoring/logic-qa/
├── INTERACTIVE_CHECKLIST.md        # Интерактивный чеклист
├── LOGIC_QUESTIONS_BY_PRIORITY.md  # По приоритету
└── by-file/                        # По файлам
```

### Как использовать:

```bash
# 1. Открыть мастер-план
cursor refactoring/cursor-prompts/MASTER_PROMPT.md

# 2. Скопировать промпт из нужного .md файла
# 3. В Cursor AI:
@path/to/file.php [вставить промпт]
```

### Что включает промпт:

- 📋 Список всех проблем с номерами строк
- 💡 Конкретные рекомендации по исправлению
- 🎯 Критерии успеха (чеклист)
- 📚 Стратегия исправления
- ⚠️ Предупреждения о порядке исправлений

### ⚡ Важно: Порядок исправления

```
1. Security (Critical) → Сначала безопасность!
2. N+1 Queries → Производительность
3. Большие методы → РАЗБИТЬ НА ЧАСТИ
4. Повторный анализ → npm start -- --file=...
5. Дублирование → ПОСЛЕ разбиения методов!
6. Architecture → Service Layer
7. Code Quality → Полировка
```

**Почему этот порядок?**  
После разбиения больших методов дублирование может исчезнуть само!

Подробнее: [CURSOR_PROMPTS_GUIDE.md](./CURSOR_PROMPTS_GUIDE.md)

---

## 💡 Logic Q&A - Проверка логики кода

### Интерактивные вопросы о логике

Анализатор генерирует **вопросы о корректности логики** вашего кода!

### Какие вопросы задаются:

```markdown
🔴 CRITICAL: Множественные модификации БД без транзакции. 
            Что если одна операция упадет?

Check Points:
- [ ] Обеспечена ли атомарность операций?
- [ ] Что произойдет при частичном выполнении?
- [ ] Нужна ли транзакция?

Expected: Транзакция используется или операции независимы
```

### Категории вопросов:

| Категория | Примеры вопросов |
|-----------|------------------|
| 🔀 **Conditions** | Все ли ветки if обработаны? |
| 🔄 **Loops** | Что если коллекция пустая? |
| 🛡️ **Null Safety** | Что если find() вернет null? |
| ⚠️ **Edge Cases** | Пустой массив, нулевое значение? |
| 💾 **Transactions** | Нужна ли транзакция? |
| ✅ **Validation** | Данные проверены? |
| ↩️ **Return Values** | Все пути возврата покрыты? |
| ⚡ **Exceptions** | Кто ловит exception? |

### Использование:

```bash
# 1. Анализ
npm start -- --path=/project --refactor-dir=refactoring

# 2. Открыть чеклист
cursor refactoring/logic-qa/INTERACTIVE_CHECKLIST.md

# 3. Ответить на вопросы
# 4. Использовать для написания тестов!
```

### Зачем это нужно:

✅ **Найти edge cases** - которые не протестированы  
✅ **Улучшить тесты** - каждый вопрос = идея для теста  
✅ **Code review** - проверка логики перед мержем  
✅ **Onboarding** - понимание сложной логики  
✅ **Документация** - почему сделано именно так  

Подробнее: [LOGIC_QA_GUIDE.md](./LOGIC_QA_GUIDE.md)

---

## 💡 Советы

1. **Используйте автоматические промпты** - они учитывают правильный порядок исправлений
2. Начните с исправления **critical** проблем безопасности
3. **Сначала разбивайте большие методы**, потом ищите дублирование
4. Оптимизируйте **N+1 запросы** для улучшения производительности
5. Используйте `--git-diff` для анализа только изменений
6. Запускайте с `--git-staged` перед коммитом
7. **Повторный анализ** после больших рефакторингов обязателен!

## 📚 Дополнительно

- [GET_STARTED.md](./GET_STARTED.md) - Подробная инструкция
- [CURSOR_IMPORT.md](./CURSOR_IMPORT.md) - Работа с Cursor
- [SUMMARY.md](./SUMMARY.md) - Описание форматов

---

Made with ❤️ for Laravel developers
