# ❓ Ответы на ваши вопросы

## 1. 🤖 Автоматические запросы для Cursor

### Вопрос
> А возможно для cursor автоматически делать запросы из fix с указанием контекста на файлы?

### Ответ

**✅ РЕАЛИЗОВАНО!**

Теперь анализатор **автоматически генерирует готовые промпты** для Cursor AI!

### Как это работает:

```bash
# Запускаете анализ
npm start -- --path=/project --refactor-dir=refactoring

# Автоматически создаются:
refactoring/cursor-prompts/
├── MASTER_PROMPT.md                    # Мастер-план всего проекта
├── prompts-index.json                  # Индекс файлов
├── app_Http_Controllers_Product.md     # Промпт для конкретного файла
└── app_Models_User.md                  # С контекстом и инструкциями
```

### Что включает каждый промпт:

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
- Relationship access inside loop
- 💡 Рекомендация: Use ->with(['relationName'])

## 🎯 Задачи:
1. Открой файл `app/Http/Controllers/ProductController.php`
2. Исправь все проблемы
3. Следуй: SOLID, PSR-12, Laravel best practices

## 📚 Стратегия исправления:
[Детальная стратегия для каждого типа проблем]
```

### Использование в Cursor:

```bash
# 1. Открыть мастер-план
cursor refactoring/cursor-prompts/MASTER_PROMPT.md

# 2. Скопировать промпт для нужного файла
# Например: app_Http_Controllers_Product.md

# 3. В Cursor AI написать:
@app/Http/Controllers/ProductController.php

[ВСТАВИТЬ СКОПИРОВАННЫЙ ПРОМПТ]
```

### Промпт учитывает:

- ✅ **Контекст файла** - путь к файлу указан
- ✅ **Номера строк** - точное указание где проблема
- ✅ **Тип проблемы** - SQL Injection, N+1, etc.
- ✅ **Рекомендации** - как исправить
- ✅ **Приоритет** - critical, major, minor
- ✅ **Стратегию** - в каком порядке исправлять
- ✅ **Чеклист** - критерии успеха

### Пример промпта для пользователя:

**Для простого случая:**
```
@app/Http/Controllers/OrderController.php

Исправь следующие проблемы в этом файле:

1. Строка 45: SQL Injection - используй parameter binding
   DB::raw("WHERE id = ?", [$id])

2. Строка 62: N+1 Query - добавь eager loading
   Order::with(['items', 'user'])->get()

3. Строка 78: Большой метод (50 строк) - разбей на:
   - validateOrder()
   - calculateTotal()
   - sendNotification()

Следуй Laravel best practices и добавь type hints.
```

**Для сложного случая с дублированием:**
```
@app/Services/OrderService.php

⚠️ ВАЖНО: В файле есть и большие методы, и дублирование.
Порядок исправления критичен!

ЭТАП 1: Разбей большие методы
- processOrder (60 строк) → 5 маленьких методов
- processRefund (55 строк) → 5 маленьких методов

ЭТАП 2: Запусти повторный анализ
npm start -- --file=app/Services/OrderService.php

ЭТАП 3: Исправь дублирование (если осталось)
- Извлеки общую логику в private методы
- Используй traits для переиспользования

Стратегия детально описана в:
refactoring/cursor-prompts/app_Services_OrderService.md
```

---

## 2. 🔄 Дублирование кода

### Вопрос
> Дублирование кода ищет?

### Ответ

**✅ ДА! Создан продвинутый DuplicationDetector**

### Что находит:

#### 1. Дублирующиеся методы
```php
// Находит если similarity >= 85%
class ProductController {
    public function processOrder($orderId) {
        // 50 строк кода
    }
    
    public function processRefund($orderId) {
        // 45 строк похожего кода
    }
}

// Выдаст:
// duplicate_method: 87% similarity between processOrder and processRefund
```

#### 2. Дублирующиеся блоки кода
```php
// Находит блоки 5+ строк с similarity >= 85%
public function method1() {
    // 10 строк кода A
}

public function method2() {
    // 10 строк похожего кода A
}

// Выдаст:
// duplicate_code_block: lines 10-20 are 90% similar to lines 35-45
```

### Как работает:

1. **Нормализация кода**
   ```php
   // Оригинал:
   $userName = "John";
   $userAge = 25;
   
   // Нормализуется в:
   $VAR = "STRING";
   $VAR = NUM;
   ```

2. **Токенизация**
   - Удаляет комментарии
   - Заменяет переменные на `$VAR`
   - Заменяет строки на `"STRING"`
   - Заменяет числа на `NUM`

3. **Сравнение**
   - Вычисляет Jaccard similarity
   - Порог: 85%
   - Минимум: 5 строк

### Пример вывода:

```json
{
  "type": "duplicate_method",
  "severity": "major",
  "message": "Methods 'processOrder' and 'processRefund' are 87% similar",
  "filePath": "app/Services/OrderService.php",
  "line": 45,
  "suggestion": "Extract common logic into a shared private method or trait",
  "refactorInfo": {
    "method1": "processOrder",
    "method2": "processRefund",
    "similarity": 0.87,
    "lines1": "45-95",
    "lines2": "100-145"
  }
}
```

---

## 3. ⚠️ Проблема: Большие методы + Дублирование

### Вопрос
> Как быть со сценарием, что существует проблема с дублированием кода, но там же и существует проблема с большими методами, которые нужно разбить. Получается, что cursor поправит слишком большие методы и больше дублирования не будет видеть скрипт в упор?

### Ответ

**🎯 ОТЛИЧНЫЙ ВОПРОС! Это действительно критическая проблема!**

### Решение реализовано в 3 направлениях:

---

### 1. 📚 Умные промпты со стратегией

Генератор промптов **автоматически определяет** эту ситуацию и **предупреждает**:

```markdown
## 📚 Стратегия исправления:

### 📏 Рефакторинг больших методов
1. **Сначала** определи логические блоки в методе
2. Извлеки каждый блок в отдельный private метод
3. Дай методам понятные имена
4. **Важно:** после рефакторинга проверь на дублирование!

### 🧹 Дублирование кода
1. **Внимание:** Если есть большие методы - сначала их разбей!
2. После разбиения найди похожие методы
3. Извлеки общую логику в отдельный метод
```

---

### 2. 🎯 MASTER_PROMPT с правильным порядком

В мастер-плане **явно указан порядок**:

```markdown
## ⚠️ Важные замечания

### Порядок исправления проблем:

1. **Security (Critical)** - исправляем ПЕРВЫМИ
2. **N+1 Queries** - добавляем eager loading
3. **Большие методы** - РАЗБИВАЕМ НА ЧАСТИ
4. **Дублирование кода** - ПОСЛЕ разбиения методов!
5. **Architecture** - Service Layer, Repository
6. **Code Smells** - рефакторинг качества

### ⚡ Критически важно:

> **Если в файле есть и "большие методы" и "дублирование кода":**
> 1. СНАЧАЛА разбей большие методы на маленькие
> 2. ПОТОМ запусти анализ заново на этот файл
> 3. ТОЛЬКО ПОТОМ исправляй дублирование
>
> Иначе после разбиения методов дублирование может исчезнуть само!
```

---

### 3. 🔄 Workflow с повторным анализом

Рекомендуемый workflow:

```bash
# ШАГ 1: Первичный анализ
npm start -- --path=/project --refactor-dir=refactoring

# В отчете видим:
# - method_size: processOrder (60 строк)
# - method_size: processRefund (55 строк)
# - duplicate_code: 85% similarity между ними

# ШАГ 2: Исправить ТОЛЬКО большие методы
# Используя промпты из cursor-prompts/
# Разбить processOrder на 5 маленьких методов
# Разбить processRefund на 5 маленьких методов

# ШАГ 3: ПОВТОРНЫЙ АНАЛИЗ того же файла!
npm start -- --file=app/Services/OrderService.php

# Теперь видим реальное дублирование:
# - duplicate_method: validateOrder и validateRefund похожи на 90%
# - duplicate_method: sendEmail используется в обоих

# ШАГ 4: Исправить дублирование
# Извлечь общую логику
```

---

### Наглядный пример:

#### До разбиения методов:

```php
class OrderService {
    // Анализатор видит:
    // 1. method_size: processOrder (60 строк)
    // 2. method_size: processRefund (55 строк)  
    // 3. duplicate_code: 85% similarity
    
    public function processOrder($orderId) {
        // Строки 1-15: валидация заказа
        // Строки 16-35: расчет цены
        // Строки 36-45: отправка email
        // Строки 46-60: логирование
    }
    
    public function processRefund($orderId) {
        // Строки 1-15: валидация (ПОХОЖЕ на processOrder)
        // Строки 16-35: расчет возврата
        // Строки 36-45: отправка email (ПОХОЖЕ на processOrder)
        // Строки 46-55: логирование (ПОХОЖЕ на processOrder)
    }
}
```

**❌ Если исправить дублирование сейчас:**
```php
// Извлекли общий код
private function validateOrder($order) { ... }
private function sendEmail($order, $type) { ... }
private function log($order, $action) { ... }

// НО методы всё еще огромные!
public function processOrder($orderId) {
    // 30 строк кода
}
```

---

#### ✅ Правильный подход:

**ШАГ 1: Разбить методы**
```php
public function processOrder($orderId) {
    $order = $this->findOrder($orderId);
    $this->validateOrder($order);
    $total = $this->calculateTotal($order);
    $this->sendOrderEmail($order);
    $this->logOrder($order, 'processed');
}

public function processRefund($orderId) {
    $order = $this->findOrder($orderId);
    $this->validateRefund($order);
    $amount = $this->calculateRefund($order);
    $this->sendRefundEmail($order);
    $this->logOrder($order, 'refunded');
}

private function findOrder($id) { ... }
private function validateOrder($order) { ... }
private function validateRefund($order) { ... }
private function calculateTotal($order) { ... }
private function calculateRefund($order) { ... }
private function sendOrderEmail($order) { ... }
private function sendRefundEmail($order) { ... }
private function logOrder($order, $action) { ... }
```

**ШАГ 2: Повторный анализ**
```bash
npm start -- --file=app/Services/OrderService.php
```

**ШАГ 3: Теперь видно реальное дублирование**
```
duplicate_method: sendOrderEmail и sendRefundEmail похожи на 90%
```

**ШАГ 4: Финальный рефакторинг**
```php
private function sendEmail($order, $type) {
    // Общая логика отправки
}

private function sendOrderEmail($order) {
    $this->sendEmail($order, 'order');
}

private function sendRefundEmail($order) {
    $this->sendEmail($order, 'refund');
}
```

---

### Итого: Решение проблемы

✅ **Генератор промптов знает об этой проблеме**  
✅ **Предупреждает пользователя в промптах**  
✅ **Рекомендует правильный порядок**  
✅ **Напоминает о повторном анализе**

### Документация

Подробно описано в:
- [CURSOR_PROMPTS_GUIDE.md](./CURSOR_PROMPTS_GUIDE.md) - секция "Критические сценарии"
- [MASTER_PROMPT.md](refactoring/cursor-prompts/MASTER_PROMPT.md) - генерируется автоматически

---

## 🎓 Итоговый workflow

```bash
# 1. Первичный анализ
npm start -- --path=/project --refactor-dir=refactoring

# 2. Открыть мастер-план
cursor refactoring/cursor-prompts/MASTER_PROMPT.md

# 3. Следовать стратегии по фазам:
#    Phase 1: Security (Critical)
#    Phase 2: N+1 Queries  
#    Phase 3: Большие методы
#    Phase 4: ПОВТОРНЫЙ АНАЛИЗ
#    Phase 5: Дублирование
#    Phase 6: Architecture
#    Phase 7: Code Quality

# 4. Повторный анализ после каждой фазы
npm start -- --file=ChangedFile.php

# 5. Проверка прогресса
npm start -- --path=/project --compact
```

---

## 📚 Дополнительная документация

- [CURSOR_PROMPTS_GUIDE.md](./CURSOR_PROMPTS_GUIDE.md) - Полное руководство
- [ANALYZERS.md](./ANALYZERS.md) - Документация анализаторов
- [README.md](./README.md) - Основная документация

---

🎯 **Все проблемы учтены и решены!**

