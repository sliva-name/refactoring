#!/bin/bash
# Скрипт для запуска анализа Laravel проекта

# Параметры по умолчанию
LARAVEL_PROJECT_PATH="/home/ghost/saasApp"
OUTPUT_FILE="code-report.json"

# Если передан аргумент, используем его как путь
if [ ! -z "$1" ]; then
    LARAVEL_PROJECT_PATH="$1"
fi

echo "🔍 Запуск анализа Laravel проекта..."
echo "📁 Путь к проекту: $LARAVEL_PROJECT_PATH"
echo ""

# Проверка существования пути
if [ ! -d "$LARAVEL_PROJECT_PATH" ]; then
    echo "❌ Ошибка: Проект не найден по пути $LARAVEL_PROJECT_PATH"
    exit 1
fi

# Запуск анализа
npm start -- --path="$LARAVEL_PROJECT_PATH" --verbose --output="$OUTPUT_FILE"

echo ""
echo "✅ Анализ завершен! Отчет сохранен в: $OUTPUT_FILE"

