# Laravel Code Improver

Автоматический инструмент для улучшения качества кода Laravel проектов.

## Возможности

- 🔍 **Анализ размера методов** - Определяет слишком длинные методы и предлагает рефакторинг
- 🧠 **Анализ сложности логики** - Выявляет сложную логику и генерирует вопросы
- 📝 **Проверка типов** - Валидирует type hints и return types
- 📚 **Анализ DocBlock** - Проверяет наличие PHPDoc документации
- 🏗️ **Архитектурный анализ** - Проверяет соблюдение практик Laravel (Service Layer, Repository Pattern)
- 🔧 **Интеграция линтеров** - Поддержка PHPCS, PHPMD, PHPStan
- 📊 **Детальные отчёты** - Генерирует JSON отчёты

## Установка

```bash
npm install
```

## Использование

### Базовое использование

```bash
npm start -- --path=/home/ghost/saasApp
```

### Варианты запуска

- `--path, -p` - Путь для анализа (по умолчанию: текущая директория)
- `--output, -o` - Путь к файлу отчёта (по умолчанию: code-report.json)
- `--verbose, -v` - Подробный вывод
- `--fix, -f` - Автоматическое исправление (когда поддерживается)
- `--exclude, -e` - Паттерны исключения (через запятую)

## Примеры использования

### Анализ Laravel проекта

```bash
# Простой запуск
npm start -- --path=/home/ghost/saasApp

# С подробным выводом
npm start -- --path=/home/ghost/saasApp --verbose

# С сохранением в конкретный файл
npm start -- --path=/home/ghost/saasApp --output=saasApp-report.json

# Исключая определенные директории
npm start -- --path=/home/ghost/saasApp --exclude=vendor,tests,node_modules,storage
```

## Работа с WSL

### Установка в WSL

```bash
# 1. Установка инструментов для сборки
sudo apt-get update
sudo apt-get install -y build-essential python3-dev

# 2. Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Установка зависимостей проекта
npm install

# 4. Проверка установки
node check.js
```

### Быстрый запуск

Используйте готовый скрипт:

```bash
./quick-start.sh
```

Или напрямую:

```bash
npm start -- --path=/home/ghost/saasApp --verbose --output=saasApp-report.json
```

## Структура проекта

```
laravel-code-improver/
├── src/
│   ├── analyzers/          # Модули анализа кода
│   │   ├── MethodSizeAnalyzer.js
│   │   ├── LogicAnalyzer.js
│   │   ├── TypeChecker.js
│   │   ├── DocBlockAnalyzer.js
│   │   └── ArchitectureAnalyzer.js
│   ├── linters/            # Интеграции линтеров
│   │   └── Linter.js
│   ├── CodeAnalyzer.js     # Главный анализатор
│   └── Reporter.js         # Генератор отчётов
├── index.js                # Точка входа CLI
├── config.json             # Конфигурация
├── package.json            # NPM конфигурация
└── README.md               # Документация
```

## Конфигурация

Отредактируйте `config.json` для настройки правил анализа:

```json
{
  "analysisRules": {
    "methodSize": {
      "maxLines": 15,
      "enabled": true
    },
    "complexity": {
      "maxComplexity": 10,
      "enabled": true
    }
  }
}
```

## Типы проблем

### 1. Размер методов
Проверяет длину методов и предлагает разбиение на более мелкие функции.

### 2. Сложность логики
Обнаруживает вложенные условия, циклы и сложные выражения.

### 3. Типизация
Проверяет наличие type hints и return types.

### 4. Документация
Валидирует наличие PHPDoc для классов и методов.

### 5. Архитектура
Проверяет использование Service Layer, Repository Pattern и других практик Laravel.

## Интеграция с Cursor

1. Откройте Cursor Terminal: `Ctrl+``
2. Запустите анализатор: `npm start -- --path=/path/to/laravel/project`
3. Проверьте результаты: откройте `code-report.json`

## Требования

- Node.js 20.x или выше
- npm 9.x или выше
- WSL (для Windows пользователей)
- build-essential и python3-dev (для сборки нативных модулей)

## Устранение неполадок

### Ошибка при установке tree-sitter

Обновлены версии в `package.json`:
- `tree-sitter`: `^0.22.4`
- `tree-sitter-php`: `^0.24.2`

Установите инструменты для сборки:
```bash
sudo apt-get install -y build-essential python3-dev
```

### Проблемы с glob

Исправлен импорт для совместимости с `glob` v10:
```javascript
import { glob } from 'glob';
```

## Поддержка

Для вопросов и проблем:
- Проверьте документацию в `README_RU.md`
- См. примеры в `example-usage.js`
- Проверьте конфигурацию в `config.json`
