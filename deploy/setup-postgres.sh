#!/bin/bash
# Устанавливает PostgreSQL и создаёт пользователя БД из backend/.env.
# Запуск с сервера (из корня проекта):
#   chmod +x deploy/setup-postgres.sh
#   ./deploy/setup-postgres.sh
#
# Перед запуском создай backend/.env и заполни DB_USER, DB_PASSWORD (см. backend/.env.example).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
  echo "Создай backend/.env с DB_USER, DB_PASSWORD (см. backend/.env.example)."
  exit 1
fi

echo "Установка PostgreSQL..."
sudo apt-get update -qq
sudo apt-get install -y postgresql postgresql-contrib

sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "Создание пользователя PostgreSQL из backend/.env..."
cd "$PROJECT_ROOT/backend"
npm install --silent 2>/dev/null || true   # dotenv для скрипта
sudo -u postgres node scripts/create-pg-user.js

echo ""
echo "Готово. Запусти бэкенд — база создастся при первом старте."
