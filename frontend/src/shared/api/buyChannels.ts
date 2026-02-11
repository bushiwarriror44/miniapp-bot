import { fetchDatasetOrFallback } from "./dataSource";

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
  return fetchDatasetOrFallback<BuyChannelsResponse>(
    "buyChannels",
    async () => {
      const data = await import("@/shared/data/buyChannels.json");
      return data as BuyChannelsResponse;
    }
  );
}
