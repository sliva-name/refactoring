# 🤖 Руководство по использованию Cursor AI Prompts

## 📋 Содержание

1. [Что это такое](#что-это-такое)
2. [Как использовать](#как-использовать)
3. [Структура промптов](#структура-промптов)
4. [Стратегия исправления](#стратегия-исправления)
5. [Критические сценарии](#критические-сценарии)
6. [Примеры](#примеры)

---

## Что это такое

Laravel Code Improver теперь автоматически генерирует **готовые промпты для Cursor AI**, которые помогут исправить все найденные проблемы.

### Что генерируется:

```
refactoring/cursor-prompts/
├── MASTER_PROMPT.md                          # Мастер-план всего рефакторинга
├── prompts-index.json                        # Индекс всех промптов
├── app_Http_Controllers_ProductController.md # Промпт для конкретного файла
├── app_Models_User.md
└── app_Services_OrderService.md
```

---

## Как использовать

### Вариант 1: Автоматическая генерация (рекомендуется)

```bash
# Промпты генерируются автоматически при использовании --refactor-dir
npm start -- --path=/project --refactor-dir=refactoring

# Результат:
# ✓ Reports created
# ✓ Cursor prompts generated!
# 📝 Usage:
#    1. Open: cursor refactoring/cursor-prompts/MASTER_PROMPT.md
```

### Вариант 2: Ручная генерация

```bash
# Добавьте флаг --generate-prompts
npm start -- --path=/project --generate-prompts
```

### Вариант 3: Для одного файла

```bash
# Анализ одного файла + промпт
npm start -- \
  --file=app/Http/Controllers/ProductController.php \
  --refactor-dir=refactoring
```

---

## Структура промптов

### MASTER_PROMPT.md

Главный файл с общей стратегией:

```markdown
# 🚀 Master Plan - Рефакторинг проекта

## 📊 Статистика
- Всего файлов: 42
- 🔴 Critical: 5 файлов
- 🟠 Major: 18 файлов

## 🎯 Стратегия исправления

### Фаза 1: Security (Critical) 🔒
1. `app/Http/Controllers/OrderController.php` - 8 проблем
   - SQL Injection, Mass Assignment

### Фаза 2: Architecture & Performance (Major) ⚡
...

## ⚠️ Важные замечания
- Порядок исправления проблем
- Критические сценарии
```

### Индивидуальные промпты

Каждый файл получает свой детальный промпт:

```markdown
# 🔧 Исправление проблем в app/Http/Controllers/ProductController.php

**Приоритет:** 🔴 CRITICAL

## 📋 Найденные проблемы:

### 🔒 SQL Injection Risk
**Строка 45:**
- Potential SQL Injection: DB::raw() with variables
- 💡 Рекомендация: Use parameter binding

### ⚡ N Plus One Query
**Строка 62:**
- Relationship access inside loop without eager loading
- 💡 Рекомендация: Use eager loading with ->with(['relationName'])

## 🎯 Задачи:
1. Открой файл `app/Http/Controllers/ProductController.php`
2. Исправь все проблемы следуя рекомендациям выше
3. Следуй принципам: SOLID, PSR-12, Laravel best practices

## 📚 Стратегия исправления:
[Детальные инструкции для каждого типа проблем]
```

---

## Стратегия исправления

### ⚠️ КРИТИЧЕСКИ ВАЖНО: Порядок исправления

```
┌─────────────────────────────────────────────────┐
│ 1. Security (Critical)                          │
│    ├─ SQL Injection                             │
│    ├─ XSS vulnerabilities                       │
│    └─ Mass Assignment                           │
├─────────────────────────────────────────────────┤
│ 2. N+1 Queries (Critical)                       │
│    └─ Добавить eager loading                    │
├─────────────────────────────────────────────────┤
│ 3. БОЛЬШИЕ МЕТОДЫ (Major)                       │
│    └─ Разбить на маленькие методы              │
├─────────────────────────────────────────────────┤
│ 4. ⚡ ПОВТОРНЫЙ АНАЛИЗ ⚡                        │
│    └─ npm start -- --file=... (проверка)       │
├─────────────────────────────────────────────────┤
│ 5. Дублирование кода (после шага 3!)           │
│    └─ Извлечь общую логику                     │
├─────────────────────────────────────────────────┤
│ 6. Architecture (Major)                         │
│    └─ Service Layer, Repository                 │
├─────────────────────────────────────────────────┤
│ 7. Code Smells (Minor)                          │
│    └─ Рефакторинг качества                     │
└─────────────────────────────────────────────────┘
```

### Почему такой порядок?

1. **Security** - критично для продакшена
2. **N+1** - критично для производительности
3. **Большие методы** - СНАЧАЛА разбиваем
4. **Повторный анализ** - проверяем результат
5. **Дублирование** - ПОТОМ ищем дубли (они могли исчезнуть!)
6. **Architecture** - улучшаем структуру
7. **Code Smells** - полируем

---

## Критические сценарии

### 🚨 Сценарий 1: Большие методы + Дублирование

**Проблема:**
```php
// В файле найдено:
// - method_size: method1 (50 строк)
// - method_size: method2 (45 строк)
// - duplicate_code: 85% similarity между method1 и method2
```

**❌ НЕПРАВИЛЬНО:**
1. Извлечь дублирующийся код в отдельный метод
2. Результат: дублирование исчезло, но методы всё еще огромные

**✅ ПРАВИЛЬНО:**
1. **СНАЧАЛА** разбить method1 на 5 маленьких методов
2. **СНАЧАЛА** разбить method2 на 5 маленьких методов
3. **ЗАПУСТИТЬ** повторный анализ:
   ```bash
   npm start -- --file=TheFile.php
   ```
4. **ПОТОМ** смотреть на дублирование
5. Возможно, после разбиения дублирование уже исчезло!

### 🚨 Сценарий 2: N+1 + Architecture

**Проблема:**
```php
// В контроллере:
public function index() {
    $users = User::all();
    foreach ($users as $user) {
        echo $user->posts->count(); // N+1!
        echo $user->comments->count(); // N+1!
    }
}
```

**✅ Правильный порядок:**

1. **Сначала** исправить N+1:
```php
$users = User::with(['posts', 'comments'])->get();
```

2. **Потом** архитектуру (если нужно):
```php
// UserService.php
public function getUsersWithStats() {
    return User::with(['posts', 'comments'])->get();
}
```

### 🚨 Сценарий 3: Security + Performance

**Проблема:**
```php
// SQL Injection + загрузка всей таблицы
$name = $request->name;
$users = DB::raw("SELECT * FROM users WHERE name = '$name'");
```

**✅ Правильное исправление:**
```php
// Исправляем ОБЕ проблемы сразу
$users = User::where('name', $request->validated('name'))
    ->limit(100)
    ->get(['id', 'name', 'email']); // только нужные колонки
```

---

## Примеры

### Пример 1: Использование промпта в Cursor

#### Шаг 1: Открыть MASTER_PROMPT
```bash
cursor refactoring/cursor-prompts/MASTER_PROMPT.md
```

#### Шаг 2: Найти файл с Critical проблемами
В MASTER_PROMPT видим:
```markdown
### Фаза 1: Security (Critical)
1. `app/Http/Controllers/OrderController.php` - 8 проблем
   - Промпт: см. `app_Http_Controllers_OrderController.md`
```

#### Шаг 3: Открыть промпт файла
```bash
cursor refactoring/cursor-prompts/app_Http_Controllers_OrderController.md
```

#### Шаг 4: Скопировать промпт
Скопируйте весь текст из `.md` файла

#### Шаг 5: В Cursor AI
```
@app/Http/Controllers/OrderController.php

[ВСТАВИТЬ СКОПИРОВАННЫЙ ПРОМПТ]
```

#### Шаг 6: Проверка
```bash
# После исправления
npm start -- --file=app/Http/Controllers/OrderController.php

# Должно быть:
# ✓ 0 critical issues
```

---

### Пример 2: Workflow для всего проекта

```bash
# 1. Полный анализ
npm start -- --path=/project --refactor-dir=refactoring

# 2. Открыть мастер-план
cursor refactoring/cursor-prompts/MASTER_PROMPT.md

# 3. Исправить все Critical
# (используя промпты из cursor-prompts/)

# 4. Повторный анализ Critical файлов
npm start -- --files="File1.php,File2.php,File3.php"

# 5. Исправить Major
# ...

# 6. Финальная проверка
npm start -- --path=/project --compact
```

---

### Пример 3: Большой метод → Дублирование

**Исходный код:**
```php
class ProductController {
    public function processOrder($orderId) {
        // 60 строк кода
        $order = Order::find($orderId);
        // валидация (15 строк)
        // расчет цены (20 строк)
        // отправка email (15 строк)
        // логирование (10 строк)
    }
    
    public function processRefund($orderId) {
        // 55 строк кода
        $order = Order::find($orderId);
        // валидация (15 строк) - ПОХОЖА на processOrder!
        // расчет возврата (20 строк)
        // отправка email (15 строк) - ПОХОЖА на processOrder!
        // логирование (10 строк) - ПОХОЖА на processOrder!
    }
}
```

**Анализ показывает:**
- `method_size`: processOrder (60 строк)
- `method_size`: processRefund (55 строк)
- `duplicate_code`: 70% similarity

**❌ Если исправить дублирование сразу:**
```php
// Извлекли общий код
private function sendEmail($order) { ... }
private function log($order) { ... }

// Но методы ВСЕ ЕЩЕ огромные!
public function processOrder($orderId) {
    // 30 строк кода
}
```

**✅ Правильный подход:**

**Шаг 1:** Разбить processOrder
```php
public function processOrder($orderId) {
    $order = $this->findOrder($orderId);
    $this->validateOrder($order);
    $total = $this->calculateTotal($order);
    $this->sendOrderEmail($order);
    $this->logOrder($order, 'processed');
}

private function findOrder($id) { ... }
private function validateOrder($order) { ... }
private function calculateTotal($order) { ... }
private function sendOrderEmail($order) { ... }
private function logOrder($order, $action) { ... }
```

**Шаг 2:** Разбить processRefund
```php
public function processRefund($orderId) {
    $order = $this->findOrder($orderId);
    $this->validateRefund($order);
    $amount = $this->calculateRefund($order);
    $this->sendRefundEmail($order);
    $this->logOrder($order, 'refunded');
}

private function validateRefund($order) { ... }
private function calculateRefund($order) { ... }
private function sendRefundEmail($order) { ... }
```

**Шаг 3:** Повторный анализ
```bash
npm start -- --file=app/Http/Controllers/ProductController.php
```

**Шаг 4:** Теперь видно реальное дублирование
```
duplicate_code: findOrder и logOrder используются в обоих методах
```

**Шаг 5:** Финальный рефакторинг
```php
// Общие методы уже извлечены!
// Специфичные методы - отдельно
// Код чистый и поддерживаемый
```

---

## 💡 Советы

### 1. Всегда начинайте с MASTER_PROMPT
Он содержит правильную стратегию и предупреждения

### 2. Используйте чеклисты
В каждом промпте есть ✅ критерии успеха - проверяйте по ним

### 3. Повторный анализ после больших изменений
```bash
npm start -- --file=ChangedFile.php
```

### 4. Коммитьте поэтапно
```bash
git commit -m "fix(security): resolve SQL injection in OrderController"
git commit -m "refactor: extract methods in OrderController"
git commit -m "refactor: remove code duplication in OrderController"
```

### 5. Используйте git stash между фазами
```bash
# Исправили Critical
git add .
git commit -m "fix: resolve all critical security issues"

# Начинаем Major
npm start -- --path=. --refactor-dir=refactoring
```

---

## 🔄 Типичный workflow

```bash
# День 1: Security
npm start -- --compact
# Исправить все Critical используя промпты
git commit -m "fix: resolve critical security issues"

# День 2: Performance
npm start -- --compact
# Исправить N+1 queries
git commit -m "perf: add eager loading to prevent N+1 queries"

# День 3: Refactoring
npm start -- --compact
# Разбить большие методы
git commit -m "refactor: split large methods into smaller ones"

# День 4: Проверка дублирования
npm start -- --path=.
# !! Повторный анализ после разбиения методов !!
# Исправить дублирование (если осталось)
git commit -m "refactor: remove code duplication"

# День 5: Architecture
# Service Layer, Repository, etc.
git commit -m "refactor: implement service layer"

# День 6: Polish
# Code smells, documentation
git commit -m "style: improve code quality"
```

---

## 📚 Дополнительная документация

- [ANALYZERS.md](./ANALYZERS.md) - Что проверяется
- [WHATS_NEW.md](./WHATS_NEW.md) - Новые возможности
- [QUICK_START_V2.md](./QUICK_START_V2.md) - Быстрый старт

---

## ❓ FAQ

### Q: Нужно ли следовать промптам точно?
A: Нет, это рекомендации. Cursor AI может предложить лучшее решение.

### Q: Можно ли редактировать промпты?
A: Да! Они в формате Markdown - редактируйте как хотите.

### Q: Что делать если Cursor не понимает промпт?
A: Упростите промпт, оставьте только конкретную проблему.

### Q: Сколько проблем исправлять за раз?
A: Рекомендуется по одному типу проблем за раз (например, все SQL Injection, потом все N+1).

### Q: Нужно ли запускать анализ после каждого исправления?
A: Не обязательно после каждого, но **обязательно** после разбиения больших методов!

---

🚀 **Удачи в рефакторинге!**

