import { fetchDatasetFromApi } from "./dataSource";

export type BannerItem = {
  id: string;
  imageUrl: string;
  order: number;
  /** Optional URL to open when the banner is clicked */
  linkUrl?: string;
};

export type BannersPayload = {
  banners: BannerItem[];
};

export async function fetchBanners(): Promise<BannerItem[]> {
  const payload = await fetchDatasetFromApi<BannersPayload>("banners");
  if (!payload || !Array.isArray(payload.banners)) return [];
  const list = payload.banners
    .filter((b) => b && typeof b.id === "string" && typeof b.imageUrl === "string")
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return list.map((b, i) => ({ ...b, order: i }));
}
