# 📖 Руководство по использованию

## 🎯 Быстрый старт

### Шаг 1: Запуск анализа

```bash
# Простейший способ
./quick-start.sh

# Своим путем
npm start -- --path=/path/to/laravel --refactor-dir=refactoring
```

### Шаг 2: Откройте отчет в Cursor

```bash
# Автоматически
cursor /home/ghost/saasApp/refactoring/code-report-top5.json

# Или вручную: Ctrl+P -> refactoring/code-report-top5.json
```

### Шаг 3: Используйте с AI

```
@refactoring/code-report-top5.json Какие проблемы критичны?
```

---

## 📊 Выбор версии отчета

### code-report-top5.json ⭐ (Рекомендуется)
- **Размер:** ~172 KB
- **Проблем:** Топ-5 на файл
- **Для:** Cursor AI, быстрая оценка

```bash
cursor saasApp/refactoring/code-report-top5.json
```

### code-report-compact.json
- **Размер:** ~1.7 MB  
- **Проблем:** Только major/critical
- **Для:** Полный обзор важных проблем

```bash
cursor saasApp/refactoring/code-report-compact.json
```

### code-report.json
- **Размер:** ~2.1 MB
- **Проблем:** Все (6860)
- **Для:** Полный анализ, детальная работа

```bash
cursor saasApp/refactoring/code-report.json
```

---

## 🎨 Работа в Cursor

### Открыть отчет

**Вариант 1:** Через поиск
```
Ctrl+P -> введите: code-report-top5.json
```

**Вариант 2:** Через терминал
```bash
cd /home/ghost/saasApp
cursor refactoring/code-report-top5.json
```

**Вариант 3:** Перетащить файл
Просто перетащите файл в Cursor

### Использование с AI

В чате Cursor:

```
@refactoring/code-report-top5.json Проанализируй проблему с fillable
```

```
@code-report-top5.json Создай план исправления Models
```

```
@refactoring/code-report-top5.json Покажи толстые контроллеры
```

### Реальные примеры вопросов

1. **Анализ конкретной проблемы:**
   ```
   @code-report-top5.json Почему так много missing_fillable?
   ```

2. **План рефакторинга:**
   ```
   @code-report-top5.json Создай пошаговый план для исправления Models
   ```

3. **Приоритизация:**
   ```
   @code-report-top5.json Какие проблемы исправить первыми?
   ```

4. **Конкретный файл:**
   ```
   Покажи проблемы в app/Models/Product.php
   ```

---

## 🔄 Регенерация отчетов

### Обновить отчеты:
```bash
cd /home/ghost/refactoringGuru
./quick-start.sh
```

### Только top-5:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=refactoring \
  --top=5
```

### Только major проблемы:
```bash
npm start -- \
  --path=/home/ghost/saasApp \
  --refactor-dir=refactoring \
  --compact
```

---

## 📝 Типы проблем

- 🔴 **Critical** - Критические ошибки
- 🟠 **Major** - Важные проблемы
- 🟡 **Minor** - Мелкие недочеты
- 🔵 **Info** - Информационные замечания

### Самые частые:

1. **missing_fillable** (4764)
   - Модели без $fillable
   - Риск массовой атаки

2. **global_facade** (499)
   - Использование глобальных фасадов
   - Проблемы с тестами

3. **high_complexity** (349)
   - Сложная логика
   - Трудно поддерживать

4. **method_size** (104)
   - Слишком длинные методы
   - Нарушение SRP

---

## 💡 Советы

1. **Начните с major проблем** - они критичны
2. **Используйте код-ревью** - покажите отчет команде
3. **Планируйте рефакторинг** - не спешите
4. **Тестируйте изменения** - после каждого исправления

---

✅ Готово! Теперь вы знаете как использовать отчеты!

