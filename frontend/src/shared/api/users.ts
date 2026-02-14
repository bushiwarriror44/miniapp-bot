const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");

type TrackTelegramUserPayload = {
  telegramId: string | number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  isPremium?: boolean;
};

export async function trackTelegramUser(payload: TrackTelegramUserPayload): Promise<void> {
  await fetch(`${API_BASE}/users/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
