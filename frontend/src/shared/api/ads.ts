import { fetchDatasetFromApi, fetchDatasetPaginated, type FetchDatasetPaginatedParams } from "./dataSource";

export type AdType = "post_in_channel" | "post_in_chat";

export type PaymentMethod = "card" | "crypto";

export type AdItem = {
  id: string;
  adType: AdType;
  channelOrChatLink: string;
  imageUrl: string | null;
  verified: boolean;
  username: string;
  authorUserId?: string | null;
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
  const payload = await fetchDatasetFromApi<AdsResponse>("ads");
  if (!payload) {
    throw new Error('Failed to load "ads" from content API');
  }
  return payload;
}

export type AdsPaginatedParams = FetchDatasetPaginatedParams & {
  priceFrom?: string;
  priceTo?: string;
  theme?: string;
};

export async function fetchAdsPaginated(
  params: AdsPaginatedParams = {},
): Promise<{ ads: AdItem[]; nextCursor: string | null } | null> {
  const res = await fetchDatasetPaginated<AdsResponse>("ads", {
    ...params,
    limit: params.limit ?? 20,
  });
  if (!res) return null;
  return { ads: res.payload.ads ?? [], nextCursor: res.nextCursor };
}

export const AD_TYPE_LABELS: Record<AdType, string> = {
  post_in_channel: "Пост в канале",
  post_in_chat: "Пост в чате",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: "Карта",
  crypto: "Крипта",
};
