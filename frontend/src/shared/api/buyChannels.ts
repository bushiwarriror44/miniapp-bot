import { fetchDatasetFromApi, fetchDatasetPaginated, type FetchDatasetPaginatedParams } from "./dataSource";

export type BuyChannelItem = {
  id: string;
  username: string;
  usernameLink: string;
  verified: boolean;
  priceMin: number;
  priceMax: number;
  reachMin: number;
  reachMax: number;
  subscribersMin: number;
  subscribersMax: number;
  viaGuarantor: boolean;
  theme: string;
  description: string;
  publishedAt: string;
};

export type BuyChannelsResponse = {
  buyChannels: BuyChannelItem[];
};

export async function fetchBuyChannels(): Promise<BuyChannelsResponse> {
  const payload = await fetchDatasetFromApi<BuyChannelsResponse>("buyChannels");
  if (!payload) {
    throw new Error('Failed to load "buyChannels" from content API');
  }
  return payload;
}

export type BuyChannelsPaginatedParams = FetchDatasetPaginatedParams & {
  theme?: string;
  priceFrom?: string;
  priceTo?: string;
  reachFrom?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function fetchBuyChannelsPaginated(
  params: BuyChannelsPaginatedParams = {},
): Promise<{ buyChannels: BuyChannelItem[]; nextCursor: string | null } | null> {
  const res = await fetchDatasetPaginated<BuyChannelsResponse>("buyChannels", {
    ...params,
    limit: params.limit ?? 20,
  });
  if (!res) return null;
  return { buyChannels: res.payload.buyChannels ?? [], nextCursor: res.nextCursor };
}
