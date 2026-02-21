"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink, faFire, faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { AD_TYPE_LABELS, PAYMENT_LABELS, type AdItem } from "@/shared/api/ads";
import { formatServiceDate } from "@/shared/api/services";
import { safeLocaleNumber } from "@/shared/format";
import VerifiedBadge from "@/app/components/VerifiedBadge";

export function AdCard({
  ad,
  isHot,
  onOpenView,
}: { ad: AdItem; isHot?: boolean; onOpenView?: (id: string) => void }) {
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => onOpenView?.(ad.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpenView?.(ad.id))}
    >
      {ad.pinned && (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }} aria-label="Закреплено">
          <FontAwesomeIcon icon={faThumbtack} className="w-3.5 h-3.5" />
          Закреплено
        </span>
      )}
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
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
            {ad.verified && <VerifiedBadge />}
          </div>
          <Link
            href={`/profile/user/${encodeURIComponent(ad.username)}`}
            className="text-xs inline-flex items-center gap-1 truncate max-w-full"
            style={{ color: "var(--color-accent)" }}
            onClick={(e) => e.stopPropagation()}
          >
            Открыть профиль
            <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3 shrink-0" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Цена:</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(ad.price)} ₽</span>
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
