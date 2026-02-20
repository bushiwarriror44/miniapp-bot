"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { fetchUserListingsPaginated, type UserListingItem } from "@/shared/api/user-listings";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";

const SECTION_LABELS: Record<string, string> = {
  "sell-ads": "Продажа рекламы",
  "buy-ads": "Покупка рекламы",
  jobs: "Вакансии",
  designers: "Услуги",
  currency: "Обмен валют",
  "sell-channel": "Продажа канала",
  "buy-channel": "Покупка канала",
  other: "Другое",
};

const PAGE_SIZE = 20;

function ListingSkeleton() {
  return (
    <div
      className="rounded-lg p-3 animate-pulse"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <div
        className="h-3 rounded w-1/3 mb-2"
        style={{ backgroundColor: "var(--color-border)" }}
      />
      <div
        className="h-4 rounded w-full"
        style={{ backgroundColor: "var(--color-border)" }}
      />
    </div>
  );
}

export default function UserListingsPage() {
  const params = useParams();
  const idFromUrl = (params?.id as string) ?? "";
  const cleanedUsername = idFromUrl.toString().trim().replace(/^@/, "");

  const [listings, setListings] = useState<UserListingItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFirstPage = useCallback(async () => {
    if (!cleanedUsername) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setListings([]);
    setNextCursor(null);
    try {
      const res = await fetchUserListingsPaginated(cleanedUsername, {
        limit: PAGE_SIZE,
      });
      setListings(res.items ?? []);
      setNextCursor(res.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setListings([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [cleanedUsername]);

  useEffect(() => {
    const t = setTimeout(() => loadFirstPage(), 0);
    return () => clearTimeout(t);
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!cleanedUsername || loadMoreLoading || nextCursor == null) return;
    setLoadMoreLoading(true);
    try {
      const res = await fetchUserListingsPaginated(cleanedUsername, {
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });
      setListings((prev) => [...prev, ...(res.items ?? [])]);
      setNextCursor(res.nextCursor);
    } catch {
      setNextCursor(null);
    } finally {
      setLoadMoreLoading(false);
    }
  }, [cleanedUsername, nextCursor, loadMoreLoading]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: nextCursor != null && nextCursor !== "",
    loading: loadMoreLoading,
  });

  const profileUrl = `/profile/user/${encodeURIComponent(cleanedUsername || idFromUrl)}`;

  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--color-bg)" }}>
      <Link
        href={profileUrl}
        className="inline-flex items-center gap-2 text-sm font-medium mb-4"
        style={{ color: "var(--color-accent)", textDecoration: "none" }}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        Назад
      </Link>

      <h1 className="text-xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>
        Активные объявления пользователя
      </h1>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <ListingSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {error}
        </p>
      )}

      {!loading && !error && listings.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Нет активных объявлений.
        </p>
      )}

      {!loading && !error && listings.length > 0 && (
        <>
          <div className="space-y-2">
            {listings.map((listing) => (
              <Link
                key={`${listing.section}-${listing.id}`}
                href={`/exchange/view?section=${encodeURIComponent(listing.section)}&id=${encodeURIComponent(listing.id)}`}
                className="block rounded-lg p-3 no-underline"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-accent)" }}
                >
                  {SECTION_LABELS[listing.section] ?? listing.section}
                </span>
                <p className="text-sm mt-1 mb-0 line-clamp-2" style={{ color: "var(--color-text)" }}>
                  {listing.title || "Без названия"}
                </p>
              </Link>
            ))}
          </div>
          {loadMoreLoading && (
            <div className="space-y-2 mt-4">
              {[1, 2, 3].map((i) => (
                <ListingSkeleton key={`more-${i}`} />
              ))}
            </div>
          )}
          <div ref={sentinelRef} className="h-2 mt-2" aria-hidden />
        </>
      )}
    </main>
  );
}
