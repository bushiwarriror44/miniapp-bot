import { fetchDatasetOrFallback } from "./dataSource";

export type BuyAdItem = {
  id: string;
  username: string;
  usernameLink: string;
  verified: boolean;
  priceMin: number;
  priceMax: number;
  viewsMin: number;
  viewsMax: number;
  theme: string;
  description: string;
  publishedAt: string;
};

export type BuyAdsResponse = {
  buyAds: BuyAdItem[];
};

export async function fetchBuyAds(): Promise<BuyAdsResponse> {
  return fetchDatasetOrFallback<BuyAdsResponse>("buyAds", async () => {
    const data = await import("@/shared/data/buyAds.json");
    return data as BuyAdsResponse;
  });
}
