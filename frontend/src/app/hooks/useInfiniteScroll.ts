"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseInfiniteScrollOptions {
  onLoadMore: () => void | Promise<void>;
  hasMore: boolean;
  loading?: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading = false,
  root = null,
  rootMargin = "100px",
  threshold = 0,
}: UseInfiniteScrollOptions) {
  const [sentinelRef, setSentinelRef] = useState<HTMLElement | null>(null);
  const loadingRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const handleLoadMore = useCallback(async () => {
    if (loadingRef.current || loading || !hasMore) return;
    loadingRef.current = true;
    try {
      await onLoadMoreRef.current();
    } finally {
      loadingRef.current = false;
    }
  }, [loading, hasMore]);

  useEffect(() => {
    const el = sentinelRef;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        handleLoadMore();
      },
      { root, rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelRef, hasMore, root, rootMargin, threshold, handleLoadMore]);

  return { sentinelRef: setSentinelRef };
}
