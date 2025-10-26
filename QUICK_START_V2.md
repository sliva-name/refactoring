# 🚀 Быстрый старт v2.0

## ⚡ Новые возможности в 30 секунд

### 1. Анализ одного файла
```bash
npm start -- --file=app/Http/Controllers/ProductController.php
```

### 2. Проверка перед коммитом
```bash
npm start -- --git-staged --compact
```

### 3. Анализ изменений в PR
```bash
npm start -- --git-diff --refactor-dir=pr-check
```

### 4. Security аудит
```bash
npm start -- --path=/project --compact
# Смотрите "critical" проблемы в отчете
```

---

## 🔥 Топ-5 команд на каждый день

### 1. Быстрая проверка файла
```bash
npm start -- --file=Controller.php --top=5
```
**Когда:** Работаете над конкретным файлом

### 2. Pre-commit check
```bash
npm start -- --git-staged
```
**Когда:** Перед `git commit`

### 3. Анализ изменений
```bash
npm start -- --git-diff
```
**Когда:** После написания кода за день

### 4. Полный аудит с фокусом на важное
```bash
npm start -- --compact --refactor-dir=audit
```
**Когда:** Раз в неделю для мониторинга качества

### 5. Несколько файлов
```bash
npm start -- --files="Model.php,Service.php,Controller.php"
```
**Когда:** Проверяете связанные файлы

---

## 🎯 Что искать в отчетах

### Priority 1: Critical Security 🔴
```json
{
  "type": "sql_injection_risk",
  "severity": "critical",
  "message": "Potential SQL Injection"
}
```
**Действие:** Исправить немедленно!

### Priority 2: N+1 Queries ⚡
```json
{
  "type": "n_plus_one_query",
  "severity": "critical",
  "message": "Relationship access inside loop"
}
```
**Действие:** Добавить `->with()`

### Priority 3: Performance 🚀
```json
{
  "type": "query_without_limit",
  "severity": "major",
  "message": "Query fetches all records"
}
```
**Действие:** Добавить фильтрацию

### Priority 4: Architecture 🏗️
```json
{
  "type": "business_logic_in_controller",
  "severity": "major",
  "message": "Controller method contains direct model logic"
}
```
**Действие:** Создать Service Layer

---

## 🔧 Setup для проекта

### 1. Add to package.json scripts
```json
{
  "scripts": {
    "analyze": "node /path/to/laravel-code-improver/index.js --path=.",
    "analyze:quick": "npm run analyze -- --git-diff --compact",
    "analyze:staged": "npm run analyze -- --git-staged",
    "analyze:file": "npm run analyze -- --file"
  }
}
```

### 2. Pre-commit Hook (optional)
Создайте `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run analyze:staged
```

### 3. Alias в shell (optional)
В `.bashrc` или `.zshrc`:
```bash
alias analyze='npm start --prefix /path/to/improver --'
alias check-code='analyze --git-staged --compact'
```

Теперь просто:
```bash
check-code
```

---

## 📊 Читаем отчет

### Структура
```json
{
  "summary": {
    "totalIssues": 127,
    "bySeverity": {
      "critical": 5,    // ← НАЧНИТЕ С ЭТОГО!
      "major": 42,      // ← Потом это
      "minor": 60,
      "info": 20
    }
  },
  "files": [
    {
      "file": "app/Http/Controllers/ProductController.php",
      "issueCount": 8,
      "issues": {
        "35": [
          {
            "type": "n_plus_one_query",
            "severity": "critical",
            "message": "...",
            "suggestion": "Use eager loading with ->with(['relationName'])"
          }
        ]
      }
    }
  ]
}
```

### Открыть в Cursor
```bash
cursor refactoring/code-report.json
```

Затем в чате Cursor:
```
@refactoring/code-report.json
Исправь все critical проблемы в ProductController
```

---

## 🎓 Примеры исправлений

### SQL Injection
```php
// ❌ Было
DB::raw("WHERE id = $id")

// ✅ Стало
DB::raw("WHERE id = ?", [$id])
```

### N+1 Query
```php
// ❌ Было
$users = User::all();
foreach ($users as $user) {
    echo $user->posts->count();
}

// ✅ Стало
$users = User::with('posts')->get();
foreach ($users as $user) {
    echo $user->posts->count();
}
```

### Performance
```php
// ❌ Было
$products = Product::get();

// ✅ Стало
$products = Product::where('active', true)->limit(100)->get();
```

### Architecture
```php
// ❌ Было (в контроллере)
public function store(Request $request) {
    $order = Order::create($request->all());
    $order->items()->createMany($items);
    Mail::send(...);
}

// ✅ Стало
public function store(StoreOrderRequest $request) {
    $order = $this->orderService->createOrder($request->validated());
    return redirect()->route('orders.show', $order);
}

// OrderService.php
public function createOrder(array $data): Order {
    return DB::transaction(function () use ($data) {
        $order = Order::create($data);
        $this->createItems($order, $data['items']);
        $this->sendNotification($order);
        return $order;
    });
}
```

---

## 💡 Workflow рекомендации

### Утро
```bash
# Проверьте вчерашние изменения
git diff main...your-branch --name-only
npm start -- --git-diff
```

### В процессе работы
```bash
# Быстрая проверка файла
npm start -- --file=CurrentFile.php --top=3
```

### Перед коммитом
```bash
# Проверка staged файлов
npm start -- --git-staged --compact
```

### Перед PR
```bash
# Полный отчет для PR
npm start -- --git-diff --refactor-dir=pr-review
```

### Еженедельно
```bash
# Полный аудит
npm start -- --compact --refactor-dir=weekly-audit-$(date +%Y%m%d)
```

---

## 🆘 Troubleshooting

### "No PHP files found"
```bash
# Проверьте путь
npm start -- --path=/absolute/path/to/project --verbose
```

### "Git command failed"
```bash
# Убедитесь что в git репозитории
cd /path/to/project
git status
```

### Слишком много проблем
```bash
# Используйте фильтры
npm start -- --compact           # Только major/critical
npm start -- --top=5             # Макс 5 на файл
npm start -- --file=OneFile.php  # Один файл
```

---

## 📚 Дополнительная документация

- **[WHATS_NEW.md](./WHATS_NEW.md)** - Подробно о новых возможностях
- **[ANALYZERS.md](./ANALYZERS.md)** - Полная документация анализаторов
- **[README.md](./README.md)** - Основное руководство

---

## ⚡ Шпаргалка команд

```bash
# Основные
npm start -- --file=File.php                    # Один файл
npm start -- --files="A.php,B.php"             # Несколько файлов
npm start -- --git-diff                         # Измененные
npm start -- --git-staged                       # Staged

# С фильтрами
npm start -- --compact                          # Major/Critical
npm start -- --top=5                            # Топ-5 на файл
npm start -- --verbose                          # Подробный вывод

# Комбинации
npm start -- --git-staged --compact            # Staged + фильтр
npm start -- --file=F.php --top=3              # Файл + лимит
npm start -- --git-diff --refactor-dir=check   # Diff + сохранение
```

---

Готово! Начинайте с `npm start -- --git-staged` 🚀

