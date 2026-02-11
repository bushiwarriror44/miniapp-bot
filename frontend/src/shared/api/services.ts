import { fetchDatasetOrFallback } from "./dataSource";

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
  return fetchDatasetOrFallback<ServicesResponse>("services", async () => {
    const data = await import("@/shared/data/services.json");
    return data as ServicesResponse;
  });
}

export function formatServiceDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
