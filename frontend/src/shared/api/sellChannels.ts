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

const LOAD_DELAY_MS = 1200;

export async function fetchSellChannels(): Promise<SellChannelsResponse> {
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
  const data = await import("@/shared/data/sellChannels.json");
  return data as SellChannelsResponse;
}
