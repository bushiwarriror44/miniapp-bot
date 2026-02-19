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
  isScam: boolean;
  isBlocked: boolean;
  rating: {
    auto: number;
    manualDelta: number;
    total: number;
  };
  statistics: {
    ads: { active: number; completed: number; hidden: number; onModeration?: number };
    deals: { total: number; successful: number; disputed: number };
    profileViews: { week: number; month: number };
  };
  daysInProject: number;
};

export type UserStatisticsResponse = {
  ads: { active: number; completed: number; hidden: number; onModeration?: number };
  deals: { total: number; successful: number; disputed: number };
  profileViews: { week: number; month: number };
};

export type MyPublicationItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  section: string;
  formData: Record<string, unknown>;
  createdAt: string;
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

export async function fetchMyPublications(
  telegramId: string | number,
): Promise<MyPublicationItem[]> {
  const res = await fetch(`${API_BASE}/users/me/publications?telegramId=${encodeURIComponent(String(telegramId))}`);
  if (!res.ok) {
    throw new Error(`Failed to load publications: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return Array.isArray(data.publications) ? data.publications : [];
}

export type ListUserItem = {
  id: string;
  telegramId: string;
  username: string | null;
  verified: boolean;
  isScam: boolean;
  isBlocked: boolean;
  ratingTotal: number;
  ratingAuto: number;
  ratingManualDelta: number;
  createdAt: string;
};

export async function fetchListUsers(query = ""): Promise<ListUserItem[]> {
  const url = `${API_BASE}/users${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to list users: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return Array.isArray(data.users) ? data.users : [];
}

export async function fetchPublicUserProfileByUsername(
  username: string,
): Promise<UserProfileResponse | null> {
  const trimmed = username.trim();
  if (!trimmed) {
    throw new Error("username is required");
  }
  const cleaned = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  const url = `${API_BASE}/users/by-username?username=${encodeURIComponent(cleaned)}`;
  console.log("[API] Fetching profile by username:", cleaned, "URL:", url);
  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    console.error("[API] Failed to fetch profile:", res.status, res.statusText, errorText);
    if (res.status === 404) {
      throw new Error("User not found");
    }
    throw new Error(`Failed to load public profile: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  console.log("[API] Profile response:", data);
  return data.profile ?? null;
}

export async function fetchPublicUserProfileById(id: string): Promise<UserProfileResponse | null> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("id is required");
  }
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(trimmed)}`);
  if (!res.ok) {
    throw new Error(`Failed to load public profile by id: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  // backend returns { user: profile }
  return data.user ?? null;
}

export async function fetchPublicUserStatisticsById(
  id: string,
): Promise<UserStatisticsResponse | null> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("id is required");
  }
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(trimmed)}/statistics`);
  if (!res.ok) {
    throw new Error(`Failed to load public statistics by id: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.statistics ?? null;
}
