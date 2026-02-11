import { fetchDatasetOrFallback } from "./dataSource";

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
  return fetchDatasetOrFallback<SellChannelsResponse>(
    "sellChannels",
    async () => {
      const data = await import("@/shared/data/sellChannels.json");
      return data as SellChannelsResponse;
    }
  );
}
