import path from 'path';
import { Bot, Keyboard } from 'grammy';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const token = process.env.BOT_TOKEN;
const defaultWebAppUrl = process.env.WEBAPP_URL || 'http://localhost:3000';
const botConfigApiUrl =
  process.env.BOT_CONFIG_API_URL || 'http://127.0.0.1:5000/api/datasets/botConfig';

if (!token) {
  console.error('BOT_TOKEN не задан. Создайте файл .env и укажите BOT_TOKEN=...');
  process.exit(1);
}

const bot = new Bot(token);

function getWebAppUrl(config: BotConfigPayload): string {
  const url = (config?.webAppUrl || '').trim() || defaultWebAppUrl;
  return url;
}

function isHttps(url: string): boolean {
  return url.startsWith('https://');
}

function createStartKeyboard(config: BotConfigPayload) {
  const webAppUrl = getWebAppUrl(config);
  const hasSupport = Boolean((config?.supportLink || '').trim());

  if (isHttps(webAppUrl)) {
    const kb = new Keyboard().webApp('Открыть приложение', webAppUrl);
    if (hasSupport) {
      kb.row().text('Поддержка');
    }
    return kb.resized();
  }
  const kb = new Keyboard().text('Открыть приложение (локально)');
  if (hasSupport) {
    kb.row().text('Поддержка');
  }
  return kb.resized();
}

type BotConfigPayload = {
  welcomeMessage?: string;
  welcomePhotoUrl?: string | null;
  webAppUrl?: string | null;
  supportLink?: string | null;
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
  const webAppUrl = getWebAppUrl(config);
  const defaultMessage = isHttps(webAppUrl)
    ? 'Привет! Нажми кнопку ниже, чтобы открыть приложение.'
    : 'Привет!\n\n⚠️ Для работы приложения нужен HTTPS. Локально открой ссылку в браузере.';

  const message = (config?.welcomeMessage || '').trim() || defaultMessage;
  const photoUrl = (config?.welcomePhotoUrl || '').trim();

  if (photoUrl) {
    try {
      await ctx.replyWithPhoto(photoUrl, {
        caption: message,
        reply_markup: createStartKeyboard(config),
      });
      return;
    } catch (error) {
      console.error('Failed to send welcome photo, fallback to text:', error);
    }
  }

  await ctx.reply(message, {
    reply_markup: createStartKeyboard(config),
  });
});

bot.on('message:text', async (ctx) => {
  const config = await loadBotConfig();
  const webAppUrl = getWebAppUrl(config);

  if (ctx.message.text === 'Открыть приложение (локально)') {
    await ctx.reply(
      `Для локальной разработки открой в браузере:\n${webAppUrl}\n\nНа сервере с HTTPS кнопка будет работать автоматически.`,
    );
    return;
  }
  if (ctx.message.text === 'Поддержка') {
    const support = (config?.supportLink || '').trim();
    if (support) {
      const text = support.startsWith('http')
        ? `Поддержка: ${support}`
        : support.startsWith('@')
          ? `Поддержка: ${support}`
          : `Поддержка: ${support}`;
      await ctx.reply(text);
      return;
    }
    await ctx.reply('Ссылка на поддержку не настроена.');
    return;
  }
  await ctx.reply(`Вы написали: ${ctx.message.text}`);
});

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
if (!isHttps(defaultWebAppUrl)) {
  console.warn('⚠️  WEBAPP_URL не HTTPS. Кнопка Web App будет заменена на обычную кнопку.');
  console.warn('   Для полноценной работы приложения используй HTTPS URL на сервере или настрой webAppUrl в админке.');
}
