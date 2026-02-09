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

const LOAD_DELAY_MS = 1200;

export async function fetchBuyAds(): Promise<BuyAdsResponse> {
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
  const data = await import("@/shared/data/buyAds.json");
  return data as BuyAdsResponse;
}
