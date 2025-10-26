# 📖 Laravel Code Improver - Руководство по использованию

## 🎯 Что это?

Автоматизированный инструмент для анализа и улучшения качества кода Laravel проектов.

---

## 🚀 Быстрый старт

### 1. Установка (уже сделано ✅)

```bash
cd ~/refactoringGuru
npm install
```

### 2. Запуск анализа

```bash
./quick-start.sh
```

Или вручную:

```bash
npm start -- --path=/home/ghost/saasApp --refactor-dir=refactoring
```

### 3. Откройте отчет в Cursor

```
Ctrl+P → refactoring/code-report.json
```

---

## 📊 Структура отчета

### Новый формат (рекомендуется):

Каждый файл сохранен отдельно в `refactoring/split/`:

```json
{
  "file": "app/Models/Product.php",
  "problems": {
    "missing_fillable": {
      "message": "Model missing $fillable or $guarded property",
      "fix": "Add protected $fillable = [...] with all fillable fields",
      "locations": [
        {"startLine": 1, "endLine": 1}
      ]
    },
    "method_size": {
      "message": "Method is too long",
      "fix": "Break this method into smaller, focused methods (SRP)",
      "locations": [
        {"startLine": 36, "endLine": 69}
      ]
    }
  }
}
```

**Где:**
- `file` - путь к PHP файлу
- `problems` - объект с типами проблем
- `message` - что не так
- `fix` - как исправить  
- `locations` - строки с проблемой (без дубликатов)

---

## 🔍 Типы проблем

### 🟥 Критические (critical)
Ошибки безопасности, критические баги

### 🟠 Важные (major)
- `missing_fillable` - Модели без $fillable (4764 случаев)
- `global_facade` - Использование глобальных фасадов (499)
- `high_complexity` - Сложная логика (362)
- `method_size` - Слишком длинные методы (108)

### 🟡 Минорные (minor)
- `missing_class_doc` - Нет PHPDoc у класса
- `missing_method_doc` - Нет PHPDoc у метода
- `missing_param_doc` - Нет @param

### 🔵 Информационные (info)
- `suggest_trait` - Рекомендации по трейтам (10)
- `suggest_scope` - Рекомендации по скоупам (3)
- `logic_question` - Вопросы по логике (389)

---

## 🤖 Работа с Cursor AI

### НОВАЯ СТРУКТУРА (Рекомендуется)

Теперь каждый файл сохранен отдельно в папке `refactoring/split/`:

```
refactoring/split/
├── index.json                                 # Список всех файлов
├── Http_Controllers_Api_ProductController_php.json
├── Models_Product_php.json
└── ... (109 файлов)
```

### Базовые промпты:

#### 1. Исправить конкретный файл

```bash
# Откройте JSON файл
cursor /home/ghost/saasApp/refactoring/split/Http_Controllers_Api_ProductController_php.json
```

**Промпт:**
```
Прочитай этот JSON и исправь проблемы в app/Http/Controllers/Api/ProductController.php:

Для каждой проблемы:
- Перейди к строке из locations
- Выполни инструкцию из fix
```

#### 2. Batch обработка через index

```bash
cursor /home/ghost/saasApp/refactoring/split/index.json
```

**Промпт:**
```
Исправь проблемы начиная с самых проблемных файлов:

Для каждого файла из списка:
1. Открой JSON файл из split/
2. Прочитай problems
3. Открой PHP файл
4. Исправь все проблемы согласно fix

Начни с файлов с наибольшим count.
```

#### 3. По типам файлов

**Models:**
```
Открой все JSON файлы вида Models_*_php.json из refactoring/split/

Для каждого:
- Найди проблему "missing_fillable" в problems
- Добавь protected $fillable со всеми полями из миграций
- Исправь другие проблемы согласно "fix"
```

**Controllers:**
```
Открой все Http_Controllers_*_php.json

Для каждого:
- Вынеси business_logic_in_controller в Service класс
- Разбей thick_controller на мелкие методы
- Добавь return types для missing_return_type
```

#### 4. По приоритету

```
По index.json обработай файлы в порядке убывания count.

Для каждого файла исправь:
P0: missing_fillable (Models) - добавь $fillable
P1: business_logic_in_controller - вынеси в Services
P2: high_complexity, method_size - упрости код
P3: missing_return_type - добавь типы
```

---

## 🎯 Основные команды

### Анализ с сохранением в проект:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=refactoring
```

### Только важные проблемы:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=refactoring \
  --compact
```

### Топ-5 проблем на файл:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=refactoring \
  --top=5
```

---

## 📁 Где находятся отчеты

Все отчеты сохраняются в проект:

```
/home/ghost/saasApp/
└── refactoring/
    ├── code-report.json         # Полный отчет (1.6 MB)
    └── split/                    # ⭐ Новый формат
        ├── index.json            # Список всех файлов
        ├── Models_Product_php.json
        ├── Http_Controllers_Api_ProductController_php.json
        └── ... (109 JSON файлов по одному на PHP файл)
```

**Формат каждого файла:**
```json
{
  "file": "app/Models/Product.php",
  "problems": {
    "missing_fillable": {
      "message": "Model missing $fillable property",
      "fix": "Add protected $fillable = [...]",
      "locations": [{"startLine": 1, "endLine": 1}]
    }
  }
}
```

---

## 🛠️ Параметры

| Параметр | Сокращение | Описание |
|----------|-----------|----------|
| `--path` | `-p` | Путь к проекту |
| `--refactor-dir` | `-r` | Папка для отчетов |
| `--output` | `-o` | Файл отчета |
| `--compact` | `-c` | Только major/critical |
| `--top` | `-t` | Макс проблем на файл |
| `--verbose` | `-v` | Подробный вывод |
| `--exclude` | `-e` | Исключения (через запятую) |

---

## 💡 Примеры использования

### Пример 1: Исправить Models

```bash
# Откройте Models_*.json файлы
cursor /home/ghost/saasApp/refactoring/split/Models_Product_php.json
```

**Промпт:**
```
Прочитай этот JSON.

Открой файл app/Models/Product.php и исправь проблемы:

1. Для "missing_fillable" (строка 1):
   - Добавь protected $fillable = [...] со всеми полями из миграций

2. Для "missing_return_type" (строка X):
   - Добавь return type к методу

Выполни все инструкции из fix для каждой проблемы.
```

### Пример 2: Рефакторинг контроллеров

```bash
cursor /home/ghost/saasApp/refactoring/split/Http_Controllers_Api_ProductController_php.json
```

**Промпт:**
```
Прочитай этот JSON и исправь проблемы:

1. "thick_controller" → Вынеси логику в Service
2. "business_logic_in_controller" → Создай ProductService
3. "method_size" → Разбей длинные методы
4. "high_complexity" → Упрости логику

Открой PHP файл и исправь все согласно инструкциям.
```

### Пример 3: Batch обработка

```
Открой все файлы из refactoring/split/ начиная с index.json

Обработай файлы последовательно:
1. Читай JSON файл
2. Открывай PHP файл
3. Исправляй проблемы из "problems"
4. Переходи к следующему файлу

Начни с самых проблемных (из index).
```

---

## 📈 Статистика вашего проекта

**Найдено проблем:** 6797  
**Файлов с проблемами:** 109  
**Время анализа:** ~30 секунд

### Топ-5 проблем:
1. `missing_fillable` - 4764
2. `global_facade` - 499
3. `logic_question` - 389
4. `high_complexity` - 362
5. `missing_param_doc` - 244

---

## 🎓 Лучшие практики

### 1. Начните с Models
Добавьте `$fillable` в каждую модель

### 2. Используйте Dependency Injection
Замените фасады на инъекцию через конструктор

### 3. Создавайте Service классы
Выносите бизнес-логику из контроллеров

### 4. Добавляйте типизацию
Type hints и return types везде

### 5. Документируйте код
PHPDoc для классов и методов

---

## 📚 Дополнительные материалы

- [CURSOR_AI_PROMPT.md](./CURSOR_AI_PROMPT.md) - Готовые промпты для AI
- [FILES_ANALYZED.md](./FILES_ANALYZED.md) - Какие файлы анализируются
- [REPORT_STRUCTURE.md](./REPORT_STRUCTURE.md) - Структура отчета

---

✅ **Готово! Теперь вы знаете как использовать инструмент!**

