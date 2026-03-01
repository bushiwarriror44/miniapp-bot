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
  section: string;
  itemId: string;
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
  labels?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
};

export type UserStatisticsResponse = {
  ads: { active: number; completed: number; hidden: number; onModeration?: number };
  deals: { total: number; successful: number; disputed: number };
  profileViews: { week: number; month: number };
};

export type MyPublicationItem = {
  id: string;
  status: "pending" | "approved" | "rejected" | "completed";
  section: string;
  formData: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
};

export async function fetchUserProfile(telegramId: string | number): Promise<UserProfileResponse | null> {
  const res = await fetch(`${API_BASE}/users/me/profile?telegramId=${encodeURIComponent(String(telegramId))}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && typeof data.error === "string") ? data.error : `Failed to load profile: ${res.status} ${res.statusText}`);
  }
  if (data && typeof data.error === "string") {
    throw new Error(data.error);
  }
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

export async function addToFavorites(
  telegramId: string | number,
  section: string,
  itemId: string,
): Promise<void> {
  const params = new URLSearchParams();
  params.set("telegramId", String(telegramId));
  const res = await fetch(`${API_BASE}/users/me/favorites?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, itemId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to add to favorites: ${res.status} ${res.statusText}`);
  }
}

export async function removeFromFavorites(
  telegramId: string | number,
  section: string,
  itemId: string,
): Promise<void> {
  const params = new URLSearchParams();
  params.set("telegramId", String(telegramId));
  params.set("section", section);
  params.set("itemId", itemId);
  const res = await fetch(`${API_BASE}/users/me/favorites?${params.toString()}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to remove from favorites: ${res.status} ${res.statusText}`);
  }
}

export async function submitVerifyPhone(
  telegramId: string | number,
  phoneNumber: string,
): Promise<void> {
  const params = new URLSearchParams();
  params.set("telegramId", String(telegramId));
  const res = await fetch(`${API_BASE}/users/me/verify-phone?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: String(phoneNumber).trim() }),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit phone: ${res.status} ${res.statusText}`);
  }
}

export type MyPublicationsPaginatedResponse = {
  publications: MyPublicationItem[];
  nextCursor: string | null;
};

export type FetchMyPublicationsResult = {
  publications: MyPublicationItem[];
  backendError?: string;
};

export async function fetchMyPublications(
  telegramId: string | number,
): Promise<FetchMyPublicationsResult> {
  const res = await fetch(`${API_BASE}/users/me/publications?telegramId=${encodeURIComponent(String(telegramId))}`);
  const data = await res.json().catch(() => ({})) as { publications?: MyPublicationItem[]; _error?: string; cause?: string };
  if (!res.ok) {
    const cause = typeof data.cause === "string" ? data.cause : "";
    throw new Error(
      cause
        ? `Failed to load publications: ${res.status} ${res.statusText}. ${cause}`
        : `Failed to load publications: ${res.status} ${res.statusText}`,
    );
  }
  const publications = Array.isArray(data.publications) ? data.publications : [];
  const backendError = typeof data._error === "string" ? data._error : undefined;
  return { publications, backendError };
}

export async function fetchMyPublicationsPaginated(
  telegramId: string | number,
  cursor?: string | null,
  limit: number = 20,
): Promise<MyPublicationsPaginatedResponse> {
  const params = new URLSearchParams();
  params.set("telegramId", String(telegramId));
  params.set("limit", String(limit));
  if (cursor != null && cursor !== "") params.set("cursor", cursor);
  const res = await fetch(`${API_BASE}/users/me/publications?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load publications: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    publications: Array.isArray(data.publications) ? data.publications : [],
    nextCursor: data.nextCursor ?? null,
  };
}

export async function completePublication(
  telegramId: string | number,
  publicationId: string,
): Promise<MyPublicationItem> {
  const url = `${API_BASE}/users/me/publications/${encodeURIComponent(publicationId)}/complete?telegramId=${encodeURIComponent(String(telegramId))}`;
  const res = await fetch(url, { method: "PATCH" });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Публикация не найдена или уже завершена");
    }
    throw new Error(res.status === 400 ? "Неверный запрос" : `Ошибка: ${res.status}`);
  }
  const data = await res.json();
  return data.publication;
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
