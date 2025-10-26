#!/bin/bash
# Быстрый запуск анализа Laravel проекта

PROJECT_PATH="/home/ghost/saasApp"
REPORT_DIR="refactoring"

echo "=========================================="
echo "🔍 Laravel Code Improver"
echo "=========================================="
echo ""
echo "📁 Проект: $PROJECT_PATH"
echo "📂 Папка отчетов: $PROJECT_PATH/$REPORT_DIR"
echo ""
echo "Запуск анализа..."
echo ""

npm start -- --path="$PROJECT_PATH" --refactor-dir="$REPORT_DIR" --verbose --exclude=vendor,node_modules,storage,resources,public,tests,bootstrap

echo ""
echo "=========================================="
echo "✅ Анализ завершен!"
echo "📊 Отчеты сохранены в: $PROJECT_PATH/$REPORT_DIR"
echo ""
echo "Файлы:"
echo "  - code-report.json (полный)"
echo "  - code-report-compact.json (только major)"
echo "  - code-report-top5.json (топ-5 на файл)"
echo "=========================================="

