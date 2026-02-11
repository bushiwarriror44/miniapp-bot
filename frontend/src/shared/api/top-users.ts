import { fetchDatasetOrFallback } from "./dataSource";

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

export async function fetchTopUsers(): Promise<TopUsersResponse> {
  return fetchDatasetOrFallback<TopUsersResponse>("topUsers", async () => {
    const data = await import("@/shared/data/top-users.json");
    return data as TopUsersResponse;
  });
}
