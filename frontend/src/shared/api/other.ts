import { fetchDatasetFromApi } from "./dataSource";

export type OtherItem = {
  id: string;
  username: string;
  usernameLink: string;
  verified: boolean;
  price: number;
  description: string;
  publishedAt: string;
};

export type OtherResponse = {
  other: OtherItem[];
};

export async function fetchOther(): Promise<OtherResponse> {
  const payload = await fetchDatasetFromApi<OtherResponse>("other");
  if (!payload) {
    throw new Error('Failed to load "other" from content API');
  }
  return payload;
}
