import { QueryClient } from '@tanstack/react-query';
import WebAppSDK from '@twa-dev/sdk';

export const queryClient = new QueryClient();

export const getTelegramWebApp = () => {
  if (typeof window === 'undefined') return null;

  if (window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }

  try {
    if (WebAppSDK) {
      WebAppSDK.ready();
      return WebAppSDK;
    }
  } catch {
  }

  return null;
};

