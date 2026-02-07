import { Bot, Keyboard } from 'grammy';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'http://localhost:3000';

if (!token) {
  console.error('BOT_TOKEN не задан. Создайте файл .env и укажите BOT_TOKEN=...');
  process.exit(1);
}

const bot = new Bot(token);

// Проверяем, является ли URL HTTPS (Telegram требует только HTTPS для Web App)
const isHttps = webAppUrl.startsWith('https://');

// Создаём клавиатуру только если URL HTTPS, иначе обычная кнопка или без кнопки
const createStartKeyboard = () => {
  if (isHttps) {
    return new Keyboard().webApp('Открыть мини‑приложение', webAppUrl).resized();
  }
  // Для локальной разработки (http/localhost) показываем обычную кнопку или без кнопки
  return new Keyboard().text('Открыть мини‑приложение (локально)').resized();
};

bot.command('start', (ctx) => {
  const message = isHttps
    ? 'Привет! Это Telegram Mini App бот. Нажми кнопку ниже, чтобы открыть мини‑приложение.'
    : 'Привет! Это Telegram Mini App бот.\n\n⚠️ Для работы mini‑app нужен HTTPS. Локально открой http://localhost:3000 в браузере.';

  ctx.reply(message, {
    reply_markup: createStartKeyboard(),
  });
});

bot.on('message:text', (ctx) => {
  // Если пользователь нажал кнопку "Открыть мини‑приложение (локально)"
  if (ctx.message.text === 'Открыть мини‑приложение (локально)') {
    ctx.reply(
      `Для локальной разработки открой в браузере:\n${webAppUrl}\n\nНа сервере с HTTPS кнопка будет работать автоматически.`,
    );
    return;
  }
  ctx.reply(`Вы написали: ${ctx.message.text}`);
});

// Обработчик ошибок, чтобы бот не падал
bot.catch = (err) => {
  const ctx = err.ctx;
  console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof Error) {
    console.error('Ошибка:', e.message);
  } else {
    console.error('Неизвестная ошибка:', e);
  }
};

bot.start();

console.log('Bot started');
if (!isHttps) {
  console.warn('⚠️  WEBAPP_URL не HTTPS. Кнопка Web App будет заменена на обычную кнопку.');
  console.warn('   Для полноценной работы mini‑app используй HTTPS URL на сервере.');
}
