import { fetchDatasetFromApi, fetchDatasetPaginated, type FetchDatasetPaginatedParams } from "./dataSource";

export type ServiceItem = {
  id: string;
  title: string;
  price: number;
  verified: boolean;
  username: string;
  theme: string;
  description: string;
  publishedAt: string;
};

export type ServicesResponse = {
  services: ServiceItem[];
};

export async function fetchServices(): Promise<ServicesResponse> {
  const payload = await fetchDatasetFromApi<ServicesResponse>("services");
  if (!payload) {
    throw new Error('Failed to load "services" from content API');
  }
  return payload;
}

export type ServicesPaginatedParams = FetchDatasetPaginatedParams & {
  theme?: string;
  priceFrom?: string;
  priceTo?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function fetchServicesPaginated(
  params: ServicesPaginatedParams = {},
): Promise<{ services: ServiceItem[]; nextCursor: string | null } | null> {
  const res = await fetchDatasetPaginated<ServicesResponse>("services", {
    ...params,
    limit: params.limit ?? 20,
  });
  if (!res) return null;
  return { services: res.payload.services ?? [], nextCursor: res.nextCursor };
}

export function formatServiceDate(isoDate: string | undefined | null): string {
  if (isoDate == null || typeof isoDate !== "string") return "—";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
