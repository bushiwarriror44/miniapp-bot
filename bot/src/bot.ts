import path from 'path';
import { Bot, Keyboard, InlineKeyboard } from 'grammy';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const token = process.env.BOT_TOKEN;
const defaultWebAppUrl = process.env.WEBAPP_URL || 'http://localhost:3000';
const botConfigApiUrl =
  process.env.BOT_CONFIG_API_URL || 'http://127.0.0.1:5000/api/datasets/botConfig';
const backendApiUrl =
  (process.env.BACKEND_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const botApiKey = (process.env.BOT_API_KEY || '').trim();

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

/** Inline-кнопка для WebApp — передаёт initData. Reply Keyboard не передаёт initData. */
function createStartInlineKeyboard(config: BotConfigPayload) {
  const webAppUrl = getWebAppUrl(config);
  if (!isHttps(webAppUrl)) return null;
  return new InlineKeyboard().webApp('Открыть приложение', webAppUrl);
}

/** Reply-клавиатура для Верификация / Поддержка. */
function createStartKeyboard(config: BotConfigPayload) {
  const webAppUrl = getWebAppUrl(config);
  const hasSupport = Boolean((config?.supportLink || '').trim());

  if (isHttps(webAppUrl)) {
    const kb = new Keyboard().text('Верификация');
    if (hasSupport) {
      kb.row().text('Поддержка');
    }
    return kb.resized();
  }
  const kb = new Keyboard().text('Открыть приложение (локально)');
  kb.row().text('Верификация');
  if (hasSupport) {
    kb.row().text('Поддержка');
  }
  return kb.resized();
}

function createShareContactKeyboard() {
  return new Keyboard()
    .requestContact('Поделиться номером')
    .row()
    .text('Отмена')
    .resized();
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

async function backendTrackUser(ctx: any) {
  const from = ctx?.from;
  if (!from?.id) return;
  try {
    await fetch(`${backendApiUrl}/users/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: String(from.id),
        username: from.username ?? null,
        firstName: from.first_name ?? null,
        lastName: from.last_name ?? null,
        languageCode: from.language_code ?? null,
        isPremium: Boolean(from.is_premium),
      }),
    });
  } catch {
    // ignore
  }
}

async function backendGetProfile(telegramId: string) {
  const res = await fetch(
    `${backendApiUrl}/users/me/profile?telegramId=${encodeURIComponent(telegramId)}`,
    { method: 'GET', headers: { Accept: 'application/json' } },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const msg =
      data && typeof data.error === 'string'
        ? data.error
        : `backend http ${res.status}`;
    throw new Error(msg);
  }
  return data?.profile ?? null;
}

async function backendVerifyPhone(telegramId: string, phoneNumber: string) {
  if (!botApiKey) {
    throw new Error('BOT_API_KEY is not configured');
  }
  const res = await fetch(
    `${backendApiUrl}/users/me/verify-phone?telegramId=${encodeURIComponent(telegramId)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Key': botApiKey,
      },
      body: JSON.stringify({ phoneNumber }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const msg =
      data && typeof data.message === 'string'
        ? data.message
        : `verify http ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

bot.command('start', async (ctx) => {
  await backendTrackUser(ctx);
  const config = await loadBotConfig();
  const webAppUrl = getWebAppUrl(config);
  const defaultMessage = isHttps(webAppUrl)
    ? 'Привет! Нажми кнопку ниже, чтобы открыть приложение.'
    : 'Привет!\n\n⚠️ Для работы приложения нужен HTTPS. Локально открой ссылку в браузере.';

  const message = (config?.welcomeMessage || '').trim() || defaultMessage;
  const photoUrl = (config?.welcomePhotoUrl || '').trim();

  const inlineKb = createStartInlineKeyboard(config);
  const replyKb = createStartKeyboard(config);

  if (photoUrl) {
    try {
      await ctx.replyWithPhoto(photoUrl, {
        caption: message,
        reply_markup: inlineKb ?? replyKb,
      });
      if (inlineKb) {
        await ctx.reply('Дополнительно:', { reply_markup: replyKb });
      }
      return;
    } catch (error) {
      console.error('Failed to send welcome photo, fallback to text:', error);
    }
  }

  await ctx.reply(message, {
    reply_markup: inlineKb ?? replyKb,
  });
  if (inlineKb) {
    await ctx.reply('Дополнительно:', { reply_markup: replyKb });
  }
});

bot.on('message:text', async (ctx) => {
  await backendTrackUser(ctx);
  const config = await loadBotConfig();
  const webAppUrl = getWebAppUrl(config);

  if (ctx.message.text === 'Открыть приложение (локально)') {
    await ctx.reply(
      `Для локальной разработки открой в браузере:\n${webAppUrl}\n\nНа сервере с HTTPS кнопка будет работать автоматически.`,
    );
    return;
  }
  if (ctx.message.text === 'Отмена') {
    await ctx.reply('Ок. Возвращаю в меню.', {
      reply_markup: createStartKeyboard(config),
    });
    return;
  }
  if (ctx.message.text === 'Верификация') {
    const telegramId = String(ctx.from?.id || '').trim();
    if (!telegramId) {
      await ctx.reply('Не удалось определить пользователя.');
      return;
    }
    try {
      const profile = await backendGetProfile(telegramId);
      if (profile?.verified) {
        await ctx.reply('Ваш аккаунт уже верифицирован.', {
          reply_markup: createStartKeyboard(config),
        });
        return;
      }
      await ctx.reply(
        'Чтобы пройти верификацию, поделитесь номером телефона, привязанным к вашему Telegram-аккаунту.',
        { reply_markup: createShareContactKeyboard() },
      );
    } catch (error) {
      await ctx.reply(
        `Не удалось проверить статус верификации. Попробуйте позже.`,
        { reply_markup: createStartKeyboard(config) },
      );
    }
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

bot.on('message:contact', async (ctx) => {
  await backendTrackUser(ctx);
  if (ctx.message?.contact?.user_id && ctx.from?.id) {
    if (ctx.message.contact.user_id !== ctx.from.id) {
      await ctx.reply('Пожалуйста, отправьте номер телефона именно вашего аккаунта.', {
        reply_markup: createStartKeyboard(await loadBotConfig()),
      });
      return;
    }
  }

  const telegramId = String(ctx.from?.id || '').trim();
  const phone = String(ctx.message?.contact?.phone_number || '').trim();
  if (!telegramId || !phone) {
    await ctx.reply('Не удалось получить номер телефона. Попробуйте снова.', {
      reply_markup: createStartKeyboard(await loadBotConfig()),
    });
    return;
  }

  try {
    await backendVerifyPhone(telegramId, phone);
    await ctx.reply('Верификация успешно пройдена. Теперь ваш аккаунт отмечен как верифицированный.', {
      reply_markup: createStartKeyboard(await loadBotConfig()),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Не удалось выполнить верификацию.';
    await ctx.reply(`Ошибка верификации: ${msg}`, {
      reply_markup: createStartKeyboard(await loadBotConfig()),
    });
  }
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
