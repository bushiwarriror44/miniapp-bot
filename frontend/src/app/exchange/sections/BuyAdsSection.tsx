"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFilterCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { fetchBuyAdsPaginated, type BuyAdItem } from "@/shared/api/buyAds";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import { inputStyleModal, EXCHANGE_PAGE_SIZE } from "../constants";
import { toErrorMessage } from "../formHelpers";
import { BuyAdCard, ExchangeCardSkeleton } from "../cards";

export function BuyAdsSection({ hotItemIds }: { hotItemIds?: Set<string> }) {
  const router = useRouter();
  const [usernameSearch, setUsernameSearch] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [viewsFrom, setViewsFrom] = useState("");
  const [viewsTo, setViewsTo] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [items, setItems] = useState<BuyAdItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadFirstPage = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setItems([]);
    setNextCursor(null);
    fetchBuyAdsPaginated({
      priceFrom: priceFrom.trim() || undefined,
      priceTo: priceTo.trim() || undefined,
      theme: themeSearch.trim() || undefined,
      viewsFrom: viewsFrom.trim() || undefined,
      viewsTo: viewsTo.trim() || undefined,
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setItems(res.buyAds ?? []);
          setNextCursor(res.nextCursor);
        } else {
          setItems([]);
          setNextCursor(null);
        }
      })
      .catch((error) => {
        setItems([]);
        setNextCursor(null);
        setLoadError(toErrorMessage(error));
      })
      .finally(() => setLoading(false));
  }, [priceFrom, priceTo, themeSearch, viewsFrom, viewsTo, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => loadFirstPage(), 0);
    return () => clearTimeout(t);
  }, [loadFirstPage]);

  const loadMore = useCallback(() => {
    if (loadMoreLoading || nextCursor == null) return;
    setLoadMoreLoading(true);
    fetchBuyAdsPaginated({
      priceFrom: priceFrom.trim() || undefined,
      priceTo: priceTo.trim() || undefined,
      theme: themeSearch.trim() || undefined,
      viewsFrom: viewsFrom.trim() || undefined,
      viewsTo: viewsTo.trim() || undefined,
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
      cursor: nextCursor,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setItems((prev) => [...prev, ...(res.buyAds ?? [])]);
          setNextCursor(res.nextCursor);
        }
      })
      .catch(() => {})
      .finally(() => setLoadMoreLoading(false));
  }, [nextCursor, loadMoreLoading, priceFrom, priceTo, themeSearch, viewsFrom, viewsTo, dateFrom, dateTo]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: nextCursor != null && nextCursor !== "",
    loading: loadMoreLoading,
  });

  const filteredItems = items.filter((item) => {
    const usernameMatch = !usernameSearch.trim() || item.username.toLowerCase().includes(usernameSearch.trim().toLowerCase());
    if (!usernameMatch) return false;
    const vFrom = viewsFrom.trim() ? Number(viewsFrom) : null;
    const vTo = viewsTo.trim() ? Number(viewsTo) : null;
    if (vFrom != null && !Number.isNaN(vFrom) && item.viewsMax < vFrom) return false;
    if (vTo != null && !Number.isNaN(vTo) && item.viewsMin > vTo) return false;
    const descMatch = !descriptionSearch.trim() || item.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase());
    if (!descMatch) return false;
    if (dateFrom.trim() && item.publishedAt < dateFrom) return false;
    if (dateTo.trim() && item.publishedAt > dateTo) return false;
    return true;
  });

  const handleOpenView = useCallback((id: string) => {
    router.push(`/exchange/view?section=buy-ads&id=${encodeURIComponent(id)}`);
  }, [router]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Покупка рекламы
        </h2>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && (
      <div
        className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Фильтры по юзернейму, сумме, просмотрам, тематике, описанию и дате
        </p>
        <div className="grid gap-3 min-w-0">
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Юзернейм
            </label>
            <input
              type="text"
              placeholder="Поиск по юзернейму"
              value={usernameSearch}
              onChange={(e) => setUsernameSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyleModal}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Сумма (₽), от — до
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
              Просмотров, от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={viewsFrom}
                onChange={(e) => setViewsFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyleModal}
              />
              <input
                type="text"
                placeholder="До"
                value={viewsTo}
                onChange={(e) => setViewsTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyleModal}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Тематика канала
            </label>
            <input
              type="text"
              placeholder="Например: крипто, маркетинг"
              value={themeSearch}
              onChange={(e) => setThemeSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyleModal}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Описание
            </label>
            <input
              type="text"
              placeholder="Поиск по описанию"
              value={descriptionSearch}
              onChange={(e) => setDescriptionSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyleModal}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата публикации, от
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyleModal}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата публикации, до
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyleModal}
            />
          </div>
        </div>
      </div>
      )}

      <div className="space-y-3">
        {loadError && (
          <p className="text-xs py-2" style={{ color: "#ef4444" }}>
            Ошибка загрузки: {loadError}
          </p>
        )}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <ExchangeCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!loading && items.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            Заявок на покупку рекламы пока нет.
          </p>
        )}
        {!loading && items.length > 0 && filteredItems.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            По фильтрам ничего не найдено.
          </p>
        )}
        {!loading && filteredItems.length > 0 && (
          <>
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div key={item.id}>
                  <BuyAdCard
                    item={item}
                    isHot={hotItemIds?.has(String(item.id))}
                    onOpenView={handleOpenView}
                  />
                </div>
              ))}
            </div>
            {loadMoreLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <ExchangeCardSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}
            <div ref={sentinelRef} className="h-2" aria-hidden />
          </>
        )}
      </div>
    </section>
  );
}
