import { fetchDatasetFromApi } from "./dataSource";

export type FaqItem = {
  id: string;
  title: string;
  text: string;
};

export async function fetchFaqItems(): Promise<FaqItem[]> {
  const payload = await fetchDatasetFromApi<{ items?: FaqItem[] }>("faq");
  if (!payload) {
    throw new Error('FAQ dataset "faq" returned empty payload');
  }
  if (!Array.isArray(payload.items)) {
    throw new Error('FAQ dataset "faq" has invalid shape: expected items[]');
  }
  return payload.items;
}
