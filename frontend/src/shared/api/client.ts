import { QueryClient } from '@tanstack/react-query';
import WebAppSDK from '@twa-dev/sdk';

export const queryClient = new QueryClient();

export const getTelegramWebApp = () => {
  if (typeof window === 'undefined') return null;

  // Всегда отдаём приоритет нативному Telegram WebApp, если он есть.
  if (window.Telegram?.WebApp) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[tg] getTelegramWebApp: using window.Telegram.WebApp', {
        platform: window.Telegram.WebApp.platform,
        version: window.Telegram.WebApp.version,
      });
    }
    return window.Telegram.WebApp;
  }

  // Фоллбек на SDK — актуален для окружений без window.Telegram.WebApp.
  try {
    if (WebAppSDK) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[tg] getTelegramWebApp: using @twa-dev/sdk fallback');
      }
      WebAppSDK.ready();
      return WebAppSDK;
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[tg] getTelegramWebApp: sdk fallback failed', err);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[tg] getTelegramWebApp: no Telegram WebApp instance available');
  }
  return null;
};

