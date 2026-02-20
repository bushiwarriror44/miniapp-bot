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

declare module "*.svg" {
  const value: string | { default?: string; src?: string };
  export default value;
}

export {};
