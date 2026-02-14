import path from 'path';
import { Bot, Keyboard } from 'grammy';
import * as dotenv from 'dotenv';

// Загружаем .env из папки bot (важно при запуске через PM2 из корня проекта)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'http://localhost:3000';
const botConfigApiUrl =
  process.env.BOT_CONFIG_API_URL || 'http://127.0.0.1:5000/api/datasets/botConfig';

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

type BotConfigPayload = {
  welcomeMessage?: string;
  welcomePhotoUrl?: string | null;
};

let cachedBotConfig: BotConfigPayload | null = null;
let cachedBotConfigAt = 0;

async function loadBotConfig(): Promise<BotConfigPayload> {
  const now = Date.now();
  if (cachedBotConfig && now - cachedBotConfigAt < 30_000) {
    return cachedBotConfig;
  }

  try {
    const response = await fetch(botConfigApiUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`bot config http ${response.status}`);
    }
    const data = (await response.json()) as { payload?: BotConfigPayload };
    cachedBotConfig = data?.payload || {};
    cachedBotConfigAt = now;
    return cachedBotConfig;
  } catch (error) {
    console.error('Failed to load bot config, using fallback:', error);
    return {};
  }
}

bot.command('start', async (ctx) => {
  const config = await loadBotConfig();
  const defaultMessage = isHttps
    ? 'Привет! Это Telegram Mini App бот. Нажми кнопку ниже, чтобы открыть мини‑приложение.'
    : 'Привет! Это Telegram Mini App бот.\n\n⚠️ Для работы mini‑app нужен HTTPS. Локально открой http://localhost:3000 в браузере.';

  const message = (config?.welcomeMessage || '').trim() || defaultMessage;
  const photoUrl = (config?.welcomePhotoUrl || '').trim();

  if (photoUrl) {
    try {
      await ctx.replyWithPhoto(photoUrl, {
        caption: message,
        reply_markup: createStartKeyboard(),
      });
      return;
    } catch (error) {
      console.error('Failed to send welcome photo, fallback to text:', error);
    }
  }

  await ctx.reply(message, {
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
bot.catch((err) => {
  const { ctx, error: e } = err;
  console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`);
  if (e instanceof Error) {
    console.error('Ошибка:', e.message);
  } else {
    console.error('Неизвестная ошибка:', e);
  }
});

bot.start();

console.log('Bot started');
if (!isHttps) {
  console.warn('⚠️  WEBAPP_URL не HTTPS. Кнопка Web App будет заменена на обычную кнопку.');
  console.warn('   Для полноценной работы mini‑app используй HTTPS URL на сервере.');
}
