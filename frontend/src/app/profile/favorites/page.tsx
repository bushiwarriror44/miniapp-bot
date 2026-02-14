"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faStar, faCheck, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { AD_TYPE_LABELS, PAYMENT_LABELS, type AdItem } from "@/shared/api/ads";
import { formatServiceDate } from "@/shared/api/services";
import { getTelegramWebApp } from "@/shared/api/client";
import { fetchUserFavorites } from "@/shared/api/users";

function FavoriteAdCard({ ad }: { ad: AdItem }) {
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
      <div className="flex gap-3">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt=""
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center text-xs"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}
          >
            Нет фото
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>
            {AD_TYPE_LABELS[ad.adType]}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
              @{ad.username}
            </span>
            {ad.verified && (
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" style={{ color: "var(--color-accent)" }} />
            )}
          </div>
          <a
            href={ad.channelOrChatLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs inline-flex items-center gap-1 truncate max-w-full"
            style={{ color: "var(--color-accent)" }}
          >
            Ссылка на канал/чат
            <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Цена:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.price.toLocaleString("ru-RU")} ₽</span>
        <span style={{ color: "var(--color-text-muted)" }}>С закрепом:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.pinned ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Под гарант:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.underGuarantee ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Время:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.publishTime}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Стоит пост:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.postDuration}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Оплата:</span>
        <span style={{ color: "var(--color-text)" }}>{PAYMENT_LABELS[ad.paymentMethod]}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.theme}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(ad.publishedAt)}</span>
      </div>
      {ad.description && (
        <p className="text-xs pt-1 border-t" style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}>
          {ad.description}
        </p>
      )}
    </article>
  );
}

export default function ProfileFavoritesPage() {
  const [favoriteAds, setFavoriteAds] = useState<AdItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const telegramId = useMemo(() => {
    const telegram = getTelegramWebApp();
    const userId = telegram?.initDataUnsafe?.user?.id;
    return userId ? String(userId) : "";
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
        {favoriteAds.length > 0 ? (
          <div className="space-y-3">
            {favoriteAds.map((ad) => (
              <FavoriteAdCard key={ad.id} ad={ad} />
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
