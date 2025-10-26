#!/bin/bash
# Скрипт для чистой установки с правильными версиями

echo "=== Исправление прав доступа ==="
sudo chown -R $USER:$USER node_modules 2>/dev/null || echo "Пропускаем права..."

echo "=== Удаление старых зависимостей ==="
rm -rf node_modules package-lock.json

echo "=== Установка зависимостей ==="
npm install

echo "=== Проверка установки ==="
node check.js 2>/dev/null || echo "check.js не найден или имеет ошибки"

echo "=== Готово! ==="
echo "Теперь запустите: npm start -- --path=/home/ghost/saasApp"

