const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '..', '.env');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function (line) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  });
}

const DB_USER = env.DB_USER || process.env.DB_USER || 'miniapp';
const DB_PASSWORD = env.DB_PASSWORD || process.env.DB_PASSWORD || '';

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
