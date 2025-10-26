#!/bin/bash
# Анализ Laravel проекта с сохранением в папку refactoring

PROJECT_PATH="${1:-/home/ghost/saasApp}"
REPORT_DIR="refactoring"

echo "🔍 Анализ проекта Laravel"
echo "📁 Проект: $PROJECT_PATH"
echo "📂 Отчеты: $PROJECT_PATH/$REPORT_DIR"
echo ""

# Создать папку для отчетов
mkdir -p "$PROJECT_PATH/$REPORT_DIR"

# Запуск анализа
npm start -- \
  --path="$PROJECT_PATH" \
  --refactor-dir="$REPORT_DIR" \
  --verbose \
  --exclude=vendor,node_modules,storage,resources,public,tests,bootstrap

echo ""
echo "✅ Готово! Отчеты в: $PROJECT_PATH/$REPORT_DIR"

