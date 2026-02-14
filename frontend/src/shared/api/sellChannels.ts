import { fetchDatasetFromApi } from "./dataSource";

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
