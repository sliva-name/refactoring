# 📊 Новая структура отчета

## ✨ Структура с группировкой по строкам

Теперь отчет имеет удобную структуру для работы с AI:

```json
{
  "summary": { ... },
  "files": [
    {
      "file": "app/Models/Product.php",
      "issueCount": 12,
      "issues": {
        "11": [
          {
            "type": "missing_fillable",
            "severity": "major",
            "message": "Model missing $fillable property",
            "suggestion": "Add protected $fillable property"
          }
        ],
        "25": [
          {
            "type": "missing_method_doc",
            "severity": "minor",
            "message": "Method missing PHPDoc",
            "suggestion": "Add PHPDoc with @param and @return"
          }
        ],
        "42": [
          {
            "type": "high_complexity",
            "severity": "major",
            "message": "High complexity (15)",
            "suggestion": "Simplify logic"
          }
        ]
      }
    }
  ]
}
```

---

## 🎯 Преимущества:

### 1. Удобно для AI
AI может напрямую указывать на строки:
```
Исправь в app/Models/Product.php:
- Строка 11: добавь $fillable
- Строка 25: добавь PHPDoc
- Строка 42: упрости логику
```

### 2. Навигация по коду
Легко открыть файл и перейти к проблемной строке:
```
Ctrl+G (go to line) → введите номер строки
```

### 3. Компактность
Один объект на файл со всеми проблемами:
```json
{
  "file": "путь/к/файлу.php",
  "issueCount": 5,
  "issues": {
    "строка1": [проблемы],
    "строка2": [проблемы]
  }
}
```

---

## 🤖 Промпт для Cursor:

```
Проанализируй отчет refactoring/code-report.json.

Для каждого файла из files:
1. Открой файл
2. Перейди к строкам с проблемами из issues
3. Исправь каждую проблему согласно suggestion

Пример:
Файл: app/Models/Product.php
Строка 11: missing_fillable → добавь protected $fillable = [...]
Строка 25: missing_method_doc → добавь PHPDoc
Строка 42: high_complexity → упрости логику

Начни с первых 10 файлов из отчета.
```

---

## 📊 Статистика:

- **Размер:** ~200 KB
- **Файлов:** 109
- **Проблем:** 6619
- **Компактность:** ~1 строка = 1 проблема

---

✅ **Новая структура готова к использованию!**

