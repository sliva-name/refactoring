# 🚀 НАЧНИ ЗДЕСЬ - Исправление проблем кода

## Скопируйте этот запрос в Cursor AI:

---

```
Проанализируй отчет /home/ghost/saasApp/refactoring/code-report.json и создай комплексный план рефакторинга проекта Laravel.

Требования:

1. ПРИОРИТИЗИРУЙ проблемы по категориям:
   - P0 (Срочно - безопасность): missing_fillable в Models
   - P1 (Важно - архитектура): business_logic_in_controller, thick_controller
   - P2 (Качество кода): missing_return_type, high_complexity, method_size
   - P3 (Документация): missing_*_doc проблемы
   - P4 (Улучшения): suggest_trait, suggest_scope, magic_number

2. ДЛЯ КАЖДОЙ КАТЕГОРИИ создай:
   - Список файлов для исправления
   - Что именно нужно исправить
   - Примеры кода (before/after)
   - Порядок выполнения

3. ПО ФАЙЛАМ создай детальный план:
   - Для каждого файла из отчета покажи:
     * Какие проблемы обнаружены (по типам)
     * Что нужно исправить конкретно
     * Примеры исправленного кода

4. СОЗДАЙ РЕФАКТОРИНГ:
   - Models: добавь $fillable, создай связи
   - Controllers: вынеси логику в Service классы
   - Services: создай новые Service классы с бизнес-логикой
   - Traits: создай трейты для переиспользования
   - Scopes: создай скоупы для запросов
   - Requests: создай Form Request классы
   - Resources: создай Resource классы для API

5. СЛЕДУЙ BEST PRACTICES Laravel:
   - PSR-12 coding standard
   - SOLID principles
   - Service Layer pattern
   - Repository pattern (где нужно)
   - Dependency Injection везде
   - Типизация полная (type hints + return types)
   - PHPDoc везде

6. ПОКАЖИ РЕЗУЛЬТАТ в формате:
   - Файл: путь
   - Проблемы: список
   - Решение: код
   - Примеры: before/after

Начни с Models (P0 приоритет - missing_fillable), покажи примеры для Product, Category, User моделей.
```

---

## 📋 Альтернативный упрощенный вариант:

```
Исправь все проблемы из отчета refactoring/code-report.json:

1. В Models добавь protected $fillable
2. В Controllers вынеси логику в Services  
3. Замени фасады на Dependency Injection
4. Добавь return types и type hints
5. Добавь PHPDoc комментарии
6. Создай трейты и скоупы где нужно

Начни с топ-10 самых проблемных файлов. Для каждого файла покажи что исправить и пример кода.
```

---

## 💡 Как использовать:

1. Откройте Cursor
2. Откройте чат с AI (Cmd+L или Ctrl+L)
3. Скопируйте один из промптов выше
4. Вставьте и нажмите Enter
5. AI проанализирует отчет и создаст план

---

✅ Готово! Начните с первого промпта.

