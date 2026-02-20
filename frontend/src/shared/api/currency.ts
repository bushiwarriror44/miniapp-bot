import { fetchDatasetFromApi, fetchDatasetPaginated, type FetchDatasetPaginatedParams } from "./dataSource";

export type CurrencyAdditionalLink =
  | string
  | {
      label?: string;
      url: string;
    };

export type CurrencyItem = {
  id: string;
  title: string;
  rate?: string | number;
  price?: string | number;
  subtitle?: string;
  description?: string;
  username?: string;
  usernameLink?: string;
  verified?: boolean;
  publishedAt?: string;
  additionalLinks?: CurrencyAdditionalLink[];
  reviewsUrl?: string;
};

export type CurrencyResponse = {
  currency: CurrencyItem[];
};

export async function fetchCurrency(): Promise<CurrencyResponse> {
  const payload = await fetchDatasetFromApi<CurrencyResponse>("currency");
  if (!payload) {
    throw new Error('Failed to load "currency" from content API');
  }
  return payload;
}

export type CurrencyPaginatedParams = FetchDatasetPaginatedParams & { theme?: string };

export async function fetchCurrencyPaginated(
  params: CurrencyPaginatedParams = {},
): Promise<{ currency: CurrencyItem[]; nextCursor: string | null } | null> {
  const res = await fetchDatasetPaginated<CurrencyResponse>("currency", {
    ...params,
    limit: params.limit ?? 20,
  });
  if (!res) return null;
  return { currency: res.payload.currency ?? [], nextCursor: res.nextCursor };
}

