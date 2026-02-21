"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFilterCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { fetchOtherPaginated, type OtherItem } from "@/shared/api/other";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import { inputStyleModal, EXCHANGE_PAGE_SIZE } from "../constants";
import { toErrorMessage } from "../formHelpers";
import { OtherCard, ExchangeCardSkeleton } from "../cards";

export function OtherSection({ hotItemIds }: { hotItemIds?: Set<string> }) {
  const router = useRouter();
  const [usernameSearch, setUsernameSearch] = useState("");
  const [verified, setVerified] = useState<"" | "yes" | "no">("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [items, setItems] = useState<OtherItem[]>([]);
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
    fetchOtherPaginated({
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setItems(res.other ?? []);
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
  }, [dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => loadFirstPage(), 0);
    return () => clearTimeout(t);
  }, [loadFirstPage]);

  const loadMore = useCallback(() => {
    if (loadMoreLoading || nextCursor == null) return;
    setLoadMoreLoading(true);
    fetchOtherPaginated({
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
      cursor: nextCursor,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setItems((prev) => [...prev, ...(res.other ?? [])]);
          setNextCursor(res.nextCursor);
        }
      })
      .catch(() => {})
      .finally(() => setLoadMoreLoading(false));
  }, [nextCursor, loadMoreLoading, dateFrom, dateTo]);

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
    if (pFrom != null && !Number.isNaN(pFrom) && item.price < pFrom) return false;
    if (pTo != null && !Number.isNaN(pTo) && item.price > pTo) return false;
    const descMatch = !descriptionSearch.trim() || item.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase());
    if (!descMatch) return false;
    return true;
  });

  const handleOpenView = useCallback((id: string) => {
    router.push(`/exchange/view?section=other&id=${encodeURIComponent(id)}`);
  }, [router]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Другое
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
          Фильтр по юзернейму, верификации, цене, описанию и дате публикации.
        </p>
        <div className="grid gap-3 min-w-0 grid-cols-1 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Юзернейм пользователя
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
              Цена, от — до (₽)
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="number"
                placeholder="От"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyleModal}
              />
              <input
                type="number"
                placeholder="До"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyleModal}
              />
            </div>
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
          Товаров и услуг пока нет.
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
                <OtherCard
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
