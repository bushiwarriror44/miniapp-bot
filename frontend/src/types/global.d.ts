interface TelegramWebApp {
  ready: () => void;
  expand?: () => void;
  isVersionAtLeast?: (version: string) => boolean;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  close?: () => void;
  initDataUnsafe?: { user?: { first_name?: string; username?: string; id?: number } };
  /** Request user contact (phone). Bot API 6.9+. Returns promise with contact. */
  requestContact?: () => Promise<{ contact?: { phone_number?: string } }>;
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
