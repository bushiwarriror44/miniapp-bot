import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();

export const getTelegramWebApp = () => {
  if (typeof window === 'undefined') return null;
  
  if (window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  
  try {
    const WebApp = require('@twa-dev/sdk').default;
    if (WebApp) {
      WebApp.ready();
      return WebApp;
    }
  } catch {
  }
  
  return null;
};

