"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faClipboard, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { getTelegramWebApp } from "@/shared/api/client";
import { fetchMyPublications, type MyPublicationItem } from "@/shared/api/users";

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
          className="inline-block rounded-lg px-2 py-0.5 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          Опубликовано
        </span>
      )}
      {item.status === "rejected" && (
        <span
          className="inline-block rounded-lg px-2 py-0.5 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          Отклонено
        </span>
      )}
    </Link>
  );
}

export default function PublicationsPage() {
  const [publications, setPublications] = useState<MyPublicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const telegramId = useMemo(() => {
    const telegram = getTelegramWebApp();
    const userId = telegram?.initDataUnsafe?.user?.id;
    return userId ? String(userId) : "";
  }, []);

  useEffect(() => {
    if (!telegramId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchMyPublications(telegramId)
      .then((list) => {
        setPublications(list);
        setLoadError(null);
      })
      .catch((err) => {
        console.error("Failed to load publications:", err);
        setPublications([]);
        setLoadError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [telegramId]);

  const totalPages = Math.ceil(publications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedPublications = publications.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
            {[...Array(3)].map((_, i) => (
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
              {displayedPublications.map((item) => (
                <li key={item.id}>
                  <PublicationCard item={item} />
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentPage === 1 ? "var(--color-surface)" : "var(--color-accent)",
                    color: currentPage === 1 ? "var(--color-text-muted)" : "white",
                  }}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
                  Назад
                </button>

                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Страница {currentPage} из {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentPage === totalPages ? "var(--color-surface)" : "var(--color-accent)",
                    color: currentPage === totalPages ? "var(--color-text-muted)" : "white",
                  }}
                >
                  Вперед
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
