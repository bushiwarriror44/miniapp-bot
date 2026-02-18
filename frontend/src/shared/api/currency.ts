import { fetchDatasetFromApi } from "./dataSource";

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

