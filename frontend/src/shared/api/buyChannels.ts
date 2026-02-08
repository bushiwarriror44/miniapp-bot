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
  description: string;
  publishedAt: string;
};

export type BuyChannelsResponse = {
  buyChannels: BuyChannelItem[];
};

const LOAD_DELAY_MS = 1200;

export async function fetchBuyChannels(): Promise<BuyChannelsResponse> {
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
  const data = await import("@/shared/data/buyChannels.json");
  return data as BuyChannelsResponse;
}
