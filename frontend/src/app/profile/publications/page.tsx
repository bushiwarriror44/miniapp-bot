"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faClipboard, faCheckCircle, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { getTelegramWebApp } from "@/shared/api/client";
import { fetchMyPublicationsPaginated, type MyPublicationItem } from "@/shared/api/users";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";

function formatPublicationDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function publicationTitle(item: MyPublicationItem): string {
  const fd = item.formData;
  const theme = typeof fd?.theme === "string" ? fd.theme.trim() : "";
  const description = typeof fd?.description === "string" ? fd.description.trim() : "";
  if (theme) return theme.length > 80 ? theme.slice(0, 77) + "…" : theme;
  if (description) return description.length > 80 ? description.slice(0, 77) + "…" : description;
  return "Без названия";
}

function PublicationSkeleton() {
  return (
    <div
      className="rounded-xl p-3 border animate-pulse"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        className="h-4 rounded mb-2"
        style={{ backgroundColor: "var(--color-surface)", width: "75%" }}
      />
      <div
        className="h-3 rounded mb-2"
        style={{ backgroundColor: "var(--color-surface)", width: "50%" }}
      />
      <div
        className="h-3 rounded"
        style={{ backgroundColor: "var(--color-surface)", width: "30%" }}
      />
    </div>
  );
}

function PublicationCard({ item }: { item: MyPublicationItem }) {
  return (
    <Link
      href={`/profile/publications/${item.id}`}
      className="block rounded-xl p-3 border transition-opacity hover:opacity-80"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        borderColor: "var(--color-border)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
        {publicationTitle(item)}
      </p>
      <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
        {formatPublicationDate(item.createdAt)}
      </p>
      {item.status === "pending" && (
        <span
          className="inline-block rounded-lg px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-accent)",
          }}
        >
          на модерации
        </span>
      )}
      {item.status === "approved" && (
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium"
          style={{ color: "#16a34a" }}
        >
          <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" style={{ color: "#16a34a" }} />
          Опубликовано
        </span>
      )}
      {item.status === "rejected" && (
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium"
          style={{ color: "#dc2626" }}
        >
          <FontAwesomeIcon icon={faXmarkCircle} className="w-3 h-3" style={{ color: "#dc2626" }} />
          Отклонено
        </span>
      )}
    </Link>
  );
}

const PAGE_SIZE = 20;

export default function PublicationsPage() {
  const [publications, setPublications] = useState<MyPublicationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const telegramId = useMemo(() => {
    const telegram = getTelegramWebApp();
    const userId = telegram?.initDataUnsafe?.user?.id;
    return userId ? String(userId) : "";
  }, []);

  const loadMore = useCallback(async () => {
    if (!telegramId) return;
    setLoadMoreLoading(true);
    try {
      const res = await fetchMyPublicationsPaginated(telegramId, nextCursor ?? undefined, PAGE_SIZE);
      setPublications((prev) => [...prev, ...res.publications]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadMoreLoading(false);
    }
  }, [telegramId, nextCursor]);

  const initialLoad = useCallback(async () => {
    if (!telegramId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchMyPublicationsPaginated(telegramId, undefined, PAGE_SIZE);
      setPublications(res.publications);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setPublications([]);
      setNextCursor(null);
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: nextCursor != null && nextCursor !== "",
    loading: loadMoreLoading,
  });

  return (
    <main className="px-4 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-medium mb-4"
        style={{ color: "var(--color-accent)" }}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        Назад в профиль
      </Link>

      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h1 className="font-semibold mb-3 flex items-center gap-2 text-lg" style={{ color: "var(--color-text)" }}>
          <FontAwesomeIcon icon={faClipboard} className="w-4 h-4 shrink-0" style={{ color: "var(--color-accent)" }} />
          Ваши публикации
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <PublicationSkeleton key={i} />
            ))}
          </div>
        ) : loadError ? (
          <p className="text-sm" style={{ color: "var(--color-accent)" }}>
            Ошибка загрузки публикаций: {loadError}
          </p>
        ) : publications.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            У вас пока нет публикаций.
          </p>
        ) : (
          <>
            <ul className="space-y-3 list-none p-0 m-0 mb-4">
              {publications.map((item) => (
                <li key={item.id}>
                  <PublicationCard item={item} />
                </li>
              ))}
            </ul>
            {loadMoreLoading && (
              <div className="space-y-3 mb-4">
                {[1, 2, 3].map((i) => (
                  <PublicationSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}
            <div ref={sentinelRef} className="h-2" aria-hidden />
          </>
        )}
      </section>
    </main>
  );
}
