import { fetchDatasetFromApi } from "./dataSource";

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

export function formatServiceDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
