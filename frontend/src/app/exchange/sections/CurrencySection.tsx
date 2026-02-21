"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrencyPaginated, type CurrencyItem } from "@/shared/api/currency";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import { EXCHANGE_PAGE_SIZE } from "../constants";
import { toErrorMessage } from "../formHelpers";
import { CurrencyCard, CurrencyCardSkeleton, ExchangeCardSkeleton } from "../cards";

export function CurrencySection({ hotItemIds }: { hotItemIds?: Set<string> }) {
  const router = useRouter();
  const [items, setItems] = useState<CurrencyItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFirstPage = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setItems([]);
    setNextCursor(null);
    fetchCurrencyPaginated({ limit: EXCHANGE_PAGE_SIZE })
      .then((res) => {
        if (res) {
          setItems(res.currency ?? []);
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
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadFirstPage(), 0);
    return () => clearTimeout(t);
  }, [loadFirstPage]);

  const loadMore = useCallback(() => {
    if (loadMoreLoading || nextCursor == null) return;
    setLoadMoreLoading(true);
    fetchCurrencyPaginated({ cursor: nextCursor, limit: EXCHANGE_PAGE_SIZE })
      .then((res) => {
        if (res) {
          setItems((prev) => [...prev, ...(res.currency ?? [])]);
          setNextCursor(res.nextCursor);
        }
      })
      .catch(() => {})
      .finally(() => setLoadMoreLoading(false));
  }, [nextCursor, loadMoreLoading]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: nextCursor != null && nextCursor !== "",
    loading: loadMoreLoading,
  });

  const handleOpenView = useCallback((id: string) => {
    router.push(`/exchange/view?section=currency&id=${encodeURIComponent(id)}`);
  }, [router]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Обмен валют
        </h2>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <CurrencyCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && loadError && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          Ошибка загрузки: {loadError}
        </div>
      )}

      {!loading && !loadError && items.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Пока нет доступных обменов.
        </p>
      )}

      {!loading && !loadError && items.length > 0 && (
        <>
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id}>
                <CurrencyCard
                  item={it}
                  isHot={hotItemIds?.has(String(it.id))}
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
