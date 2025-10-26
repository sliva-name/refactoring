# 📊 Новая структура отчета - Группировка по файлам

## Что изменилось

Теперь отчет **сгруппирован по файлам**, что намного удобнее для анализа и работы с AI!

---

## 🆕 Новая структура

```json
{
  "timestamp": "2025-10-26T18:55:12.184Z",
  "summary": {
    "totalIssues": 6797,
    "totalFiles": 109,
    "filesWithIssues": 109,
    "byType": { ... },
    "bySeverity": { ... }
  },
  "files": [
    {
      "filePath": "app/Models/Product.php",
      "issueCount": 12,
      "issuesByType": {
        "missing_fillable": 5,
        "missing_method_doc": 3,
        "high_complexity": 2,
        "missing_return_type": 2
      },
      "issuesBySeverity": {
        "major": 8,
        "minor": 4
      },
      "issues": [
        {
          "type": "missing_fillable",
          "severity": "major",
          "message": "Model missing $fillable property",
          "filePath": "app/Models/Product.php",
          "line": 5,
          "suggestion": "Add protected $fillable property"
        },
        ...
      ]
    },
    ...
  ]
}
```

---

## ✅ Преимущества новой структуры

### 1. Удобство навигации
Теперь легко найти все проблемы конкретного файла:
```bash
# Найти проблемы в конкретном файле
jq '.files[] | select(.filePath == "app/Models/Product.php")'
```

### 2. Приоритизация
Видно, сколько проблем в каждом файле:
```json
"filePath": "app/Models/Product.php",
"issueCount": 12,  // ← Сразу видно количество
```

### 3. Статистика по файлу
Для каждого файла есть сводка:
- `issuesByType` - какие типы проблем
- `issuesBySeverity` - по важности
- `issueCount` - общее количество

### 4. Удобно для AI
С AI проще работать:
```
@refactoring/code-report.json Покажи проблемы в app/Models/Product.php
```

---

## 📊 Статистика

```json
{
  "summary": {
    "totalIssues": 6797,      // Всего проблем
    "totalFiles": 109,        // Всего файлов с проблемами
    "filesWithIssues": 109    // Сколько файлов имеют проблемы
  }
}
```

---

## 🎯 Использование с Cursor AI

### Примеры запросов:

```
1. Покажи файлы с наибольшим количеством проблем
@refactoring/code-report.json Покажи топ-10 файлов с наибольшим количеством проблем

2. Анализ конкретного файла
@refactoring/code-report.json Проанализируй проблемы в app/Models/Product.php

3. Фильтрация по типу
@refactoring/code-report.json Покажи все файлы с missing_fillable проблемой

4. План исправления
@refactoring/code-report.json Создай план исправления для app/Http/Controllers/
```

---

## 🔍 Что анализируется

### Группировка показывает:

1. **По файлу**
   - Все проблемы конкретного файла
   - Статистика по типам
   - Статистика по важности

2. **По типу проблемы**
   - Сколько проблем каждого типа в файле
   - Какие типы чаще всего

3. **По важности**
   - Критические, major, minor, info
   - Приоритезация исправлений

---

## 📁 Файлы

| Файл | Размер | Описание |
|------|--------|----------|
| code-report.json | 237 KB | Полный отчет с группировкой |
| code-report-compact.json | 1.9 MB | Только major проблемы |
| code-report-top5.json | 237 KB | Топ-5 проблем на файл |

---

## 🎯 Пример анализа файла

```json
{
  "filePath": "app/Http/Controllers/ProductController.php",
  "issueCount": 15,
  "issuesByType": {
    "thick_controller": 3,
    "business_logic_in_controller": 2,
    "missing_method_doc": 5,
    "high_complexity": 2,
    "missing_return_type": 3
  },
  "issuesBySeverity": {
    "major": 8,
    "minor": 7
  },
  "issues": [
    {
      "type": "thick_controller",
      "severity": "major",
      "message": "Controller has too many responsibilities",
      "line": 5,
      "suggestion": "Extract business logic to a Service class"
    }
    ...
  ]
}
```

---

## 💡 Советы по использованию

### 1. Начните с самых проблемных файлов
```bash
# Файлы отсортированы по количеству проблем
cat code-report.json | jq '.files | sort_by(.issueCount) | reverse'
```

### 2. Фильтруйте по типу проблемы
```bash
# Только missing_fillable
cat code-report.json | jq '.files[] | select(.issuesByType.missing_fillable)'
```

### 3. Работайте с AI
```
@refactoring/code-report.json Какие контроллеры нарушают Single Responsibility?
```

---

✅ **Новая структура намного удобнее для работы!**

