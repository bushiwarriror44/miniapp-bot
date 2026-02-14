import { fetchDatasetFromApi } from "./dataSource";

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
