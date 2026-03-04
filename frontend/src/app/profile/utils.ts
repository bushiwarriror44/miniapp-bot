import { getTelegramWebApp } from "@/shared/api/client";

export type TelegramProfile = {
  username: string;
  userId: string;
  avatarUrl: string;
};

export function getInitialTelegramProfile(): TelegramProfile {
  const fallback: TelegramProfile = {
    username: "user",
    userId: "-",
    avatarUrl: "/assets/telegram-ico.svg",
  };

  const telegram = getTelegramWebApp();
  const user = telegram?.initDataUnsafe?.user;
  if (!user) return fallback;

  const userId = "id" in user ? (user as { id: number }).id : undefined;
  const username = "username" in user ? user.username || "" : "";
  const firstName = "first_name" in user ? user.first_name || "" : "";
  const displayName = username || firstName || "user";
  const avatarByUsername = username
    ? `https://t.me/i/userpic/320/${username}.jpg`
    : "/assets/telegram-ico.svg";
  const photoUrl = "photo_url" in user ? user.photo_url : undefined;

  return {
    username: displayName,
    userId: userId != null ? String(userId) : "-",
    avatarUrl: photoUrl || avatarByUsername,
  };
}

export function normalizePhoneNumber(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  let phone = String(raw).trim();
  if (!phone) return null;

  // remove spaces and common separators
  phone = phone.replace(/[\s-()]+/g, "");

  if (!phone.startsWith("+") && /^\d+$/.test(phone)) {
    phone = `+${phone}`;
  }

  return phone || null;
}

export function getTelegramPhoneFromInitData(): string | null {
  const telegram = getTelegramWebApp();
  const user = telegram?.initDataUnsafe
    ?.user as { phone_number?: string } | undefined;
  const raw = user?.phone_number;
  return normalizePhoneNumber(raw);
}

export async function requestTelegramPhoneWithFallback(): Promise<string | null> {
  const telegram = getTelegramWebApp();

  // Основной путь — запросить контакт у пользователя (Mini App / WebApp API)
  const requestContact = telegram && typeof (telegram as any).requestContact === "function"
    ? (telegram as any).requestContact
    : null;

  if (requestContact) {
    try {
      const result = await requestContact();
      const fromContact = normalizePhoneNumber(
        (result as { contact?: { phone_number?: string } })?.contact?.phone_number,
      );
      if (fromContact) {
        return fromContact;
      }
    } catch {
      // игнорируем и пробуем fallback
    }
  }

  // Fallback — попытаться вытащить номер из initData, если Telegram его передал
  const fromInitData = getTelegramPhoneFromInitData();
  if (fromInitData) {
    return fromInitData;
  }

  return null;
}

