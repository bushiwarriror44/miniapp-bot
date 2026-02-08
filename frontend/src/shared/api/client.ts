import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();

// Telegram WebApp SDK - используем глобальный объект, который Telegram добавляет автоматически
// или fallback на @twa-dev/sdk для локальной разработки
export const getTelegramWebApp = () => {
  if (typeof window === 'undefined') return null;
  
  // Telegram автоматически добавляет window.Telegram.WebApp в mini app
  if (window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  
  // Fallback для локальной разработки (если открываем в браузере напрямую)
  try {
    // @ts-ignore - может быть undefined в браузере без Telegram
    const WebApp = require('@twa-dev/sdk').default;
    if (WebApp) {
      WebApp.ready();
      return WebApp;
    }
  } catch {
    // Игнорируем ошибки импорта
  }
  
  return null;
};

