#!/bin/bash
# Генерация компактного отчета для Cursor

echo "🔍 Создание компактного отчета..."
npm start -- --path=/home/ghost/saasApp --compact --output=code-report-compact.json

echo ""
echo "✅ Компактный отчет создан: code-report-compact.json"

