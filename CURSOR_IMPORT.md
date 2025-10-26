# Импорт отчета в Cursor

## Способ 1: Прямое открытие (Рекомендуется)

### В Cursor:
1. **Нажмите** `Ctrl+P` (или `Cmd+P` на Mac)
2. **Введите:** `code-report-top5.json`
3. **Нажмите** Enter
4. Файл откроется в редакторе

### Или через командную палитру:
1. **Нажмите** `Ctrl+Shift+P`
2. **Введите:** "Open File"
3. **Выберите:** `code-report-top5.json`

---

## Способ 2: Через терминал Cursor

В терминале Cursor выполните:

```bash
cursor code-report-top5.json
```

---

## Способ 3: Использование с AI

### В чате Cursor вы можете ссылаться на отчет:

```
@code-report-top5.json Что нужно исправить в первую очередь?

Или:

@code-report-top5.json Проанализируй код и создай план рефакторинга
```

### Через @workspace:

```
@workspace code-report-top5.json
```

---

## Способ 4: Автоматический импорт через скрипт

Создайте скрипт для быстрого открытия:

```bash
# В терминале Cursor
code code-report-top5.json
```

---

## Способ 5: Просмотр HTML версии

Откройте визуальный отчет в браузере:

```bash
# Linux/WSL
xdg-open code-report-summary.html

# Или просто
open code-report-summary.html
```

---

## Работа с отчетом в Cursor AI

### Примеры вопросов:

1. **Анализ проблем:**
   ```
   @code-report-top5.json Какие самые частые проблемы в коде?
   ```

2. **План рефакторинга:**
   ```
   @code-report-top5.json Создай план рефакторинга по приоритету
   ```

3. **Конкретный файл:**
   ```
   Покажи проблемы в app/Http/Controllers/StoreController.php
   ```

4. **Рефакторинг:**
   ```
   @code-report-top5.json Как исправить проблемы с missing_fillable в Models?
   ```

---

## Файлы отчетов

- ✅ **code-report-top5.json** - Рекомендуется для Cursor (172 KB)
- **code-report-compact.json** - Только major issues (1.7 MB)
- **code-report.json** - Полный отчет (2.1 MB)
- **code-report-summary.html** - Визуальный HTML отчет

---

## Быстрая команда

Для быстрого открытия добавьте в `.bashrc`:

```bash
# Алиас для открытия отчета в Cursor
alias report="code ~/refactoringGuru/code-report-top5.json"
```

Тогда просто выполните:
```bash
report
```

