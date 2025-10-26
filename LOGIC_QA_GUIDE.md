# 💡 Logic Q&A Guide - Проверка логики кода

## 🎯 Что это такое?

**Logic Q&A** - это интерактивный инструмент для **проверки корректности логики** вашего кода через систему вопросов и ответов.

### Зачем это нужно?

✅ **Найти пропущенные edge cases** - "Что если массив пустой?"  
✅ **Проверить обработку ошибок** - "Что если find() вернет null?"  
✅ **Улучшить тесты** - вопросы = идеи для тест-кейсов  
✅ **Документировать решения** - почему сделано именно так  
✅ **Onboarding команды** - понимание сложной логики  

---

## 🚀 Быстрый старт

### 1. Запустить анализ

```bash
npm start -- --path=/project --refactor-dir=refactoring

# Создается:
refactoring/logic-qa/
├── INTERACTIVE_CHECKLIST.md           # Главный чеклист
├── LOGIC_QUESTIONS_BY_PRIORITY.md     # По приоритету
├── LOGIC_QUESTIONS_BY_CATEGORY.md     # По категории
├── logic-qa-summary.json              # JSON данные
└── by-file/                           # По файлам
    ├── OrderService.md
    └── ProductController.md
```

### 2. Открыть интерактивный чеклист

```bash
cursor refactoring/logic-qa/INTERACTIVE_CHECKLIST.md
```

### 3. Ответить на вопросы

Формат вопроса:

```markdown
### 1. В методе processOrder 4 условных оператора. Все ли случаи обработаны?

`app/Services/OrderService.php:45`

**Check Points:**
- [ ] Есть ли else для каждого важного if?
- [ ] Что происходит если все условия false?
- [ ] Могут ли условия пересекаться?

✅ Expected: Да, все случаи обработаны и покрыты тестами

**Status:** [ ] Reviewed [ ] Fixed [ ] N/A

**Notes:**
```
[ВАШ ответ]
```
```

---

## 📋 Категории вопросов

### 🔀 Conditions (Условия)

**Что проверяется:**
- Все ли ветки if обработаны?
- Есть ли else там где нужно?
- Правильный ли порядок условий?

**Пример вопроса:**
```
Q: Есть if без else. Что происходит в альтернативном случае?

Check Points:
- [ ] Нужна ли обработка альтернативного случая?
- [ ] Корректно ли поведение по умолчанию?

Expected: Альтернативный случай обрабатывается корректно
```

---

### 🔄 Loops (Циклы)

**Что проверяется:**
- Что если коллекция пустая?
- Корректен ли досрочный выход (break/continue)?
- Оптимальна ли сложность?

**Пример вопроса:**
```
Q: Что произойдет если коллекция пустая?

Check Points:
- [ ] Проверяется ли пустота перед циклом?
- [ ] Корректно ли поведение для пустой коллекции?
- [ ] Есть ли тесты для этого случая?

Expected: Пустая коллекция обрабатывается корректно
```

---

### 🛡️ Null Safety (Безопасность от null)

**Что проверяется:**
- Проверяются ли объекты на null?
- Что если find() не найдет запись?
- Используется ли оператор ??

**Пример вопроса:**
```
Q: Используется find() без проверки результата. Что если запись не найдена?

Check Points:
- [ ] Обрабатывается ли случай когда find() вернет null?
- [ ] Нужно ли выбросить exception?
- [ ] Корректно ли дальнейшее выполнение?

Expected: Случай не найденной записи обрабатывается
```

---

### ⚠️ Edge Cases (Граничные случаи)

**Что проверяется:**
- Пустой массив
- Нулевое значение
- Очень большие значения
- Специальные символы

**Пример вопроса:**
```
Q: Работа с массивами. Протестированы ли граничные случаи?

Check Points:
- [ ] Пустой массив - что произойдет?
- [ ] Массив с одним элементом - корректно?
- [ ] Очень большой массив - нет проблем с памятью?

Expected: Все граничные случаи протестированы
```

---

### 💾 Transactions (Транзакции)

**Что проверяется:**
- Используются ли транзакции для множественных операций?
- Что если одна операция упадет?
- Корректен ли rollback?

**Пример вопроса:**
```
Q: Множественные модификации БД без транзакции. Что если одна операция упадет?

Check Points:
- [ ] Обеспечена ли атомарность операций?
- [ ] Что произойдет при частичном выполнении?
- [ ] Нужна ли транзакция?

Expected: Транзакция используется или операции независимы
```

---

### ✅ Validation (Валидация)

**Что проверяется:**
- Валидируются ли входные данные?
- Используется ли FormRequest?
- Защита от XSS и SQL Injection?

**Пример вопроса:**
```
Q: Используется $request без валидации. Данные проверены?

Check Points:
- [ ] Валидация происходит в FormRequest?
- [ ] Все ли поля проверены?
- [ ] Защищены ли от XSS и SQL Injection?

Expected: Валидация выполнена в FormRequest или методе
```

---

### ↩️ Return Values (Возвращаемые значения)

**Что проверяется:**
- Все ли пути возврата покрыты?
- Согласованы ли типы возвращаемых значений?
- Нет ли забытых return?

**Пример вопроса:**
```
Q: Метод имеет 5 точек возврата. Все ли случаи покрыты?

Check Points:
- [ ] Возвращается ли согласованный тип во всех случаях?
- [ ] Нет ли пропущенных return?
- [ ] Можно ли упростить логику?

Expected: Все пути возврата покрыты и согласованы
```

---

### ⚡ Exceptions (Исключения)

**Что проверяется:**
- Кто ловит выброшенное исключение?
- Логируются ли ошибки?
- Нет ли пустых catch блоков?

**Пример вопроса:**
```
Q: Пустой catch блок! Исключение проглатывается?

Check Points:
- [ ] Почему исключение игнорируется?
- [ ] Нужно ли его логировать?
- [ ] Корректно ли дальнейшее выполнение?

Expected: Игнорирование оправдано или нужна обработка
```

---

## 🎯 Приоритеты вопросов

### 🔴 Critical - Ответить ОБЯЗАТЕЛЬНО!

**Что:**
- Потенциальная потеря данных
- Критичные баги
- Проблемы безопасности

**Пример:**
```
🔴 Множественные модификации БД без транзакции. 
   Что если одна операция упадет?
```

---

### 🟠 High - Ответить в первую очередь

**Что:**
- Баги в edge cases
- Проблемы с null
- Некорректная логика

**Пример:**
```
🟠 Используется find() без проверки результата. 
   Что если запись не найдена?
```

---

### 🟡 Medium - Важные улучшения

**Что:**
- Улучшение читаемости
- Оптимизация
- Лучшие практики

**Пример:**
```
🟡 Нет проверки на пустоту перед циклом. 
   Это намеренно?
```

---

### 🟢 Low - Nice to have

**Что:**
- Косметические улучшения
- Дополнительные проверки
- Документация

**Пример:**
```
🟢 Тернарный оператор в return. 
   Все ли случаи очевидны?
```

---

## 💡 Как использовать

### Workflow 1: Code Review

```bash
# 1. Анализ перед review
npm start -- --file=OrderService.php --refactor-dir=review

# 2. Открыть Q&A
cursor review/logic-qa/by-file/OrderService.md

# 3. Ответить на вопросы
# 4. Добавить комментарии в PR
```

---

### Workflow 2: Написание тестов

```bash
# 1. Анализ перед тестами
npm start -- --path=app/Services --refactor-dir=tests-prep

# 2. Открыть чеклист
cursor tests-prep/logic-qa/INTERACTIVE_CHECKLIST.md

# 3. Каждый вопрос = тест-кейс!
# Пример:

# Q: Что если коллекция пустая?
# → Test: test_handles_empty_collection()

# Q: Что если find() вернет null?
# → Test: test_throws_exception_when_order_not_found()
```

---

### Workflow 3: Onboarding

```bash
# 1. Анализ проекта
npm start -- --path=/project --refactor-dir=onboarding

# 2. Новичок читает Q&A
cursor onboarding/logic-qa/LOGIC_QUESTIONS_BY_CATEGORY.md

# 3. Понимает:
#    - Почему сделано так
#    - Какие edge cases учтены
#    - Где могут быть проблемы
```

---

### Workflow 4: Refactoring

```bash
# 1. Анализ перед рефакторингом
npm start -- --file=LegacyService.php --refactor-dir=refactor

# 2. Ответить на вопросы
# 3. СНАЧАЛА написать тесты для всех edge cases
# 4. ПОТОМ рефакторить
# 5. Запустить тесты - всё работает!
```

---

## 📊 Структура отчетов

### INTERACTIVE_CHECKLIST.md

**Для кого:** Разработчик, тестировщик  
**Когда:** Ежедневная работа

**Содержит:**
- Статистику вопросов
- Critical вопросы с чеклистами
- Быстрые ссылки на детали

---

### LOGIC_QUESTIONS_BY_PRIORITY.md

**Для кого:** Team Lead, QA  
**Когда:** Планирование, code review

**Содержит:**
- Все вопросы сгруппированные по приоритету
- Детальные чек-поинты
- Места для ответов

---

### LOGIC_QUESTIONS_BY_CATEGORY.md

**Для кого:** Developer, Architect  
**Когда:** Анализ архитектуры

**Содержит:**
- Вопросы по категориям (условия, циклы, null safety)
- Помогает увидеть паттерны проблем

---

### by-file/ директория

**Для кого:** Разработчик конкретного файла  
**Когда:** Работа с конкретным файлом

**Содержит:**
- Вопросы только для одного файла
- Контекст метода и строки

---

## 🎓 Примеры

### Пример 1: Простой метод

```php
public function calculateTotal($items) {
    $total = 0;
    foreach ($items as $item) {
        $total += $item->price;
    }
    return $total;
}
```

**Вопросы:**
```
🟠 Что произойдет если коллекция пустая?
   ✅ Вернет 0 - корректно

🟡 Что если $item->price = null?
   ⚠️ Нужна проверка или валидация

🟢 Оптимальна ли сложность O(n)?
   ✅ Да, нельзя быстрее
```

---

### Пример 2: Сложная логика

```php
public function processOrder($orderId) {
    $order = Order::find($orderId);
    
    if ($order->status === 'pending') {
        $order->items()->each(function($item) {
            $item->product->decrement('stock');
        });
        $order->update(['status' => 'processing']);
    }
    
    return $order;
}
```

**Вопросы:**
```
🔴 find() может вернуть null. Что тогда?
   ❌ Нужна проверка или findOrFail()

🔴 Множественные операции без транзакции!
   ❌ Нужна DB::transaction()

🟠 N+1 query в each!
   ❌ Нужен eager loading ->with('items.product')

🟡 Что если $order->status уже 'processing'?
   ⚠️ Нужно проверить state machine
```

---

### Пример 3: Исправленная версия

```php
public function processOrder($orderId) {
    return DB::transaction(function () use ($orderId) {
        $order = Order::with('items.product')
            ->lockForUpdate()
            ->findOrFail($orderId);
        
        if ($order->status !== 'pending') {
            throw new InvalidOrderStateException();
        }
        
        foreach ($order->items as $item) {
            $item->product->decrement('stock');
        }
        
        $order->update(['status' => 'processing']);
        
        return $order;
    });
}
```

**Ответы на вопросы:**
```
✅ find() заменен на findOrFail() → exception если не найдено
✅ Добавлена транзакция → атомарность
✅ Eager loading → нет N+1
✅ lockForUpdate() → нет race conditions
✅ Проверка state → некорректный переход выбросит exception
```

---

## 🧪 Превращаем вопросы в тесты

```php
class ProcessOrderTest extends TestCase
{
    /** @test */
    public function throws_exception_when_order_not_found()
    {
        // Q: find() может вернуть null?
        $this->expectException(ModelNotFoundException::class);
        $service->processOrder(999999);
    }
    
    /** @test */
    public function handles_empty_items_collection()
    {
        // Q: Что если коллекция пустая?
        $order = Order::factory()->create();
        $result = $service->processOrder($order->id);
        $this->assertEquals('processing', $result->status);
    }
    
    /** @test */
    public function rolls_back_on_stock_decrement_failure()
    {
        // Q: Что если одна операция упадет?
        Product::shouldReceive('decrement')
            ->andThrow(new Exception());
        
        $this->expectException(Exception::class);
        $service->processOrder($order->id);
        
        // Проверяем что order.status не изменился
        $this->assertEquals('pending', $order->fresh()->status);
    }
}
```

---

## 💡 Советы

### 1. Начинайте с Critical

```bash
# Отфильтровать только critical
grep -A 10 "🔴" logic-qa/INTERACTIVE_CHECKLIST.md
```

### 2. Используйте для тестов

Каждый вопрос → минимум 1 тест

### 3. Документируйте ответы

Ответы помогут команде понять решения

### 4. Ревью перед мержем

Проверьте что на все critical вопросы есть ответы

### 5. Обновляйте после рефакторинга

```bash
npm start -- --file=RefactoredFile.php --refactor-dir=after
# Сравните с before - стало ли лучше?
```

---

## 🔗 Интеграция с Cursor

```bash
# 1. Открыть Q&A
cursor refactoring/logic-qa/INTERACTIVE_CHECKLIST.md

# 2. Скопировать вопрос

# 3. В Cursor AI:
@app/Services/OrderService.php

Вопрос: Множественные модификации БД без транзакции. 
Что если одна операция упадет?

Исправь добавив транзакцию и обработку ошибок.
Убедись что все операции атомарны.
```

---

## 📚 Дополнительная документация

- [README.md](./README.md) - Основная документация
- [CURSOR_PROMPTS_GUIDE.md](./CURSOR_PROMPTS_GUIDE.md) - Cursor промпты
- [ANALYZERS.md](./ANALYZERS.md) - Все анализаторы

---

## 🎯 Итог

**Logic Q&A** помогает:
- ✅ Найти пропущенные edge cases
- ✅ Улучшить покрытие тестами
- ✅ Документировать логику
- ✅ Onboarding новых разработчиков
- ✅ Code review качество

**Начните с:**
```bash
npm start -- --path=/project --refactor-dir=refactoring
cursor refactoring/logic-qa/INTERACTIVE_CHECKLIST.md
```

🚀 **Удачи в проверке логики!**

