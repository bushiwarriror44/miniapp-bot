export type TopUser = {
  id: string;
  rank: number;
  name: string;
  rating: number;
  dealsCount: number;
};

export type TopUsersResponse = {
  users: TopUser[];
};

const LOAD_DELAY_MS = 1500;

/** Эмуляция загрузки топа пользователей */
export async function fetchTopUsers(): Promise<TopUsersResponse> {
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
  const data = await import("@/shared/data/top-users.json");
  return data as TopUsersResponse;
}
