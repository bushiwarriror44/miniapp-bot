import { fetchDatasetOrFallback } from "./dataSource";

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
  return fetchDatasetOrFallback<MainPageDataset>("mainPage", async () => {
    const hotOffersData = await import("@/shared/data/hot-offers.json");
    return {
      hotOffers: {
        offers: hotOffersData.offers || [],
      },
      news: {
        channelUrl: "https://t.me/your_channel",
      },
    };
  });
}
