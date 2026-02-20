import { fetchDatasetFromApi, fetchDatasetPaginated, type FetchDatasetPaginatedParams } from "./dataSource";

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

export type BuyAdsPaginatedParams = FetchDatasetPaginatedParams & {
  priceFrom?: string;
  priceTo?: string;
  theme?: string;
};

export async function fetchBuyAdsPaginated(
  params: BuyAdsPaginatedParams = {},
): Promise<{ buyAds: BuyAdItem[]; nextCursor: string | null } | null> {
  const res = await fetchDatasetPaginated<BuyAdsResponse>("buyAds", {
    ...params,
    limit: params.limit ?? 20,
  });
  if (!res) return null;
  return { buyAds: res.payload.buyAds ?? [], nextCursor: res.nextCursor };
}
