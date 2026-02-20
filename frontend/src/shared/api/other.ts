import { fetchDatasetFromApi, fetchDatasetPaginated, type FetchDatasetPaginatedParams } from "./dataSource";

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

export type OtherPaginatedParams = FetchDatasetPaginatedParams & {
  theme?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function fetchOtherPaginated(
  params: OtherPaginatedParams = {},
): Promise<{ other: OtherItem[]; nextCursor: string | null } | null> {
  const res = await fetchDatasetPaginated<OtherResponse>("other", {
    ...params,
    limit: params.limit ?? 20,
  });
  if (!res) return null;
  return { other: res.payload.other ?? [], nextCursor: res.nextCursor };
}
