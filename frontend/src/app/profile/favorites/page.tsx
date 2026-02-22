"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faStar, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { getTelegramWebApp } from "@/shared/api/client";
import { fetchUserFavorites, type FavoriteAdItem } from "@/shared/api/users";
import { SECTIONS } from "@/app/exchange/constants";

const SECTION_LABEL_MAP: Record<string, string> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s.label]),
);

function FavoriteItemCard({ fav }: { fav: FavoriteAdItem }) {
  const sectionLabel = SECTION_LABEL_MAP[fav.section] ?? fav.section;
  const viewHref = `/exchange/view?section=${encodeURIComponent(fav.section)}&id=${encodeURIComponent(fav.itemId)}`;

  return (
    <article
      className="relative rounded-xl p-4 space-y-3 min-w-0"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <span
        className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "var(--color-accent)", color: "white" }}
        aria-hidden
      >
        <FontAwesomeIcon icon={faStar} className="w-3.5 h-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>
          {sectionLabel}
        </p>
        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
          {fav.theme || "Объявление из избранного"}
        </p>
        <Link
          href={viewHref}
          className="text-xs inline-flex items-center gap-1"
          style={{ color: "var(--color-accent)" }}
        >
          Открыть объявление
          <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3 shrink-0" />
        </Link>
      </div>
    </article>
  );
}

export default function ProfileFavoritesPage() {
  const [favoriteAds, setFavoriteAds] = useState<AdItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const telegramId = useMemo(() => {
    const telegram = getTelegramWebApp();
    const user = telegram?.initDataUnsafe?.user;
    const userId = user != null && "id" in user ? (user as { id: number }).id : undefined;
    return userId != null ? String(userId) : "";
  }, []);

  useEffect(() => {
    if (!telegramId) {
      return;
    }
    fetchUserFavorites(telegramId)
      .then((items) => {
        setFavoriteAds(items as AdItem[]);
        setLoadError(null);
      })
      .catch((error) => {
        console.error("Failed to load favorites:", error);
        setFavoriteAds([]);
        setLoadError(error instanceof Error ? error.message : String(error));
      });
  }, [telegramId]);

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
        
      >
        <h1 className="font-semibold mb-3 flex items-center gap-2 text-lg" style={{ color: "var(--color-text)" }}>
          <FontAwesomeIcon icon={faStar} className="w-4 h-4 shrink-0" style={{ color: "var(--color-accent)" }} />
          Избранное
        </h1>
        {favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <FavoriteItemCard key={`${fav.section}:${fav.itemId}`} fav={fav} />
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            В избранном пока ничего нет.
          </p>
        )}
        {loadError && (
          <p className="text-xs mt-2" style={{ color: "var(--color-accent)" }}>
            Ошибка загрузки избранного: {loadError}
          </p>
        )}
      </section>
    </main>
  );
}
