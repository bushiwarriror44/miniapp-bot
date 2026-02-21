import { fetchDatasetFromApi } from "./dataSource";

export type HotOffer = {
  id: string;
  title: string;
  price: string;
  subtitle: string;
  type?: "ad";
  category?: string;
  itemId?: string;
};

type MainPageDataset = {
  hotOffers: {
    offers: HotOffer[];
  };
  news: {
    channelUrl: string;
  };
};

const CACHE_TTL_MS = 60_000;
const ERROR_CACHE_MS = 15_000;
let cached: { data: MainPageDataset; at: number } | null = null;
let lastError: { error: Error; at: number } | null = null;
let inFlight: Promise<MainPageDataset> | null = null;

export async function fetchMainPageData(): Promise<MainPageDataset> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }
  if (lastError && now - lastError.at < ERROR_CACHE_MS) {
    throw lastError.error;
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = (async () => {
    try {
      const payload = await fetchDatasetFromApi<MainPageDataset>("mainPage");
      if (!payload) {
        const err = new Error('Failed to load "mainPage" from content API');
        lastError = { error: err, at: Date.now() };
        throw err;
      }
      lastError = null;
      cached = { data: payload, at: Date.now() };
      return payload;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      lastError = { error: err, at: Date.now() };
      throw e;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
