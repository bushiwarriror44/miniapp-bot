/** Telegram WebApp API, добавляется в мини-приложении */
interface TelegramWebApp {
  ready: () => void;
  initDataUnsafe?: { user?: { first_name?: string; username?: string } };
  [key: string]: unknown;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export {};
