const RAW_CONTENT_API_BASE = process.env.NEXT_PUBLIC_CONTENT_API_URL?.trim() || "";
const CONTENT_API_BASE = RAW_CONTENT_API_BASE ? RAW_CONTENT_API_BASE.replace(/\/$/, "") : null;

export type UserListingItem = {
  section: string;
  id: string;
  title: string | null;
  publishedAt: string | null;
  username?: string;
};

export type UserListingsResponse = {
  items: UserListingItem[];
  nextCursor: string | null;
};

export async function fetchUserListingsPaginated(
  username: string,
  params: { cursor?: string | null; limit?: number } = {}
): Promise<UserListingsResponse> {
  const clean = (username ?? "").toString().trim().replace(/^@/, "");
  if (!CONTENT_API_BASE) {
    return { items: [], nextCursor: null };
  }
  const search = new URLSearchParams();
  if (params.cursor != null && params.cursor !== "") search.set("cursor", String(params.cursor));
  if (params.limit != null) search.set("limit", String(params.limit));
  try {
    const res = await fetch(
      `${CONTENT_API_BASE}/users/${encodeURIComponent(clean)}/listings?${search.toString()}`,
      { method: "GET", cache: "no-store" }
    );
    if (!res.ok) return { items: [], nextCursor: null };
    const json = (await res.json()) as { items?: UserListingItem[]; nextCursor?: string | null };
    return {
      items: Array.isArray(json.items) ? json.items : [],
      nextCursor: json.nextCursor ?? null,
    };
  } catch (error) {
    console.error("[user-listings] Request error", error);
    return { items: [], nextCursor: null };
  }
}
