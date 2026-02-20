import type { SearchHit } from "@/shared/types/exchange";
import type { AdItem } from "@/shared/api/ads";
import type { BuyAdItem } from "@/shared/api/buyAds";
import type { JobItem } from "@/shared/api/jobs";
import type { ServiceItem } from "@/shared/api/services";
import type { SellChannelItem } from "@/shared/api/sellChannels";
import type { BuyChannelItem } from "@/shared/api/buyChannels";
import type { OtherItem } from "@/shared/api/other";
import type { CurrencyItem } from "@/shared/api/currency";
import { fetchAds } from "@/shared/api/ads";
import { fetchBuyAds } from "@/shared/api/buyAds";
import { fetchJobs } from "@/shared/api/jobs";
import { fetchServices } from "@/shared/api/services";
import { fetchSellChannels } from "@/shared/api/sellChannels";
import { fetchBuyChannels } from "@/shared/api/buyChannels";
import { fetchOther } from "@/shared/api/other";
import { fetchCurrency } from "@/shared/api/currency";

function searchable(str: string | undefined | null): string {
  return String(str ?? "").trim();
}

function buildSearchText(parts: (string | undefined | null)[]): string {
  return parts.map(searchable).filter(Boolean).join(" ");
}

function matchesQuery(searchText: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return searchText.toLowerCase().includes(q);
}

function truncate(s: string, maxLen: number): string {
  const t = s.trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).trimEnd() + "…";
}

export async function searchListings(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const results: SearchHit[] = [];

  const settled = await Promise.allSettled([
    fetchAds(),
    fetchBuyAds(),
    fetchJobs(),
    fetchServices(),
    fetchSellChannels(),
    fetchBuyChannels(),
    fetchOther(),
    fetchCurrency(),
  ]);

  const [adsRes, buyAdsRes, jobsRes, servicesRes, sellChannelsRes, buyChannelsRes, otherRes, currencyRes] =
    settled;

  if (adsRes.status === "fulfilled" && adsRes.value?.ads) {
    const list = adsRes.value.ads as AdItem[];
    for (const item of list) {
      const text = buildSearchText([item.theme, item.description, item.username, item.channelOrChatLink]);
      if (matchesQuery(text, q)) {
        results.push({
          section: "sell-ads",
          id: item.id,
          title: truncate(item.theme || item.description || item.username || item.id, 60),
          snippet: item.description ? truncate(item.description, 80) : undefined,
        });
      }
    }
  }

  if (buyAdsRes.status === "fulfilled" && buyAdsRes.value?.buyAds) {
    const list = buyAdsRes.value.buyAds as BuyAdItem[];
    for (const item of list) {
      const text = buildSearchText([item.theme, item.description, item.username]);
      if (matchesQuery(text, q)) {
        results.push({
          section: "buy-ads",
          id: item.id,
          title: truncate(item.theme || item.description || item.username || item.id, 60),
          snippet: item.description ? truncate(item.description, 80) : undefined,
        });
      }
    }
  }

  if (jobsRes.status === "fulfilled" && jobsRes.value?.jobs) {
    const list = jobsRes.value.jobs as JobItem[];
    for (const item of list) {
      const text = buildSearchText([item.theme, item.description]);
      if (matchesQuery(text, q)) {
        results.push({
          section: "jobs",
          id: item.id,
          title: truncate(item.theme || item.description || item.id, 60),
          snippet: item.description ? truncate(item.description, 80) : undefined,
        });
      }
    }
  }

  if (servicesRes.status === "fulfilled" && servicesRes.value?.services) {
    const list = servicesRes.value.services as ServiceItem[];
    for (const item of list) {
      const text = buildSearchText([item.title, item.theme, item.description, item.username]);
      if (matchesQuery(text, q)) {
        results.push({
          section: "designers",
          id: item.id,
          title: truncate(item.title || item.theme || item.description || item.id, 60),
          snippet: item.description ? truncate(item.description, 80) : undefined,
        });
      }
    }
  }

  if (sellChannelsRes.status === "fulfilled" && sellChannelsRes.value?.sellChannels) {
    const list = sellChannelsRes.value.sellChannels as SellChannelItem[];
    for (const item of list) {
      const text = buildSearchText([item.name, item.theme, item.description, item.username]);
      if (matchesQuery(text, q)) {
        results.push({
          section: "sell-channel",
          id: item.id,
          title: truncate(item.name || item.theme || item.description || item.id, 60),
          snippet: item.description ? truncate(item.description, 80) : undefined,
        });
      }
    }
  }

  if (buyChannelsRes.status === "fulfilled" && buyChannelsRes.value?.buyChannels) {
    const list = buyChannelsRes.value.buyChannels as BuyChannelItem[];
    for (const item of list) {
      const text = buildSearchText([item.theme, item.description, item.username]);
      if (matchesQuery(text, q)) {
        results.push({
          section: "buy-channel",
          id: item.id,
          title: truncate(item.theme || item.description || item.username || item.id, 60),
          snippet: item.description ? truncate(item.description, 80) : undefined,
        });
      }
    }
  }

  if (otherRes.status === "fulfilled" && otherRes.value?.other) {
    const list = otherRes.value.other as OtherItem[];
    for (const item of list) {
      const text = buildSearchText([item.description, item.username]);
      if (matchesQuery(text, q)) {
        results.push({
          section: "other",
          id: item.id,
          title: truncate(item.description || item.username || item.id, 60),
          snippet: item.description ? truncate(item.description, 80) : undefined,
        });
      }
    }
  }

  if (currencyRes.status === "fulfilled" && currencyRes.value?.currency) {
    const list = currencyRes.value.currency as CurrencyItem[];
    for (const item of list) {
      const text = buildSearchText([
        item.title,
        item.subtitle,
        item.description,
        item.username,
      ]);
      if (matchesQuery(text, q)) {
        results.push({
          section: "currency",
          id: item.id,
          title: truncate(
            item.title || item.subtitle || item.description || item.username || item.id,
            60
          ),
          snippet: item.description ? truncate(item.description, 80) : undefined,
        });
      }
    }
  }

  return results;
}
