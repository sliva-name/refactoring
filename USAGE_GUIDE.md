# 📚 Руководство по использованию

## ✅ Новая структура отчетов

Каждый файл с проблемами сохранен отдельно в папке `refactoring/split/`

---

## 📁 Структура:

```
refactoring/
├── code-report.json                # Полный отчет
└── split/
    ├── index.json                  # Список всех файлов
    ├── Http_Controllers_Api_ProductController_php.json
    ├── Models_Product_php.json
    └── ... (109 файлов)
```

---

## 📊 Формат каждого файла:

```json
{
  "file": "app/Http/Controllers/Api/ProductController.php",
  "problems": {
    "method_size": [
      {"startLine": 35, "endLine": 62},
      {"startLine": 93, "endLine": 112}
    ],
    "missing_return_type": [
      {"startLine": 25, "endLine": 25}
    ],
    "high_complexity": [
      {"startLine": 35, "endLine": 35}
    ]
  }
}
```

---

## 🚀 Использование в Cursor:

### Вариант 1: Откройте конкретный файл

```bash
cursor /home/ghost/saasApp/refactoring/split/Http_Controllers_Api_ProductController_php.json
```

**И попросите AI:**
```
Исправь все проблемы из этого отчета:
- Открой файл app/Http/Controllers/Api/ProductController.php
- Для каждой проблемы из problems перейди к строке startLine
- Исправь согласно типу проблемы
```

### Вариант 2: Используйте index.json

```bash
cursor /home/ghost/saasApp/refactoring/split/index.json
```

**И попросите AI:**
```
Открой файлы из этого индекса по порядку.
Исправь проблемы в каждом файле начиная с самого проблемного.
```

### Вариант 3: Batch обработка

```
Открой все JSON файлы из refactoring/split/
Для каждого файла:
1. Открой PHP файл указанный в "file"
2. Перейди к строкам из problems
3. Исправь проблемы
```

---

## 🎯 Примеры промптов:

### Исправить Models:

```
Открой файлы вида Models_*_php.json из refactoring/split/

Для каждого файла:
1. Открой PHP файл
2. Найдите проблемы missing_fillable
3. Добавь protected $fillable со всеми полями
```

### Исправить контроллеры:

```
Открой файлы вида Http_Controllers_*_php.json из refactoring/split/

Для каждого:
- Вынеси business_logic_in_controller в Service классы
- Разбей thick_controller на более мелкие контроллеры
- Добавь return types для missing_return_type
```

### Рефакторинг по приоритету:

```
По index.json начни с файлов с наибольшим count.

Для каждого файла исправь:
P0: missing_fillable (Models)
P1: business_logic_in_controller (вынести в Services)
P2: high_complexity, method_size (упростить)
P3: missing_return_type, missing_param_doc (документация)
```

---

## 💡 Преимущества новой структуры:

✅ **Один файл = один отчет** - легко найти нужный  
✅ **По строкам** - точно знать где проблема  
✅ **Компактно** - только номера строк, без длинного текста  
✅ **Удобно для AI** - можно обрабатывать файлы последовательно  

---

## 📊 Статистика:

- **109 JSON файлов** - по одному на PHP файл
- **index.json** - список всех файлов с количеством проблем
- **Компактные** - в среднем 1-5 KB на файл

---

✅ **Готово к использованию!**

Откройте любой файл из `refactoring/split/` и начните исправлять!

