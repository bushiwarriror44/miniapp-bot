import { fetchDatasetOrFallback } from "./dataSource";

export type HotOffer = {
  id: string;
  title: string;
  price: string;
  subtitle: string;
};

export type HotOffersResponse = {
  offers: HotOffer[];
};

export async function fetchHotOffers(): Promise<HotOffersResponse> {
  return fetchDatasetOrFallback<HotOffersResponse>("hotOffers", async () => {
    const data = await import("@/shared/data/hot-offers.json");
    return data as HotOffersResponse;
  });
}
