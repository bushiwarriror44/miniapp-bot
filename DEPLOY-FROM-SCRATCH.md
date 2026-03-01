# Развёртывание TeleDoska с нуля на одном сервере с одним доменом

Пошаговая инструкция для **пустого** сервера (Ubuntu 22.04). Один домен **teledoska.com**, один IP сервера. Nginx, SSL без email, бот и админка на одном сервере.

---

## Схема

| Сервис        | Поддомен/путь   | Порт на сервере | Назначение                    |
|---------------|-----------------|------------------|-------------------------------|
| Mini App      | **teledoska.com** (или www) | 3000 | Фронтенд (Next.js)           |
| API           | **api.teledoska.com**       | 3001 | Бэкенд (NestJS)              |
| Админ-панель  | **admin.teledoska.com**     | 5000 | Админка (Flask/Docker)       |

**DNS (настрой у регистратора домена):**

- Запись **A**: `teledoska.com` → IP сервера (например `172.86.116.81` или твой реальный публичный IP).
- Запись **A**: `www.teledoska.com` → тот же IP (по желанию).
- Запись **A**: `api.teledoska.com` → тот же IP.
- Запись **A**: `admin.teledoska.com` → тот же IP.

Дождись распространения DNS (до 24 часов, часто 5–15 минут). Проверка: `ping api.teledoska.com`.

---

## 1. Подключение к серверу и базовая подготовка

```bash
ssh root@172.86.116.81
# или: ssh user@твой_IP
```

Обновление системы и установка базовых пакетов:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

---

## 2. Установка Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
npm -v
```

---

## 3. Установка Nginx и Certbot (SSL)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Проверка: открой в браузере `http://твой_IP` — должна открыться страница Nginx.

---

## 4. Установка PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```



Создание пользователя и базы (подставь свой пароль):

```bash
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'WEC321Dcx';"
sudo -u postgres psql -c "ALTER USER postgres WITH CREATEDB;"
sudo -u postgres createdb -O postgres miniapp_bot
```

Либо используй скрипт из проекта (см. шаг 6).

---

## 5. Установка Docker (для админки)

Админку удобно запускать в Docker. Установка Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Выйди из SSH и зайди снова, чтобы группа docker применилась
```

Проверка: `docker --version`.

---

## 6. Загрузка проекта на сервер

**Вариант A — Git (если репозиторий на GitHub/GitLab):**

```bash
sudo mkdir -p /var/www/miniapp-bot
sudo chown $USER:$USER /var/www/miniapp-bot
cd /var/www/miniapp-bot
git clone https://github.com/ТВОЙ_ЮЗЕР/ТВОЙ_РЕПО.git .
```

**Вариант B — копирование с локального ПК (из папки с проектом):**

На своём компьютере (в каталоге с проектом):

```bash
scp -r . user@172.86.116.81:/var/www/miniapp-bot/
```

На сервере:

```bash
cd /var/www/miniapp-bot
```

---

## 7. Переменные окружения и конфиги

### 7.1. Backend — `backend/.env`

```bash
cd /var/www/miniapp-bot
cp backend/.env.example backend/.env
nano backend/.env
```

Заполни по образцу (пароль БД — тот же, что задал в шаге 4):

```env
NODE_ENV=production
PORT=3001

# Ключ для запросов от админки (придумай сложную строку).
ADMIN_API_KEY=твой_секретный_ключ_для_админки

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=твой_надёжный_пароль
DB_NAME=miniapp_bot
```

Сохрани: `Ctrl+O`, `Enter`, `Ctrl+X`.

### 7.2. Bot — `bot/.env`

```bash
nano bot/.env
```

Содержимое (токен возьми у [@BotFather](https://t.me/BotFather) — команда `/newbot` или `/token`):

```env
BOT_TOKEN=123456789:ABCdefGHI...
WEBAPP_URL=https://teledoska.com
BOT_CONFIG_API_URL=http://127.0.0.1:5000/api/datasets/botConfig
```

### 7.3. Frontend — `frontend/.env.production`

```bash
nano frontend/.env.production
```

```env
NEXT_PUBLIC_API_URL=https://api.teledoska.com
NEXT_PUBLIC_CONTENT_API_URL=https://admin.teledoska.com/api
```

### 7.4. Админка (Docker) — `admin/.env`

```bash
nano admin/.env
```

```env
BOT_TOKEN=тот_же_что_в_bot/.env
BACKEND_API_URL=http://127.0.0.1:3001
BACKEND_ADMIN_API_KEY=тот_же_ADMIN_API_KEY_из_backend/.env
ADMIN_PUBLIC_BASE_URL=https://admin.teledoska.com
ADMIN_PASSWORD=надёжный_пароль_входа_в_админку
```

---

## 8. PostgreSQL (если не делал вручную в шаге 4)

Если используешь скрипт из репозитория:

```bash
cd /var/www/miniapp-bot
chmod +x deploy/setup-postgres.sh
./deploy/setup-postgres.sh
```

Перед этим в `backend/.env` должны быть заданы `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

## 9. Сборка и запуск приложений

### 9.1. Установка PM2

```bash
sudo npm install -g pm2
```

### 9.2. Сборка backend

```bash
cd /var/www/miniapp-bot/backend
npm ci
npm run build
```

### 9.3. Миграции БД

При **первом** развёртывании на пустой БД:

```bash
cd /var/www/miniapp-bot/backend
npm run migration:run
```

Если появится ошибка `relation "users" already exists` (таблицы уже есть):

```bash
cd /var/www/miniapp-bot/backend
PGPASSWORD="$(grep '^DB_PASSWORD=' .env | cut -d= -f2-)" psql -h localhost -U postgres -d miniapp_bot -f scripts/mark-initial-schema-run.sql
npm run migration:run
```

### 9.4. Сборка бота

```bash
cd /var/www/miniapp-bot/bot
npm ci
npm run build
```

### 9.5. Сборка frontend

```bash
cd /var/www/miniapp-bot/frontend
npm ci
npm run build
```

### 9.6. Запуск backend и bot через PM2

```bash
cd /var/www/miniapp-bot

pm2 start backend/dist/main.js --name backend -i 1
pm2 start bot/dist/bot.js --name bot -i 1
pm2 start npm --name frontend -- start --prefix /var/www/miniapp-bot/frontend

pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
# Выполни команду, которую выведет pm2 (sudo ...)
```

Проверка: `pm2 status` — все три процесса в статусе `online`.

### 9.7. Запуск админки (Docker)

Админка должна собираться из **корня проекта** (контекст родительской папки):

```bash
cd /var/www/miniapp-bot
docker compose -f admin/docker-compose.yaml up -d --build
```

Либо из папки admin (если в compose указан `context: ..`):

```bash
cd /var/www/miniapp-bot/admin
docker compose up -d --build
```

Проверка: `curl -s http://127.0.0.1:5000/api/health` или открой в браузере `http://твой_IP:5000` (до настройки Nginx).

Если админка не может достучаться до бэкенда (ошибки в логах), на Linux в `admin/.env` можно задать `BACKEND_API_URL=http://172.17.0.1:3001` (IP шлюза Docker — проверь `ip addr show docker0`).

---

## 10. Nginx: три виртуальных хоста (до SSL)

Создай три конфига. Домен везде замени на **teledoska.com**, если используешь другой — подставь свой.

### 10.1. Mini App (главная)

```bash
sudo nano /etc/nginx/sites-available/teledoska-app
```

Вставь (замени `teledoska.com` при необходимости):

```nginx
server {
    listen 80;
    server_name teledoska.com www.teledoska.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.2. API

```bash
sudo nano /etc/nginx/sites-available/teledoska-api
```

```nginx
server {
    listen 80;
    server_name api.teledoska.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.3. Админка

```bash
sudo nano /etc/nginx/sites-available/teledoska-admin
```

```nginx
server {
    listen 80;
    server_name admin.teledoska.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.4. Включение сайтов и проверка

```bash
sudo ln -sf /etc/nginx/sites-available/teledoska-app   /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/teledoska-api   /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/teledoska-admin /etc/nginx/sites-enabled/

# Удали дефолтный сайт, если мешает
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

Убедись, что DNS для `teledoska.com`, `api.teledoska.com`, `admin.teledoska.com` указывает на IP сервера.

---

## 11. SSL-сертификаты (Let's Encrypt) без email

Certbot попросит email для уведомлений. Чтобы не указывать email, используется флаг `--register-unsafely-without-email`.

Одна команда на все три домена:

```bash
sudo certbot --nginx \
  -d teledoska.com \
  -d www.teledoska.com \
  -d api.teledoska.com \
  -d admin.teledoska.com \
  --register-unsafely-without-email \
  --agree-tos \
  -n
```

- `-n` — неинтерактивный режим (для скриптов).
- При первом запуске без `-n` Certbot спросит согласие с условиями — выбери согласие.

Проверка: открой в браузере:

- https://teledoska.com  
- https://api.teledoska.com  
- https://admin.teledoska.com  

Автообновление сертификатов:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 12. Настройка бота в BotFather

В Telegram открой [@BotFather](https://t.me/BotFather).

1. **Домен Mini App**  
   `/setdomain` → выбери бота → введи: **teledoska.com** (без `https://`).

2. **Кнопка меню**  
   `/setmenubutton` → выбери бота → **Web app** → текст кнопки (например «Открыть приложение») → URL: **https://teledoska.com**.

После этого кнопка в боте будет открывать твоё приложение по HTTPS.

---

## 13. Проверка и логи

- **Сайт:** https://teledoska.com  
- **Админка:** https://admin.teledoska.com → вход по паролю из `ADMIN_PASSWORD` в `admin/.env`.  
- **API:** `curl -s https://api.teledoska.com/stats/users-count` (без ключа вернёт 401 — это нормально).

Логи:

```bash
pm2 logs
pm2 logs backend
pm2 logs bot
pm2 logs frontend
docker logs miniapp-admin-api -f
```

---

## 14. Краткий чеклист

- [ ] Сервер обновлён, установлены Node.js 20, Nginx, Certbot, PostgreSQL, Docker  
- [ ] DNS: A-записи для `teledoska.com`, `api.teledoska.com`, `admin.teledoska.com` → IP сервера  
- [ ] Проект в `/var/www/miniapp-bot`, заполнены `backend/.env`, `bot/.env`, `frontend/.env.production`, `admin/.env`  
- [ ] В `backend/.env`: `ADMIN_API_KEY`; в `admin/.env`: `BACKEND_ADMIN_API_KEY` совпадает с ним  
- [ ] PostgreSQL запущен, пользователь и база созданы, миграции выполнены  
- [ ] Backend, bot, frontend собраны и запущены через PM2; админка в Docker  
- [ ] Nginx: три конфига включены, `nginx -t` без ошибок  
- [ ] Certbot выполнен для всех доменов (SSL без email)  
- [ ] В BotFather заданы `/setdomain` и `/setmenubutton` для **teledoska.com**

---

## 15. Если домен один, но без поддоменов (только teledoska.com)

Можно всё вешать на один домен разными путями:

- **teledoska.com** — мини-приложение (frontend).  
- **teledoska.com/api** — прокси на бэкенд (например `proxy_pass http://127.0.0.1:3001/` с обрезкой префикса).  
- **teledoska.com/admin** — прокси на админку (например `proxy_pass http://127.0.0.1:5000/`).

Тогда в frontend нужно задать:

- `NEXT_PUBLIC_API_URL=https://teledoska.com/api`  
- `NEXT_PUBLIC_CONTENT_API_URL=https://teledoska.com/api` (если админка отдаёт контент по тому же префиксу) или отдельный путь, например `https://teledoska.com/admin-api`.

Админка и бэкенд должны быть настроены так, чтобы знать свой внешний URL (например `ADMIN_PUBLIC_BASE_URL=https://teledoska.com/admin`). Такой вариант возможен, но конфиг Nginx и приложений усложняется; рекомендуемый вариант — поддомены **api** и **admin** как в разделах выше.

---

## 16. Обновление после изменений в коде

```bash
cd /var/www/miniapp-bot
git pull

cd backend && npm ci && npm run build && cd ..
cd bot && npm ci && npm run build && cd ..
cd frontend && npm ci && npm run build && cd ..

pm2 restart backend bot frontend

cd admin && docker compose up -d --build
```

При появлении новых миграций:

```bash
cd /var/www/miniapp-bot/backend && npm run migration:run
```

---

## 17. Устранение неполадок

### Backend: `password authentication failed for user "postgres"`

Бэкенд не может подключиться к PostgreSQL: пароль в `backend/.env` не совпадает с паролем пользователя `postgres` в БД.

**Что сделать на сервере:**

1. Проверь, какой пароль задан в `backend/.env`:
   ```bash
   grep DB_ /var/www/miniapp-bot/backend/.env
   ```

2. Задай в PostgreSQL тот же пароль для пользователя `postgres` (подставь пароль из `DB_PASSWORD`):
   ```bash
   sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'ТВОЙ_ПАРОЛЬ_ИЗ_backend/.env';"
   ```
   Либо смени пароль в `backend/.env` на тот, который уже задан в PostgreSQL (если помнишь его).

3. Если пользователь `postgres` не создавался вручную (шаг 4), создай его и базу:
   ```bash
   sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'твой_надёжный_пароль';"
   sudo -u postgres psql -c "ALTER USER postgres WITH CREATEDB;"
   sudo -u postgres createdb -O postgres miniapp_bot
   ```
   Затем в `backend/.env` укажи этот же пароль в `DB_PASSWORD=...`.

4. Перезапусти бэкенд:
   ```bash
   pm2 restart backend
   pm2 logs backend --lines 30
   ```

**Если пароль в `backend/.env` и в PostgreSQL совпадает, но ошибка остаётся:** PM2 запускает процесс из корня проекта (`/var/www/miniapp-bot`), и по умолчанию приложение искало файл `.env` в корне, а не в `backend/.env`, поэтому использовался дефолтный пароль `postgres`. В коде бэкенда исправлено: `.env` загружается из папки `backend/`. Выполни на сервере обновление, пересборку и перезапуск:

   ```bash
   cd /var/www/miniapp-bot && git pull
   cd backend && npm ci && npm run build && cd ..
   pm2 restart backend
   pm2 logs backend --lines 30
   ```

Ошибка появляется, когда в браузере загружена старая версия приложения, а на сервере уже новая сборка (другие ID Server Actions).

**Что сделать:**

1. На сервере — пересобрать фронт и перезапустить:
   ```bash
   cd /var/www/miniapp-bot/frontend
   rm -rf .next
   npm run build
   pm2 restart frontend
   ```

2. У пользователей — обновить страницу с полной перезагрузкой кэша: **Ctrl+Shift+R** (или Cmd+Shift+R на Mac). Либо очистить кэш сайта для домена в настройках браузера.
