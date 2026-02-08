export type ServiceItem = {
  id: string;
  title: string;
  price: number;
  verified: boolean;
  username: string;
  description: string;
  publishedAt: string;
};

export type ServicesResponse = {
  services: ServiceItem[];
};

const LOAD_DELAY_MS = 1200;

export async function fetchServices(): Promise<ServicesResponse> {
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
  const data = await import("@/shared/data/services.json");
  return data as ServicesResponse;
}

export function formatServiceDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
