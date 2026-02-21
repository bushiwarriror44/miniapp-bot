"use client";

import { useCallback, useEffect, useState } from "react";
import { useInfiniteScroll } from "./useInfiniteScroll";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export interface UseExchangeSectionListOptions<T> {
  fetchFirst: () => Promise<{ items: T[]; nextCursor: string | null }>;
  fetchNext: (cursor: string) => Promise<{ items: T[]; nextCursor: string | null }>;
}

export function useExchangeSectionList<T>({
  fetchFirst,
  fetchNext,
}: UseExchangeSectionListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFirstPage = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setItems([]);
    setNextCursor(null);
    fetchFirst()
      .then((res) => {
        setItems(res.items);
        setNextCursor(res.nextCursor);
      })
      .catch((err) => {
        setLoadError(toErrorMessage(err));
        setItems([]);
        setNextCursor(null);
      })
      .finally(() => setLoading(false));
  }, [fetchFirst]);

  useEffect(() => {
    const t = setTimeout(() => loadFirstPage(), 0);
    return () => clearTimeout(t);
  }, [loadFirstPage]);

  const loadMore = useCallback(() => {
    if (loadMoreLoading || nextCursor == null) return;
    setLoadMoreLoading(true);
    fetchNext(nextCursor)
      .then((res) => {
        setItems((prev) => [...prev, ...res.items]);
        setNextCursor(res.nextCursor);
      })
      .catch(() => {})
      .finally(() => setLoadMoreLoading(false));
  }, [nextCursor, loadMoreLoading, fetchNext]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: nextCursor != null && nextCursor !== "",
    loading: loadMoreLoading,
  });

  return {
    items,
    loading,
    loadMoreLoading,
    loadError,
    loadFirstPage,
    sentinelRef,
  };
}
