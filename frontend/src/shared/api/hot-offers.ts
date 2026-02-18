import { fetchMainPageData } from "./main-page";

export type HotOffer = {
  id: string;
  title: string;
  price: string;
  subtitle: string;
  /** Ad-linked offer: links to an exchange item */
  type?: "ad";
  category?: string;
  itemId?: string;
};

export type HotOffersResponse = {
  offers: HotOffer[];
};

export async function fetchHotOffers(): Promise<HotOffersResponse> {
  const mainPage = await fetchMainPageData();
  return { offers: mainPage?.hotOffers?.offers || [] };
}
