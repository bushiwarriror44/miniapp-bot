## Структура монорепозитория miniapp-bot

Один репозиторий: `frontend`, `backend` и `bot` — обычные папки, без git-сабмодулей. Если где-то остались сабмодули или вложенные `.git`, выполни из корня проекта:
- **Windows:** `.\deploy\remove-submodules.ps1`
- **Linux/macOS:** `./deploy/remove-submodules.sh`

- `frontend` — Next.js + TypeScript, Tailwind CSS, интеграция с Telegram Mini Apps SDK и TanStack Query.
- **Деплой на сервер:** пошаговая инструкция в [DEPLOY.md](./DEPLOY.md). В папке [deploy/](./deploy/) — примеры конфигов Nginx.
- `backend` — NestJS + PostgreSQL (через TypeORM).
- `bot` — Telegram Bot на GrammY, который работает с Bot API.

### Frontend (`frontend`)

- `src/app` — корневой layout и страницы мини‑приложения.
- `src/shared/api` — клиент TanStack Query и обёртка над Telegram WebApp SDK.
- Важные зависимости: `next`, `react`, `tailwindcss`, `@twa-dev/sdk`, `@tanstack/react-query`.

**Локальная разработка:**
```bash
# Из корня проекта
npm run dev
# или
npm run dev:frontend

# Либо из папки frontend
cd frontend && npm install && npm run dev
```
Откроется [http://localhost:3000](http://localhost:3000). Для запросов к API создай `frontend/.env.local` с `NEXT_PUBLIC_API_URL=http://localhost:3001` (если бэкенд запущен локально).

### Backend (`backend`)

- `src/app.module.ts` — подключение `TypeOrmModule.forRoot` с PostgreSQL.
- Переменные окружения для БД:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (по умолчанию `miniapp_bot`).
  - `PORT` — порт NestJS (по умолчанию `3000`, в примере `.env.example` — `3001`).

### Bot (`bot`)

- `src/bot.ts` — стартовый файл Telegram‑бота на GrammY.
- Скрипты:
  - `npm run dev` — запуск бота в dev‑режиме (`ts-node-dev`).
  - `npm run build` / `npm start` — сборка и запуск из `dist`.
- Переменные окружения:
  - `BOT_TOKEN` — токен Telegram‑бота.
  - `WEBAPP_URL` — публичный URL мини‑приложения.
    - **Локально**: можно использовать `http://localhost:3000` (бот покажет обычную кнопку вместо Web App).
    - **На сервере**: обязательно `https://miniapp.твой-домен.com` (только HTTPS, Telegram требует это для Web App кнопок).

