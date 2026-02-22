"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFilterCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { fetchServicesPaginated, type ServiceItem } from "@/shared/api/services";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import { inputStyleModal, EXCHANGE_PAGE_SIZE } from "../constants";
import { toErrorMessage } from "../formHelpers";
import { ServiceCard, ExchangeCardSkeleton } from "../cards";

export function DesignersSection({ hotItemIds }: { hotItemIds?: Set<string> }) {
  const router = useRouter();
  const [titleSearch, setTitleSearch] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [verified, setVerified] = useState<"" | "yes" | "no">("");
  const [usernameSearch, setUsernameSearch] = useState("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadFirstPage = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setServices([]);
    setNextCursor(null);
    fetchServicesPaginated({
      theme: themeSearch.trim() || undefined,
      priceFrom: priceFrom.trim() || undefined,
      priceTo: priceTo.trim() || undefined,
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setServices(res.services ?? []);
          setNextCursor(res.nextCursor);
        } else {
          setServices([]);
          setNextCursor(null);
        }
      })
      .catch((error) => {
        setServices([]);
        setNextCursor(null);
        setLoadError(toErrorMessage(error));
      })
      .finally(() => setLoading(false));
  }, [themeSearch, priceFrom, priceTo, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => loadFirstPage(), 0);
    return () => clearTimeout(t);
  }, [loadFirstPage]);

  const loadMore = useCallback(() => {
    if (loadMoreLoading || nextCursor == null) return;
    setLoadMoreLoading(true);
    fetchServicesPaginated({
      theme: themeSearch.trim() || undefined,
      priceFrom: priceFrom.trim() || undefined,
      priceTo: priceTo.trim() || undefined,
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
      cursor: nextCursor,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setServices((prev) => [...prev, ...(res.services ?? [])]);
          setNextCursor(res.nextCursor);
        }
      })
      .catch(() => {})
      .finally(() => setLoadMoreLoading(false));
  }, [nextCursor, loadMoreLoading, themeSearch, priceFrom, priceTo, dateFrom, dateTo]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: nextCursor != null && nextCursor !== "",
    loading: loadMoreLoading,
  });

  const filteredServices = services.filter((s) => {
    if (titleSearch.trim() && !s.title.toLowerCase().includes(titleSearch.trim().toLowerCase())) return false;
    const from = priceFrom.trim() ? Number(priceFrom) : null;
    const to = priceTo.trim() ? Number(priceTo) : null;
    if (from != null && s.price < from) return false;
    if (to != null && s.price > to) return false;
    if (verified === "yes" && !s.verified) return false;
    if (verified === "no" && s.verified) return false;
    if (usernameSearch.trim() && !s.username.toLowerCase().includes(usernameSearch.trim().toLowerCase())) return false;
    if (descriptionSearch.trim() && !s.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase())) return false;
    if (dateFrom.trim() && s.publishedAt < dateFrom) return false;
    if (dateTo.trim() && s.publishedAt > dateTo) return false;
    return true;
  });

  const handleOpenView = useCallback((id: string) => {
    router.push(`/exchange/view?section=designers&id=${encodeURIComponent(id)}`);
  }, [router]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Дизайнеры / монтажеры
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
          Фильтр по названию, цене, верификации, юзернейму, тематике, описанию и дате.
        </p>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Название услуги
          </label>
          <input
            type="text"
            placeholder="Сделаю монтаж, зарегистрирую кошелек..."
            value={titleSearch}
            onChange={(e) => setTitleSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyleModal}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Цена, от — до
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
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Верифицированный
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
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Юзернейм
          </label>
          <input
            type="text"
            placeholder="Поиск по юзернейму..."
            value={usernameSearch}
            onChange={(e) => setUsernameSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyleModal}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Тематика
          </label>
          <input
            type="text"
            placeholder="Например: видео, дизайн"
            value={themeSearch}
            onChange={(e) => setThemeSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyleModal}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Поиск по описанию
          </label>
          <input
            type="text"
            placeholder="Текст в описании..."
            value={descriptionSearch}
            onChange={(e) => setDescriptionSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyleModal}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Дата публикации, от — до
          </label>
          <div className="flex gap-2 min-w-0">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyleModal}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyleModal}
            />
          </div>
        </div>
      </div>
      )}

      <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--color-text)" }}>
        Услуги
      </h3>
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
      {!loading && services.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Услуг пока нет.
        </p>
      )}
      {!loading && services.length > 0 && filteredServices.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          По фильтрам ничего не найдено.
        </p>
      )}
      {!loading && filteredServices.length > 0 && (
        <>
          <div className="space-y-3">
            {filteredServices.map((s) => (
              <div key={s.id}>
                <ServiceCard
                  service={s}
                  isHot={hotItemIds?.has(String(s.id))}
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
