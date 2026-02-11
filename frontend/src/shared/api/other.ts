import { fetchDatasetOrFallback } from "./dataSource";

export type OtherItem = {
  id: string;
  username: string;
  usernameLink: string;
  verified: boolean;
  price: number;
  description: string;
  publishedAt: string;
};

export type OtherResponse = {
  other: OtherItem[];
};

export async function fetchOther(): Promise<OtherResponse> {
  return fetchDatasetOrFallback<OtherResponse>("other", async () => {
    const data = await import("@/shared/data/other.json");
    return data as OtherResponse;
  });
}
