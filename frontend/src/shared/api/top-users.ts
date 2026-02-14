import { fetchDatasetFromApi } from "./dataSource";

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
  const payload = await fetchDatasetFromApi<TopUsersResponse>("topUsers");
  if (!payload) {
    throw new Error('Failed to load "topUsers" from content API');
  }
  return payload;
}
