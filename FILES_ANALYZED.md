# 📁 Анализируемые файлы

## Что анализируется

Скрипт ищет и анализирует все **PHP файлы** в проекте, которые удовлетворяют условиям.

---

## ✅ Включено в анализ

### Директории, которые анализируются:

```
app/
├── Models/          ✅ Анализируются
├── Controllers/     ✅ Анализируются
├── Services/        ✅ Анализируются
├── Providers/       ✅ Анализируются
├── Http/
│   ├── Controllers/ ✅ Анализируются
│   ├── Requests/    ✅ Анализируются
│   └── Resources/    ✅ Анализируются
├── Console/
│   └── Commands/    ✅ Анализируются
└── Helpers/         ✅ Анализируются

config/              ✅ Анализируются
database/
├── migrations/      ✅ Анализируются
├── seeders/         ✅ Анализируются
└── factories/       ✅ Анализируются
```

### Типы файлов:

- ✅ **Models** (app/Models/*.php)
- ✅ **Controllers** (app/Http/Controllers/*.php)
- ✅ **Services** (app/Services/*.php)
- ✅ **Requests** (app/Http/Requests/*.php)
- ✅ **Resources** (app/Http/Resources/*.php)
- ✅ **Middleware** (app/Http/Middleware/*.php)
- ✅ **Commands** (app/Console/Commands/*.php)
- ✅ **Providers** (app/Providers/*.php)
- ✅ **Seeders** (database/seeders/*.php)
- ✅ **Factories** (database/factories/*.php)
- ✅ **Migrations** (database/migrations/*.php)
- ✅ **Любые другие** PHP файлы в проекте

---

## ❌ Исключено из анализа

По умолчанию исключаются:

1. **vendor/** - Зависимости Composer
2. **node_modules/** - JavaScript зависимости  
3. **storage/** - Файлы данных приложения
4. **resources/** - Статические ресурсы
5. **public/** - Публичные файлы
6. **tests/** - Тестовые файлы
7. **bootstrap/** - Bootstrap файлы Laravel

---

## 📊 Статистика вашего проекта

**Проанализировано:** 188 PHP файлов

### Распределение по папкам:

```
app/
├── Models/            # ~20 файлов
├── Controllers/       # ~15 файлов
├── Services/          # ~5 файлов
├── Http/
│   └── Controllers/   # ~10 файлов
└── Console/Commands/  # ~8 файлов

database/
├── migrations/        # ~40 файлов
└── seeders/          # ~6 файлов
```

---

## 🔧 Настройка исключений

Вы можете изменить список исключений при запуске:

```bash
# Исключить дополнительные папки
npm start -- \
  --path=/home/ghost/saasApp \
  --exclude=vendor,tests,node_modules,custom_folder

# Включить все файлы (без исключений)
npm start -- \
  --path=/home/ghost/saasApp \
  --exclude=
```

---

## 📝 Что проверяется в каждом файле

### 1. Размер методов
- Длина методов (по умолчанию > 15 строк)
- Предложения по разбиению

### 2. Сложность логики
- Вложенные условия
- Циклы и рекурсии
- Магические числа

### 3. Типизация
- Наличие type hints
- Return types
- PHPDoc аннотации

### 4. Документация
- PHPDoc для классов
- PHPDoc для методов
- @param и @return

### 5. Архитектура
- Service Layer pattern
- Repository pattern
- Правила Laravel

### 6. Трейты и Скоупы (NEW! ⭐)
- Предложения по созданию трейтов
- Предложения по созданию скоупов
- Вынесение повторяющегося кода

---

## 🎯 Примеры анализируемых файлов

```php
// app/Models/Product.php ✅
class Product extends Model { /* ... */ }

// app/Http/Controllers/ProductController.php ✅  
class ProductController extends Controller { /* ... */ }

// app/Services/ProductService.php ✅
class ProductService { /* ... */ }

// database/seeders/ProductSeeder.php ✅
class ProductSeeder extends Seeder { /* ... */ }

// database/migrations/2025_*_create_products_table.php ✅
class CreateProductsTable extends Migration { /* ... */ }
```

---

## ❌ Что НЕ анализируется

```php
// vendor/* ❌
// node_modules/* ❌
// storage/* ❌
// tests/* ❌ - Тесты исключены
// public/* ❌
// resources/views/*.blade.php ❌ - Blade шаблоны
// resources/js/*.js ❌ - JavaScript
```

---

## 🔄 Изменить список анализируемых файлов

Отредактируйте `src/CodeAnalyzer.js`:

```javascript
// Изменить расширение файлов
return await glob('**/*.{php,phtml}', { ... });

// Или добавить конкретные папки
return await glob('app/**/*.php', { ... });
```

---

✅ Итого: **188 PHP файлов** вашего Laravel проекта были проанализированы!

