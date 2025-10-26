#!/bin/bash
# Установка Node.js, npm и необходимых инструментов для сборки в WSL

echo "=== Установка инструментов для сборки нативных модулей ==="
echo "Требуется ввод пароля для sudo..."
sudo apt-get update
sudo apt-get install -y build-essential python3-dev

echo "=== Установка Node.js и npm через apt ==="

if ! command -v node &> /dev/null
then
    echo "Скачивание и установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js уже установлен: $(node --version)"
fi

echo "=== Проверка установки ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "make: $(make --version | head -n 1)"

echo "=== Очистка старых зависимостей ==="
rm -rf node_modules package-lock.json

echo "=== Установка зависимостей проекта ==="
npm install

echo "=== Проверка установки ==="
if [ -f "check.js" ]; then
    node check.js
else
    echo "check.js не найден, пропускаем проверку"
fi

