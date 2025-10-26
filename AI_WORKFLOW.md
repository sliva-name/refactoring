# 🤖 Рабочий процесс с Cursor AI

## 🎯 Проблема: Большой отчет

Cursor может не прочитать весь файл (237 KB, 6734 строки).

---

## ✅ Решение: Разбить на маленькие файлы

Отчет разбит на **26 файлов** в папке `/home/ghost/saasApp/refactoring/split/`

### Самые полезные файлы для AI:

| Файл | Размер | Строк | Что в нем |
|------|--------|-------|-----------|
| **report-summary.json** | 27 KB | 819 | 📊 Статистика + топ-20 файлов |
| **report-top-10-files.json** | 25 KB | 631 | 🎯 Топ-10 проблемных файлов |
| **report-by-type-missing_fillable.json** | 798 B | 53 | ⭐ Models без $fillable |
| **report-by-severity-major.json** | 172 KB | - | 🔴 Все major проблемы |
| **report-chunk-1.json** до **report-chunk-11.json** | ~22 KB | ~300 | 📦 По 10 файлов |

---

## 🚀 Используйте ЭТИ файлы в Cursor:

### Вариант 1: Начните с summary

```
@refactoring/split/report-summary.json 

Проанализируй summary отчета и создай план рефакторинга.

Покажи:
1. Топ-10 файлов с наибольшим количеством проблем
2. Какие типы проблем преобладают
3. С чего начать исправления (приоритет)

Затем дай рекомендации по конкретным файлам из topFiles.
```

---

### Вариант 2: По типам проблем

```
@refactoring/split/report-by-type-missing_fillable.json

Проанализируй Models без $fillable.

Для каждого файла из отчета:
1. Найди соответствующую миграцию
2. Добавь protected $fillable массив
3. Покажи пример кода

Начни с самых используемых моделей (Product, Category, User, Order).
```

---

### Вариант 3: По частям (chunks)

```
ШАГ 1:
@refactoring/split/report-chunk-1.json

Проанализируй первые 10 файлов из отчета.
Для каждого файла создай план исправления.

ШАГ 2:
@refactoring/split/report-chunk-2.json

Исправь следующие 10 файлов...

И так далее до report-chunk-11.json
```

---

### Вариант 4: По важности

```
ШАГ 1 - Критичное:
@refactoring/split/report-by-type-missing_fillable.json

Исправь Models - добавь $fillable везде.

ШАГ 2 - Важное:
@refactoring/split/report-by-severity-major.json

Исправь major проблемы (high_complexity, method_size).

ШАГ 3 - Улучшения:
@refactoring/split/report-by-severity-minor.json

Добавь документацию и типизацию.
```

---

## 📋 Готовый ПРОМПТ для Cursor (СКОПИРУЙТЕ):

```
Проанализируй файлы из refactoring/split/ в следующем порядке:

1. @refactoring/split/report-summary.json - Сначала посмотри общую статистику

2. @refactoring/split/report-by-type-missing_fillable.json - Исправь Models (приоритет P0)

3. @refactoring/split/report-by-type-thick_controller.json - Рефакторинг контроллеров (P1)

4. @refactoring/split/report-by-type-business_logic_in_controller.json - Вынеси логику в Services (P1)

5. @refactoring/split/report-top-10-files.json - Исправь топ-10 файлов (P2)

Для каждого типа:
- Покажи что нужно исправить
- Дай примеры кода (before/after)
- Создай рефакторинг следуя best practices Laravel

Начни с модели Product, User, Category из missing_fillable отчета.
```

---

## 💡 Простой вариант:

Если Cursor все же не читает, используйте только summary:

```
@refactoring/split/report-summary.json

На основе статистики отчета:
1. Определи топ-3 самых критичных проблемы
2. Для каждой создай план исправления
3. Покажи примеры кода
4. Начни исправлять файлы из topFiles

Следуй best practices Laravel: PSR-12, SOLID, Service Layer.
```

---

## 📊 Структура файлов:

```
refactoring/
├── code-report.json              # Полный (237 KB)
├── code-report-compact.json      # Только major (1.9 MB)
└── split/                        # ⭐ Используйте эти!
    ├── report-summary.json       # Статистика + топ-20
    ├── report-top-10-files.json  # Топ-10 файлов
    ├── report-by-type-*.json     # По типам проблем
    ├── report-by-severity-*.json # По важности
    └── report-chunk-*.json       # По 10 файлов
```

---

✅ **Рекомендация:** Начните с `report-summary.json` или `report-top-10-files.json`

