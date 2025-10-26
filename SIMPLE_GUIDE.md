# 🚀 Простая инструкция

## Запустить анализ

```bash
./quick-start.sh
```

Отчеты появятся в: `/home/ghost/saasApp/refactoring/`

## Открыть в Cursor

```
Ctrl+P → введите: refactoring/code-report-top5.json
```

## Использовать с AI

В чате Cursor напишите:
```
@refactoring/code-report-top5.json Проанализируй отчет
```

## Файлы

В папке `refactoring/` будет:
- ✅ **code-report-top5.json** - Откройте это (172 KB)
- **code-report-compact.json** - Только важное (1.7 MB)
- **code-report.json** - Все проблемы (2.1 MB)

## Готово! 🎉

Теперь можете:
1. Просматривать отчеты в Cursor
2. Задавать вопросы AI по проблемам
3. Начинать исправлять код

---

**Основные проблемы вашего проекта:**
- missing_fillable: 4764 (добавьте $fillable в Models)
- global_facade: 499 (используйте Dependency Injection)
- high_complexity: 349 (упростите логику)

Начните с Models и их $fillable!

