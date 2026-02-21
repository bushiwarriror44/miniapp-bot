"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAdsPaginated, type AdItem } from "@/shared/api/ads";
import { useExchangeSectionList } from "@/app/hooks/useExchangeSectionList";
import { ExchangeSectionListFrame } from "../ExchangeSectionListFrame";
import { inputStyleModal, EXCHANGE_PAGE_SIZE } from "../constants";
import { AdCard } from "../cards";

export function SellAdsSection({ hotItemIds }: { hotItemIds?: Set<string> }) {
  const router = useRouter();
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [reachFrom, setReachFrom] = useState("");
  const [theme, setTheme] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchFirst = useCallback(
    () =>
      fetchAdsPaginated({
        priceFrom: priceFrom.trim() || undefined,
        priceTo: priceTo.trim() || undefined,
        theme: theme.trim() || undefined,
        limit: EXCHANGE_PAGE_SIZE,
      }).then((res) => ({
        items: res?.ads ?? [],
        nextCursor: res?.nextCursor ?? null,
      })),
    [priceFrom, priceTo, theme],
  );
  const fetchNext = useCallback(
    (cursor: string) =>
      fetchAdsPaginated({
        priceFrom: priceFrom.trim() || undefined,
        priceTo: priceTo.trim() || undefined,
        theme: theme.trim() || undefined,
        cursor,
        limit: EXCHANGE_PAGE_SIZE,
      }).then((res) => ({
        items: res?.ads ?? [],
        nextCursor: res?.nextCursor ?? null,
      })),
    [priceFrom, priceTo, theme],
  );

  const { items: ads, loading, loadMoreLoading, loadError, sentinelRef } = useExchangeSectionList<AdItem>({
    fetchFirst,
    fetchNext,
  });

  const handleOpenView = useCallback(
    (id: string) => {
      router.push(`/exchange/view?section=sell-ads&id=${encodeURIComponent(id)}`);
    },
    [router],
  );

  const filterPanel = (
    <>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Фильтр по цене, охвату и тематике
      </p>
      <div className="grid gap-3 min-w-0">
        <div className="min-w-0">
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Цена, от — до
          </label>
          <div className="flex gap-2 min-w-0">
            <input
              type="text"
              placeholder="От"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyleModal}
            />
            <input
              type="text"
              placeholder="До"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyleModal}
            />
          </div>
        </div>
        <div className="min-w-0">
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Охват, от
          </label>
          <input
            type="text"
            placeholder="Подписчиков"
            value={reachFrom}
            onChange={(e) => setReachFrom(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyleModal}
          />
        </div>
        <div className="min-w-0">
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Тематика
          </label>
          <input
            type="text"
            placeholder="Например: крипто, маркетинг"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyleModal}
          />
        </div>
      </div>
    </>
  );

  return (
    <ExchangeSectionListFrame
      title="Продажа рекламы"
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters((v) => !v)}
      filterPanel={filterPanel}
      loading={loading}
      loadError={loadError}
      hasItems={ads.length > 0}
      emptyMessage="Объявлений пока нет."
      loadMoreLoading={loadMoreLoading}
      sentinelRef={sentinelRef}
    >
      {ads.map((ad) => (
        <div key={ad.id}>
          <AdCard ad={ad} isHot={hotItemIds?.has(String(ad.id))} onOpenView={handleOpenView} />
        </div>
      ))}
    </ExchangeSectionListFrame>
  );
}
