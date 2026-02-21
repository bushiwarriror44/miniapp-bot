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

  const username = user.username || "";
  const firstName = user.first_name || "";
  const displayName = username || firstName || "user";
  const avatarByUsername = username
    ? `https://t.me/i/userpic/320/${username}.jpg`
    : "/assets/telegram-ico.svg";

  return {
    username: displayName,
    userId: String(user.id ?? "-"),
    avatarUrl: user.photo_url || avatarByUsername,
  };
}
