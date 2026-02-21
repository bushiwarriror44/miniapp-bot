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
