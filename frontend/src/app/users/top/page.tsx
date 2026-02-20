"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { fetchTopUsersPaginated, type TopUser } from "@/shared/api/top-users";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";

const PAGE_SIZE = 20;

function UserRow({ user }: { user: TopUser }) {
  const content = (
    <div
      className="flex items-center gap-3 py-2.5 border-b border-(--color-border) last:border-b-0 transition-opacity"
      style={{ borderColor: "var(--color-border)" }}
    >
      <span
        className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
      >
        {user.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate" style={{ color: "var(--color-text)" }}>
          {user.name}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {user.dealsCount} сделок
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-sm" style={{ color: "var(--color-accent)" }}>
          ★ {user.rating.toFixed(2)}
        </p>
      </div>
    </div>
  );

  if (user.username) {
    return (
      <Link
        href={`/profile/user/${encodeURIComponent(user.username)}`}
        className="block hover:opacity-80 transition-opacity"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {content}
      </Link>
    );
  }

  return content;
}

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-3 py-2.5 border-b border-(--color-border)"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div
        className="w-7 h-7 rounded-full shrink-0 animate-pulse"
        style={{ backgroundColor: "var(--color-surface)" }}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div
          className="h-4 w-24 rounded animate-pulse"
          style={{ backgroundColor: "var(--color-surface)" }}
        />
        <div
          className="h-3 w-16 rounded animate-pulse"
          style={{ backgroundColor: "var(--color-surface)" }}
        />
      </div>
      <div
        className="h-4 w-10 rounded animate-pulse shrink-0"
        style={{ backgroundColor: "var(--color-surface)" }}
      />
    </div>
  );
}

export default function TopUsersFullPage() {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    setLoadMoreLoading(true);
    try {
      const res = await fetchTopUsersPaginated(nextCursor ?? undefined, PAGE_SIZE);
      setUsers((prev) => [...prev, ...res.users]);
      setNextCursor(res.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadMoreLoading(false);
    }
  }, [nextCursor]);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTopUsersPaginated(undefined, PAGE_SIZE);
      setUsers(res.users);
      setNextCursor(res.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setUsers([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: nextCursor != null && nextCursor !== "",
    loading: loadMoreLoading,
  });

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <Link
          href="/"
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            textDecoration: "none",
          }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        </Link>
        <h1 className="font-semibold text-base flex items-center gap-2" style={{ color: "var(--color-text)" }}>
          <FontAwesomeIcon icon={faTrophy} className="w-4 h-4 shrink-0" />
          Топ пользователей
        </h1>
      </header>

      <div className="flex-1 overflow-auto px-4 py-4">
        {error && (
          <p className="text-sm mb-3" style={{ color: "#ef4444" }}>
            Ошибка загрузки: {error}
          </p>
        )}
        {loading ? (
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: "var(--color-text-muted)" }}>
            Нет данных о пользователях.
          </p>
        ) : (
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            {users.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
            {loadMoreLoading && (
              <div className="pt-2">
                {[1, 2, 3].map((i) => (
                  <SkeletonRow key={`more-${i}`} />
                ))}
              </div>
            )}
            <div ref={sentinelRef} className="h-2 shrink-0" aria-hidden />
          </div>
        )}
      </div>
    </main>
  );
}
