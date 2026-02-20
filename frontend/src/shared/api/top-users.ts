const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");

export type TopUser = {
  id: string;
  rank: number;
  name: string;
  username: string | null;
  rating: number;
  dealsCount: number;
};

export type TopUsersResponse = {
  users: TopUser[];
};

export type TopUsersPaginatedResponse = {
  users: TopUser[];
  nextCursor: string | null;
};

export async function fetchTopUsers(): Promise<TopUsersResponse> {
  try {
    const res = await fetch(`${API_BASE}/users/top?limit=10`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to load top users: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return { users: Array.isArray(data.users) ? data.users : [] };
  } catch (error) {
    console.error("[api] Failed to fetch top users from backend", error);
    return { users: [] };
  }
}

export async function fetchTopUsersPaginated(
  cursor?: string | null,
  limit: number = 20,
): Promise<TopUsersPaginatedResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (cursor != null && cursor !== "") params.set("cursor", cursor);
  const res = await fetch(`${API_BASE}/users/top?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load top users: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    users: Array.isArray(data.users) ? data.users : [],
    nextCursor: data.nextCursor ?? null,
  };
}
