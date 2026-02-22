import { fetchDatasetFromApi, fetchDatasetPaginated, type FetchDatasetPaginatedParams } from "./dataSource";

export type SellChannelItem = {
  id: string;
  imageUrl: string | null;
  name: string;
  subscribers: number;
  reach: number;
  price: number;
  viaGuarantor: boolean;
  username: string;
  usernameLink: string;
  verified: boolean;
  theme: string;
  description: string;
  publishedAt: string;
};

export type SellChannelsResponse = {
  sellChannels: SellChannelItem[];
};

export async function fetchSellChannels(): Promise<SellChannelsResponse> {
  const payload = await fetchDatasetFromApi<SellChannelsResponse>("sellChannels");
  if (!payload) {
    throw new Error('Failed to load "sellChannels" from content API');
  }
  return payload;
}

export type SellChannelsPaginatedParams = FetchDatasetPaginatedParams & {
  theme?: string;
  priceFrom?: string;
  priceTo?: string;
  reachFrom?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function fetchSellChannelsPaginated(
  params: SellChannelsPaginatedParams = {},
): Promise<{ sellChannels: SellChannelItem[]; nextCursor: string | null } | null> {
  const res = await fetchDatasetPaginated<SellChannelsResponse>("sellChannels", {
    ...params,
    limit: params.limit ?? 20,
  });
  if (!res) return null;
  return { sellChannels: res.payload.sellChannels ?? [], nextCursor: res.nextCursor };
}
