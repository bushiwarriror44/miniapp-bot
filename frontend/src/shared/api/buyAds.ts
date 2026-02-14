import { fetchDatasetFromApi } from "./dataSource";

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
  const payload = await fetchDatasetFromApi<BuyAdsResponse>("buyAds");
  if (!payload) {
    throw new Error('Failed to load "buyAds" from content API');
  }
  return payload;
}
