import { getTelegramWebApp } from "@/shared/api/client";

export type TelegramProfile = {
  username: string;
  userId: string;
  avatarUrl: string;
};

const isDev =
  typeof process !== "undefined" &&
  typeof process.env !== "undefined" &&
  process.env.NODE_ENV !== "production";

function logTelegramProfileDebug(message: string, extra?: unknown) {
  if (!isDev) return;
  // eslint-disable-next-line no-console
  console.log(`[profile][tg] ${message}`, extra);
}

export function getInitialTelegramProfile(): TelegramProfile {
  const fallback: TelegramProfile = {
    username: "user",
    userId: "-",
    avatarUrl: "/assets/telegram-ico.svg",
  };

  const telegram = getTelegramWebApp();
  if (!telegram) {
    logTelegramProfileDebug("getInitialTelegramProfile: no Telegram WebApp instance");
    return fallback;
  }

  const user = telegram?.initDataUnsafe?.user;
  if (!user) {
    logTelegramProfileDebug("getInitialTelegramProfile: initDataUnsafe.user is missing", {
      initDataUnsafe: telegram.initDataUnsafe,
    });
    return fallback;
  }

  const rawId = "id" in user ? (user as { id: number | string }).id : undefined;
  const userId =
    rawId != null && String(rawId).trim() !== "" && String(rawId).trim() !== "0"
      ? String(rawId).trim()
      : undefined;
  const username = "username" in user ? user.username || "" : "";
  const firstName = "first_name" in user ? user.first_name || "" : "";
  const displayName = username || firstName || "user";
  const avatarByUsername = username
    ? `https://t.me/i/userpic/320/${username}.jpg`
    : "/assets/telegram-ico.svg";
  const photoUrl = "photo_url" in user ? user.photo_url : undefined;

  if (!userId) {
    logTelegramProfileDebug("getInitialTelegramProfile: invalid or empty userId", {
      rawId,
      user,
    });
  } else {
    logTelegramProfileDebug("getInitialTelegramProfile: resolved telegram user", {
      userId,
      username,
    });
  }

  return {
    username: displayName,
    userId: userId ?? "-",
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
