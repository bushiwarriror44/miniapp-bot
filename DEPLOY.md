# Деплой miniapp-bot на сервер

Инструкция для развёртывания на **пустом** VPS (Ubuntu 22.04). Предполагается, что у тебя есть домен и его DNS указывает на IP сервера.

---

## 1. Подготовка сервера

Подключись по SSH и обнови систему:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Установка Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # должно быть v20.x
```

---

## 3. Установка Nginx и Certbot (SSL)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 4. Загрузка проекта на сервер

**Вариант A — через Git (если репозиторий уже на GitHub/GitLab):**

```bash
cd /var/www
sudo mkdir -p miniapp-bot && sudo chown $USER:$USER miniapp-bot
cd miniapp-bot
git clone https://github.com/ТВОЙ_ЮЗЕР/ТВОЙ_РЕПО.git .
```

**Вариант B — через SCP с твоего компьютера (из папки с проектом):**

```bash
# На твоём ПК (в папке miniapp-bot):
scp -r . user@IP_СЕРВЕРА:/var/www/miniapp-bot/
```

На сервере после загрузки:

```bash
cd /var/www/miniapp-bot
```

---

## 5. Установка PostgreSQL (автоматически, пароль из .env)

Создай `backend/.env` из примера и укажи в нём хотя бы `DB_PASSWORD` (остальное можно оставить по умолчанию):

```bash
cd /var/www/miniapp-bot
cp backend/.env.example backend/.env
nano backend/.env   # задай DB_USER, DB_PASSWORD, DB_NAME
```

Запусти скрипт — он установит PostgreSQL и создаст пользователя из `backend/.env`:

```bash
chmod +x deploy/setup-postgres.sh
./deploy/setup-postgres.sh
```

Скрипт установит PostgreSQL, включит и запустит сервис, создаст пользователя с правом `CREATEDB`. Базу `miniapp_bot` бэкенд создаст сам при первом запуске.

---

## 6. Переменные окружения на сервере

### Backend — `backend/.env`

На сервере измени в `backend/.env` по сравнению с локальной версией:

| Переменная   | Локально        | На сервере                          |
|-------------|-----------------|-------------------------------------|
| `NODE_ENV`  | `development`   | **`production`**                    |
| `PORT`      | `3001`          | `3001` (или другой, если занят)    |
| `DB_HOST`   | `localhost`     | `localhost` (если БД на том же сервере) |
| `DB_PORT`   | `5432`          | `5432`                              |
| `DB_USER`   | `postgres`      | `miniapp` или `postgres`            |
| `DB_PASSWORD` | `postgres`    | **надёжный пароль** (тот же, что в шаге 5) |
| `DB_NAME`   | `miniapp_bot`   | `miniapp_bot`                       |

**Пример `backend/.env` на сервере** (после шага 5 скрипта — пользователь и пароль уже заданы):

```env
NODE_ENV=production
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_USER=miniapp
DB_PASSWORD=придумай_надёжный_пароль
DB_NAME=miniapp_bot
```

Главное: поставь **`NODE_ENV=production`** и используй **надёжный `DB_PASSWORD`** (тот же, что указал при запуске `./deploy/setup-postgres.sh`). Если БД на другом хосте — поменяй `DB_HOST` (и при необходимости порт).

**Bot** — `bot/.env`:

```env
BOT_TOKEN=токен_от_BotFather
WEBAPP_URL=https://miniapp.ТВОЙ_ДОМЕН.com
```

**Frontend** — `frontend/.env.production` (или `.env.local`):

```env
NEXT_PUBLIC_API_URL=https://api.ТВОЙ_ДОМЕН.com
```

Замени `ТВОЙ_ДОМЕН.com` на реальный домен (например `mybot.com`). Тогда:
- mini app: `https://miniapp.mybot.com`
- API: `https://api.mybot.com`

### Если нет домена (только IP сервера)

Telegram для кнопки Mini App принимает **только HTTPS**. По одному IP без домена кнопка «Открыть приложение» работать не будет.

**Варианты:**

1. **Бесплатный «домен» по IP — nip.io**  
   Имя вида `miniapp.192.168.1.10.nip.io` автоматически резолвится в указанный IP. Подставь свой IP:
   - Mini app: `https://miniapp.ТВОЙ_IP.nip.io` (например `https://miniapp.123.45.67.89.nip.io`)
   - API: `https://api.ТВОЙ_IP.nip.io`  
   В Nginx укажи `server_name miniapp.ТВОЙ_IP.nip.io` и `api.ТВОЙ_IP.nip.io`, затем получи серты:  
   `sudo certbot --nginx -d miniapp.ТВОЙ_IP.nip.io -d api.ТВОЙ_IP.nip.io`  
   В Bot: `WEBAPP_URL=https://miniapp.ТВОЙ_IP.nip.io`. В BotFather: `/setdomain` → `miniapp.ТВОЙ_IP.nip.io`, `/setmenubutton` → Web app → этот же URL.

2. **Бесплатный поддомен (DuckDNS, No-IP и т.п.)**  
   Зарегистрируй поддомен, привяжи его к IP сервера, настрой Nginx и Certbot на это имя и используй его в Bot и BotFather так же, как в таблице выше.

3. **Только бот, без Mini App**  
   Если мини-приложение пока не нужно, в `bot/.env` достаточно:
   ```env
   BOT_TOKEN=токен_от_BotFather
   ```
   Переменную `WEBAPP_URL` можно не задавать или оставить пустой — бот будет отвечать в чате, кнопка «Открыть приложение» не появится (или будет подсказка про HTTPS).

---

## 7. Сборка и запуск через PM2

Установи PM2 глобально:

```bash
sudo npm install -g pm2
```

Сборка:

```bash
cd /var/www/miniapp-bot

# Backend
cd backend && npm ci && npm run build && cd ..

# Bot
cd bot && npm ci && npm run build && cd ..

# Frontend
cd frontend && npm ci && npm run build && cd ..
```

Запуск всех процессов:

```bash
cd /var/www/miniapp-bot

pm2 start backend/dist/main.js --name backend -i 1
pm2 start bot/dist/bot.js --name bot -i 1
pm2 start npm --name frontend -- start --prefix frontend

pm2 save
pm2 startup   # выполни команду, которую выведет pm2 (sudo ...)
```

Проверка:

```bash
pm2 status
pm2 logs
```

---

## 8. Nginx: домены и SSL

Замени `miniapp.example.com` и `api.example.com` на свои домены.

**Mini App (frontend):**

```bash
sudo nano /etc/nginx/sites-available/miniapp
```

Вставь (подставь свой домен):

```nginx
server {
    listen 80;
    server_name miniapp.example.com;

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

**API (backend):**

```bash
sudo nano /etc/nginx/sites-available/api
```

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Включи сайты и получи SSL:

```bash
sudo ln -s /etc/nginx/sites-available/miniapp /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

sudo certbot --nginx -d miniapp.example.com -d api.example.com
```

Certbot сам настроит HTTPS и редиректы.

---

## 9. Настройка бота в BotFather

В Telegram у [@BotFather](https://t.me/BotFather):

1. **Домен mini app:**  
   `/setdomain` → выбери бота → введи: `miniapp.example.com` (без `https://`).

2. **Кнопка меню:**  
   `/setmenubutton` → выбери бота → **Web app** → текст кнопки (например «Открыть приложение») → URL: `https://miniapp.example.com`.

После этого кнопка «Открыть мини‑приложение» в боте будет открывать твой Next.js mini app по HTTPS.

---

## 10. Краткий чеклист

- [ ] Сервер обновлён, установлены Node.js 20, Nginx, certbot
- [ ] Проект загружен, создан `backend/.env`, выполнен `./deploy/setup-postgres.sh` (PostgreSQL и пользователь созданы из .env)
- [ ] Проект загружен в `/var/www/miniapp-bot`
- [ ] В `backend/.env`, `bot/.env`, `frontend/.env.production` указаны правильные значения и домены
- [ ] Выполнены `npm ci` и `npm run build` в `backend`, `bot`, `frontend`
- [ ] Запущены процессы через PM2, `pm2 save` и `pm2 startup`
- [ ] В Nginx созданы конфиги для `miniapp.example.com` и `api.example.com`, запущен `certbot`
- [ ] В BotFather заданы `/setdomain` и `/setmenubutton` с твоим доменом

---

## Обновление после изменений в коде

```bash
cd /var/www/miniapp-bot
git pull   # если используешь Git

cd backend && npm ci && npm run build && cd ..
cd bot && npm ci && npm run build && cd ..
cd frontend && npm ci && npm run build && cd ..

pm2 restart backend bot frontend
```

Если что-то пойдёт не так — смотри логи: `pm2 logs` или `pm2 logs backend`, `pm2 logs bot`, `pm2 logs frontend`.

---

## Admin API (JSON -> SQLite) через Docker

Для текущего фронтенда данные (`ads`, `jobs`, `services`, и т.д.) теперь могут отдаваться из `admin`-сервиса из БД.

### Запуск

```bash
cd /var/www/miniapp-bot/admin
docker compose up -d --build
```

Проверка:

```bash
curl http://127.0.0.1:5000/api/health
curl http://127.0.0.1:5000/api/datasets
curl http://127.0.0.1:5000/api/datasets/ads
```

### Как это работает

- При первом запуске сервис создает SQLite в `admin/data/app.db`
- Автоматически импортирует JSON из `frontend/src/shared/data/*.json` в таблицу `datasets`
- Дальше фронтенд читает через `GET /api/datasets/<name>`

### Переменная фронтенда

В `frontend/.env.production` добавь:

```env
NEXT_PUBLIC_CONTENT_API_URL=https://miniapp.ТВОЙ_ДОМЕН.com/api
```

Для локалки можно:

```env
NEXT_PUBLIC_CONTENT_API_URL=http://localhost:5000/api
```

Если API недоступно, фронтенд автоматически использует fallback на локальные JSON.

---

## Ошибка 500 на `/_next/static/chunks/...` (в т.ч. turbopack-*.js)

Если в браузере запросы к статике Next.js возвращают **500** и в URL видно **turbopack-*.js** — значит на сервере отдаётся режим **разработки** (`next dev`) или билд не используется. В production должен работать только **собранный** фронт (`next build` + `next start`).

**Что сделать на сервере:**

1. Остановить фронт и сделать чистый production-билд:
   ```bash
   cd /var/www/miniapp-bot
   pm2 stop frontend

   cd frontend
   rm -rf .next
   npm ci
   npm run build
   ```

2. Запустить именно **production**-сервер (не `npm run dev`):
   ```bash
   pm2 start npm --name frontend -- start --prefix /var/www/miniapp-bot/frontend
   pm2 save
   ```

3. Проверить, что в PM2 для frontend указана команда **start**, а не **dev**:
   ```bash
   pm2 show frontend
   ```
   В «script path» должно быть `npm`, в «exec cwd» — путь к `frontend`, аргументы — `start --prefix ...`. Если там было `dev`, перезапусти как в шаге 2.
