# 🔍 Laravel Code Improver

Автоматический инструмент для анализа и улучшения качества кода Laravel проектов.

## ✨ Возможности

- 📏 **Анализ размера методов** - Выявление слишком длинных методов
- 🧠 **Анализ сложности** - Определение сложной логики
- 📝 **Проверка типизации** - Валидация type hints
- 📚 **Анализ документации** - Проверка PHPDoc
- 🏗️ **Архитектурный анализ** - Соответствие практикам Laravel
- 📊 **Детальные отчеты** - JSON и HTML форматы

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

### Компактный отчет:
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

## 💡 Советы

1. Используйте `code-report-top5.json` для работы с Cursor AI
2. Откройте HTML версию для визуального просмотра
3. Начните с исправления major проблем
4. Используйте `--compact` для быстрого обзора

## 📚 Дополнительно

- [GET_STARTED.md](./GET_STARTED.md) - Подробная инструкция
- [CURSOR_IMPORT.md](./CURSOR_IMPORT.md) - Работа с Cursor
- [SUMMARY.md](./SUMMARY.md) - Описание форматов

---

Made with ❤️ for Laravel developers
