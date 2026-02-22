"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFilterCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { fetchBuyChannelsPaginated, type BuyChannelItem } from "@/shared/api/buyChannels";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import { inputStyleModal, EXCHANGE_PAGE_SIZE } from "../constants";
import { toErrorMessage } from "../formHelpers";
import { BuyChannelCard, ExchangeCardSkeleton } from "../cards";

export function BuyChannelSection({ hotItemIds }: { hotItemIds?: Set<string> }) {
  const router = useRouter();
  const [usernameSearch, setUsernameSearch] = useState("");
  const [verified, setVerified] = useState<"" | "yes" | "no">("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [reachFrom, setReachFrom] = useState("");
  const [reachTo, setReachTo] = useState("");
  const [subscribersFrom, setSubscribersFrom] = useState("");
  const [subscribersTo, setSubscribersTo] = useState("");
  const [viaGuarantor, setViaGuarantor] = useState<"" | "yes" | "no">("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [items, setItems] = useState<BuyChannelItem[]>([]);
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
    fetchBuyChannelsPaginated({
      theme: themeSearch.trim() || undefined,
      priceFrom: priceFrom.trim() || undefined,
      priceTo: priceTo.trim() || undefined,
      reachFrom: reachFrom.trim() || undefined,
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setItems(res.buyChannels ?? []);
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
  }, [themeSearch, priceFrom, priceTo, reachFrom, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => loadFirstPage(), 0);
    return () => clearTimeout(t);
  }, [loadFirstPage]);

  const loadMore = useCallback(() => {
    if (loadMoreLoading || nextCursor == null) return;
    setLoadMoreLoading(true);
    fetchBuyChannelsPaginated({
      theme: themeSearch.trim() || undefined,
      priceFrom: priceFrom.trim() || undefined,
      priceTo: priceTo.trim() || undefined,
      reachFrom: reachFrom.trim() || undefined,
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
      cursor: nextCursor,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setItems((prev) => [...prev, ...(res.buyChannels ?? [])]);
          setNextCursor(res.nextCursor);
        }
      })
      .catch(() => {})
      .finally(() => setLoadMoreLoading(false));
  }, [nextCursor, loadMoreLoading, themeSearch, priceFrom, priceTo, reachFrom, dateFrom, dateTo]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: nextCursor != null && nextCursor !== "",
    loading: loadMoreLoading,
  });

  const filteredItems = items.filter((item) => {
    const usernameMatch = !usernameSearch.trim() || item.username.toLowerCase().includes(usernameSearch.trim().toLowerCase());
    if (!usernameMatch) return false;
    if (verified === "yes" && !item.verified) return false;
    if (verified === "no" && item.verified) return false;
    const pFrom = priceFrom.trim() ? Number(priceFrom) : null;
    const pTo = priceTo.trim() ? Number(priceTo) : null;
    if (pFrom != null && !Number.isNaN(pFrom) && item.priceMax < pFrom) return false;
    if (pTo != null && !Number.isNaN(pTo) && item.priceMin > pTo) return false;
    const rFrom = reachFrom.trim() ? Number(reachFrom) : null;
    const rTo = reachTo.trim() ? Number(reachTo) : null;
    if (rFrom != null && !Number.isNaN(rFrom) && item.reachMax < rFrom) return false;
    if (rTo != null && !Number.isNaN(rTo) && item.reachMin > rTo) return false;
    const sFrom = subscribersFrom.trim() ? Number(subscribersFrom) : null;
    const sTo = subscribersTo.trim() ? Number(subscribersTo) : null;
    if (sFrom != null && !Number.isNaN(sFrom) && item.subscribersMax < sFrom) return false;
    if (sTo != null && !Number.isNaN(sTo) && item.subscribersMin > sTo) return false;
    if (viaGuarantor === "yes" && !item.viaGuarantor) return false;
    if (viaGuarantor === "no" && item.viaGuarantor) return false;
    const descMatch = !descriptionSearch.trim() || item.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase());
    if (!descMatch) return false;
    const themeMatch = !themeSearch.trim() || item.theme.toLowerCase().includes(themeSearch.trim().toLowerCase());
    if (!themeMatch) return false;
    if (dateFrom.trim() && item.publishedAt < dateFrom) return false;
    if (dateTo.trim() && item.publishedAt > dateTo) return false;
    return true;
  });

  const handleOpenView = useCallback((id: string) => {
    router.push(`/exchange/view?section=buy-channel&id=${encodeURIComponent(id)}`);
  }, [router]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Покупка канала
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
          Фильтры по нику, верификации, цене, охвату, подписчикам, гаранту, тематике, описанию и дате
        </p>
        <div className="grid gap-3 min-w-0 grid-cols-1 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Ник пользователя
            </label>
            <input
              type="text"
              placeholder="Поиск по нику"
              value={usernameSearch}
              onChange={(e) => setUsernameSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyleModal}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Верифицирован
            </label>
            <select
              value={verified}
              onChange={(e) => setVerified((e.target.value || "") as "" | "yes" | "no")}
              className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
              style={inputStyleModal}
            >
              <option value="">Любой</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Цена (₽), от — до
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
              Охват, от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={reachFrom}
                onChange={(e) => setReachFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyleModal}
              />
              <input
                type="text"
                placeholder="До"
                value={reachTo}
                onChange={(e) => setReachTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyleModal}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Подписчиков, от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={subscribersFrom}
                onChange={(e) => setSubscribersFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyleModal}
              />
              <input
                type="text"
                placeholder="До"
                value={subscribersTo}
                onChange={(e) => setSubscribersTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyleModal}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Согласен на гаранта
            </label>
            <select
              value={viaGuarantor}
              onChange={(e) => setViaGuarantor((e.target.value || "") as "" | "yes" | "no")}
              className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
              style={inputStyleModal}
            >
              <option value="">Любой</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
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
          <div className="min-w-0 sm:col-span-2">
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
              Дата, от
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
              Дата, до
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
          Заявок на покупку пока нет.
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
                <BuyChannelCard
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
    </section>
  );
}
