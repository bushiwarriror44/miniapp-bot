import { fetchDatasetFromApi } from "./dataSource";

type HotOffer = {
  id: string;
  title: string;
  price: string;
  subtitle: string;
};

type MainPageDataset = {
  hotOffers: {
    offers: HotOffer[];
  };
  news: {
    channelUrl: string;
  };
};

export async function fetchMainPageData(): Promise<MainPageDataset> {
  const payload = await fetchDatasetFromApi<MainPageDataset>("mainPage");
  if (!payload) {
    throw new Error('Failed to load "mainPage" from content API');
  }
  return payload;
}
