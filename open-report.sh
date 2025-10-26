#!/bin/bash
# Скрипт для открытия отчета в Cursor

REPORT_FILE="code-report-top5.json"

echo "📊 Открытие отчета в Cursor..."
echo ""
echo "Файл: $REPORT_FILE"
echo ""
echo "Размер: $(du -h $REPORT_FILE | cut -f1)"
echo "Строк: $(wc -l < $REPORT_FILE)"
echo ""

# Попытка открыть через code команду
if command -v code &> /dev/null; then
    echo "✅ Открываю через code..."
    code "$REPORT_FILE"
elif command -v cursor &> /dev/null; then
    echo "✅ Открываю через cursor..."
    cursor "$REPORT_FILE"
elif [ -n "$DISPLAY" ]; then
    echo "✅ Открываю в редакторе..."
    xdg-open "$REPORT_FILE" 2>/dev/null
else
    echo "⚠️  Автоматическое открытие недоступно"
    echo ""
    echo "Откройте файл вручную:"
    echo "  Ctrl+P -> введите: $REPORT_FILE"
    echo ""
    echo "Или в терминале:"
    echo "  code $REPORT_FILE"
    echo ""
fi

echo ""
echo "💡 Советы по использованию:"
echo "  1. В Cursor: Ctrl+P -> code-report-top5.json"
echo "  2. Используйте @code-report-top5.json в чате AI"
echo "  3. Или откройте HTML: code-report-summary.html"

