/**
 * Создаёт пользователя PostgreSQL с правами CREATEDB.
 * Параметры берутся из backend/.env (DB_USER, DB_PASSWORD, DB_NAME не используется, базу создаёт бэкенд).
 *
 * Запуск (из корня проекта, после того как backend/.env заполнен):
 *   sudo -u postgres node backend/scripts/create-pg-user.js
 *
 * Или из папки backend:
 *   sudo -u postgres node scripts/create-pg-user.js
 */

const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_USER = process.env.DB_USER || 'miniapp';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

if (!DB_PASSWORD) {
  console.error('В backend/.env должен быть задан DB_PASSWORD.');
  process.exit(1);
}

function escapeIdentifier(str) {
  return '"' + String(str).replace(/"/g, '""') + '"';
}

function escapeLiteral(str) {
  return "'" + String(str).replace(/'/g, "''") + "'";
}

const sql = `CREATE USER ${escapeIdentifier(DB_USER)} WITH PASSWORD ${escapeLiteral(DB_PASSWORD)} CREATEDB;`;

try {
  execSync('psql', ['-d', 'postgres', '-c', sql], {
    stdio: 'inherit',
    env: { ...process.env, PGOPTIONS: '-c client_min_messages=warning' },
  });
  console.log(`Пользователь PostgreSQL "${DB_USER}" создан (с правом CREATEDB).`);
} catch (e) {
  const stderr = (e.stderr && e.stderr.toString()) || '';
  if (/already exists/.test(stderr)) {
    console.log(`Пользователь "${DB_USER}" уже существует.`);
    process.exit(0);
  }
  throw e;
}
