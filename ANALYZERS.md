# 🔍 Документация анализаторов

## Обзор

Laravel Code Improver включает 10 специализированных анализаторов для комплексной проверки кода.

---

## 🔒 SecurityAnalyzer

**Назначение:** Поиск критических уязвимостей безопасности

### Проверяемые проблемы:

#### 1. SQL Injection (Critical)
```php
// ❌ Плохо
DB::raw("SELECT * FROM users WHERE id = $id")
User::whereRaw("name = '$name'")

// ✅ Хорошо
DB::raw("SELECT * FROM users WHERE id = ?", [$id])
User::whereRaw("name = ?", [$name])
User::where('name', $name)
```

#### 2. XSS уязвимости (Critical)
```blade
{{-- ❌ Плохо --}}
{!! $userInput !!}

{{-- ✅ Хорошо --}}
{{ $userInput }}
```

#### 3. Mass Assignment (Critical)
```php
// ❌ Плохо
class User extends Model {
    protected $guarded = [];
}
User::create($request->all());

// ✅ Хорошо
class User extends Model {
    protected $fillable = ['name', 'email'];
}
User::create($request->validated());
```

#### 4. Опасные функции (Critical)
```php
// ❌ Избегайте
eval($code);
exec($command);
shell_exec($cmd);

// ✅ Используйте безопасные альтернативы
Process::run($command);
```

#### 5. Небезопасное хранение паролей (Critical)
```php
// ❌ Плохо
$user->password = $request->password;

// ✅ Хорошо
$user->password = Hash::make($request->password);
$user->password = bcrypt($request->password);
```

#### 6. Загрузка файлов без валидации (Major)
```php
// ❌ Плохо
$file = $request->file('upload');
$file->move('/path');

// ✅ Хорошо
$request->validate([
    'upload' => 'required|file|mimes:jpg,png|max:2048'
]);
$request->file('upload')->store('uploads');
```

---

## ⚡ NPlusOneDetector

**Назначение:** Обнаружение N+1 проблем с запросами

### Проверяемые паттерны:

#### 1. Relationship в цикле (Critical)
```php
// ❌ N+1 проблема
$users = User::all();
foreach ($users as $user) {
    echo $user->posts->count(); // N+1!
}

// ✅ Eager Loading
$users = User::with('posts')->get();
foreach ($users as $user) {
    echo $user->posts->count();
}
```

#### 2. Запросы внутри цикла (Critical)
```php
// ❌ Плохо
foreach ($orders as $order) {
    $user = User::find($order->user_id); // N+1!
}

// ✅ Хорошо
$userIds = $orders->pluck('user_id');
$users = User::whereIn('id', $userIds)->get()->keyBy('id');
foreach ($orders as $order) {
    $user = $users[$order->user_id];
}
```

#### 3. Lazy loading при передаче в view (Major)
```php
// ❌ Плохо
public function index() {
    $posts = Post::all(); // без with()
    return view('posts.index', compact('posts'));
}
// В view: $post->author - lazy loading для каждого поста!

// ✅ Хорошо
public function index() {
    $posts = Post::with('author', 'comments')->get();
    return view('posts.index', compact('posts'));
}
```

---

## 🚀 PerformanceAnalyzer

**Назначение:** Оптимизация производительности

### Проверяемые проблемы:

#### 1. Запросы без фильтрации (Major)
```php
// ❌ Загрузка всей таблицы
$users = User::get();

// ✅ С фильтрацией
$users = User::where('active', true)->limit(100)->get();
$users = User::paginate(20);
```

#### 2. Отсутствие индексов (Major)
```php
// ❌ Миграция без индексов
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id'); // Нет индекса!
});

// ✅ С индексами
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->index();
    $table->index('created_at'); // Для сортировки
});
```

#### 3. Множественные операции без транзакций (Major)
```php
// ❌ Без транзакции
$order = Order::create($data);
$order->items()->createMany($items);
$user->balance -= $total;
$user->save();

// ✅ В транзакции
DB::transaction(function () use ($data, $items, $user, $total) {
    $order = Order::create($data);
    $order->items()->createMany($items);
    $user->decrement('balance', $total);
});
```

#### 4. SELECT * вместо нужных колонок (Minor)
```php
// ❌ Загружает все колонки
$users = User::get();

// ✅ Только нужные
$users = User::select(['id', 'name', 'email'])->get();
```

#### 5. Отсутствие кеширования (Info)
```php
// ❌ Без кеша
public function stats() {
    return Order::sum('total'); // Каждый раз запрос
}

// ✅ С кешем
public function stats() {
    return Cache::remember('orders.total', 3600, function () {
        return Order::sum('total');
    });
}
```

---

## 🧹 CodeSmellDetector

**Назначение:** Обнаружение антипаттернов и проблем проектирования

### Проверяемые паттерны:

#### 1. Слишком много параметров (Major)
```php
// ❌ Плохо
public function createOrder(
    $userId, 
    $productId, 
    $quantity, 
    $price, 
    $discount
) {}

// ✅ Хорошо - используйте DTO
class CreateOrderData {
    public function __construct(
        public int $userId,
        public int $productId,
        public int $quantity,
        public float $price,
        public float $discount
    ) {}
}

public function createOrder(CreateOrderData $data) {}
```

#### 2. God Class (Major)
```php
// ❌ Класс с 20+ методами
class OrderController {
    public function index() {}
    public function create() {}
    public function store() {}
    // ... еще 17 методов
}

// ✅ Разделите на несколько классов
class OrderController {}
class OrderPaymentController {}
class OrderShippingController {}
```

#### 3. Feature Envy (Minor)
```php
// ❌ Метод использует данные другого объекта
class Order {
    public function calculateShipping(User $user) {
        $total = $user->address->city->shippingRate * 
                 $user->address->distance;
        return $total;
    }
}

// ✅ Переместите в User
class User {
    public function calculateShippingFor(Order $order) {
        return $this->address->calculateShipping($order);
    }
}
```

#### 4. Primitive Obsession (Info)
```php
// ❌ Примитивы везде
public function sendEmail(string $email) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception();
    }
    // ...
}

// ✅ Value Object
class Email {
    public function __construct(private string $value) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException();
        }
    }
    
    public function toString(): string {
        return $this->value;
    }
}

public function sendEmail(Email $email) {
    // Валидация уже выполнена в конструкторе
}
```

---

## 🏗️ ArchitectureAnalyzer

**Назначение:** Проверка соответствия архитектурным паттернам Laravel

### Проверяемые паттерны:

#### 1. Бизнес-логика в контроллерах (Major)
```php
// ❌ "Толстый" контроллер
class OrderController {
    public function store(Request $request) {
        $order = Order::create($request->all());
        $order->items()->createMany($request->items);
        
        foreach ($order->items as $item) {
            $product = Product::find($item->product_id);
            $product->stock -= $item->quantity;
            $product->save();
        }
        
        Mail::to($order->user)->send(new OrderCreated($order));
        
        return redirect()->route('orders.show', $order);
    }
}

// ✅ Тонкий контроллер с Service Layer
class OrderController {
    public function __construct(
        private OrderService $orderService
    ) {}
    
    public function store(StoreOrderRequest $request) {
        $order = $this->orderService->createOrder($request->validated());
        return redirect()->route('orders.show', $order);
    }
}

class OrderService {
    public function createOrder(array $data): Order {
        return DB::transaction(function () use ($data) {
            $order = Order::create($data);
            $this->createOrderItems($order, $data['items']);
            $this->updateProductStock($order);
            $this->sendNotification($order);
            return $order;
        });
    }
}
```

#### 2. Отсутствие $fillable (Major)
```php
// ❌ Уязвимость mass assignment
class User extends Model {
    // Нет защиты
}

// ✅ С защитой
class User extends Model {
    protected $fillable = ['name', 'email', 'password'];
}
```

---

## 📏 MethodSizeAnalyzer

Рекомендуемый максимум: **15 строк**

```php
// ❌ Слишком длинный метод (50+ строк)
public function process() {
    // 50 строк кода...
}

// ✅ Разбит на методы
public function process() {
    $this->validate();
    $this->prepare();
    $this->execute();
    $this->notify();
}
```

---

## 🧠 LogicAnalyzer

Проверяет:
- Цикломатическую сложность (макс 10)
- Глубину вложенности (макс 4)
- Magic numbers

---

## 📝 TypeChecker

Проверяет наличие:
- Type hints для параметров
- Return types
- Документацию для array параметров

---

## 📚 DocBlockAnalyzer

Проверяет наличие PHPDoc для публичных методов

---

## 🎯 TraitScopeAnalyzer

Анализирует использование traits и scopes в моделях

---

## 🔧 Настройка анализаторов

Отредактируйте `config.json`:

```json
{
  "analysisRules": {
    "methodSize": {
      "maxLines": 15,
      "enabled": true
    },
    "complexity": {
      "maxComplexity": 10,
      "enabled": true
    },
    "nesting": {
      "maxDepth": 4,
      "enabled": true
    }
  },
  "severityLevels": {
    "critical": ["security", "sql_injection", "n_plus_one"],
    "major": ["architecture", "performance"],
    "minor": ["style", "documentation"],
    "info": ["suggestion", "optimization"]
  }
}
```

---

## 📊 Severity уровни

| Уровень | Описание | Примеры |
|---------|----------|---------|
| **Critical** | Критические проблемы безопасности | SQL Injection, XSS, Mass Assignment |
| **Major** | Серьезные проблемы архитектуры/производительности | N+1 queries, отсутствие транзакций |
| **Minor** | Проблемы качества кода | Code smells, дублирование |
| **Info** | Рекомендации и оптимизации | Кеширование, documentation |

---

## 🚀 Workflow рекомендации

### 1. Pre-commit hook
```bash
npm start -- --git-staged --compact
```

### 2. CI/CD pipeline
```bash
npm start -- --git-diff --output=report.json
```

### 3. Регулярный аудит
```bash
npm start -- --path=/project --refactor-dir=audit --compact
```

### 4. Работа с Cursor AI
```bash
npm start -- --file=Controller.php --top=5
# Открыть в Cursor и попросить AI исправить
```

---

Более подробная информация в [README.md](./README.md)

