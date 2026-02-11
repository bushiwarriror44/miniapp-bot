import { fetchDatasetOrFallback } from "./dataSource";

export type AdType = "post_in_channel" | "post_in_chat";

export type PaymentMethod = "card" | "crypto";

export type AdItem = {
  id: string;
  adType: AdType;
  channelOrChatLink: string;
  imageUrl: string | null;
  verified: boolean;
  username: string;
  price: number;
  pinned: boolean;
  underGuarantee: boolean;
  publishTime: string;
  postDuration: string;
  paymentMethod: PaymentMethod;
  theme: string;
  description: string;
  publishedAt: string;
};

export type AdsResponse = {
  ads: AdItem[];
};

export async function fetchAds(): Promise<AdsResponse> {
  return fetchDatasetOrFallback<AdsResponse>("ads", async () => {
    const data = await import("@/shared/data/ads.json");
    return data as AdsResponse;
  });
}

export const AD_TYPE_LABELS: Record<AdType, string> = {
  post_in_channel: "Пост в канале",
  post_in_chat: "Пост в чате",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: "Карта",
  crypto: "Крипта",
};
