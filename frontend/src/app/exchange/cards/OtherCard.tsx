"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink, faFire } from "@fortawesome/free-solid-svg-icons";
import type { OtherItem } from "@/shared/api/other";
import { formatServiceDate } from "@/shared/api/services";
import { safeLocaleNumber } from "@/shared/format";
import VerifiedBadge from "@/app/components/VerifiedBadge";

export function OtherCard({
  item,
  isHot,
  onOpenView,
}: { item: OtherItem; isHot?: boolean; onOpenView?: (id: string) => void }) {
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => onOpenView?.(item.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpenView?.(item.id))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/profile/user/${encodeURIComponent(item.username)}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium min-w-0"
          style={{ color: "var(--color-accent)" }}
          onClick={(e) => e.stopPropagation()}
        >
          @{item.username}
          <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3 shrink-0" />
        </Link>
        {item.verified && <VerifiedBadge />}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Верифицирован:</span>
        <span style={{ color: "var(--color-text)" }}>{item.verified ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Цена (₽):</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(item.price)}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(item.publishedAt)}</span>
      </div>
      {item.description && (
        <p
          className="text-xs pt-2 border-t"
          style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
        >
          {item.description}
        </p>
      )}
    </article>
  );
}
