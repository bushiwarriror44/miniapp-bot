const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");

type TrackTelegramUserPayload = {
  telegramId: string | number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  isPremium?: boolean;
};

export type FavoriteAdItem = {
  id: string;
  adType: "post_in_channel" | "post_in_chat";
  channelOrChatLink: string;
  imageUrl: string | null;
  verified: boolean;
  username: string;
  price: number;
  pinned: boolean;
  underGuarantee: boolean;
  publishTime: string;
  postDuration: string;
  paymentMethod: "card" | "crypto";
  theme: string;
  description: string;
  publishedAt: string;
};

export async function trackTelegramUser(payload: TrackTelegramUserPayload): Promise<void> {
  await fetch(`${API_BASE}/users/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export type UserProfileResponse = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  verified: boolean;
  rating: {
    auto: number;
    manualDelta: number;
    total: number;
  };
  statistics: {
    ads: { active: number; completed: number; hidden: number };
    deals: { total: number; successful: number; disputed: number };
    profileViews: { week: number; month: number };
  };
  daysInProject: number;
};

export type UserStatisticsResponse = {
  ads: { active: number; completed: number; hidden: number };
  deals: { total: number; successful: number; disputed: number };
  profileViews: { week: number; month: number };
};

export async function fetchUserProfile(telegramId: string | number): Promise<UserProfileResponse | null> {
  const res = await fetch(`${API_BASE}/users/me/profile?telegramId=${encodeURIComponent(String(telegramId))}`);
  if (!res.ok) {
    throw new Error(`Failed to load profile: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.profile ?? null;
}

export async function fetchUserStatistics(
  telegramId: string | number,
): Promise<UserStatisticsResponse | null> {
  const res = await fetch(`${API_BASE}/users/me/statistics?telegramId=${encodeURIComponent(String(telegramId))}`);
  if (!res.ok) {
    throw new Error(`Failed to load statistics: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.statistics ?? null;
}

export async function fetchUserFavorites(
  telegramId: string | number,
): Promise<FavoriteAdItem[]> {
  const res = await fetch(`${API_BASE}/users/me/favorites?telegramId=${encodeURIComponent(String(telegramId))}`);
  if (!res.ok) {
    throw new Error(`Failed to load favorites: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return Array.isArray(data.favorites) ? data.favorites : [];
}
