"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink, faFire } from "@fortawesome/free-solid-svg-icons";
import type { CurrencyItem } from "@/shared/api/currency";
import VerifiedBadge from "@/app/components/VerifiedBadge";

export function CurrencyCard({
  item,
  isHot,
  onOpenView,
}: {
  item: CurrencyItem;
  isHot?: boolean;
  onOpenView?: (id: string) => void;
}) {
  const rawLinks = Array.isArray(item.additionalLinks) ? item.additionalLinks : [];
  const links = rawLinks
    .map((l, idx) => {
      if (typeof l === "string") return { url: l, label: `Ссылка ${idx + 1}` };
      if (l && typeof l === "object") {
        const url = "url" in l ? (l as { url?: unknown }).url : undefined;
        const label = "label" in l ? (l as { label?: unknown }).label : undefined;
        if (typeof url === "string" && url.trim()) {
          return { url: url.trim(), label: typeof label === "string" && label.trim() ? label.trim() : `Ссылка ${idx + 1}` };
        }
      }
      return null;
    })
    .filter(Boolean) as { url: string; label: string }[];

  const rateText =
    item.rate != null && String(item.rate).trim()
      ? String(item.rate).trim()
      : item.price != null && String(item.price).trim()
        ? String(item.price).trim()
        : "";

  const subtitleText =
    (item.subtitle && String(item.subtitle).trim()) ||
    (item.description && String(item.description).trim()) ||
    "";

  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => onOpenView?.(String(item.id))}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpenView?.(String(item.id)))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate" style={{ color: "var(--color-text)" }}>
            {item.title || "Обмен валют"}
          </p>
          {rateText && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Курс: <span style={{ color: "var(--color-text)" }}>{rateText}</span>
            </p>
          )}
        </div>
      </div>

      {(item.usernameLink || item.username) && (
        <div className="flex items-center gap-2 flex-wrap">
          {item.usernameLink ? (
            <a
              href={item.usernameLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs"
              style={{ color: "var(--color-accent)" }}
              onClick={(e) => e.stopPropagation()}
            >
              @{(item.username || "").replace(/^@/, "") || "контакт"}
              {item.verified && <VerifiedBadge />}
            </a>
          ) : (
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              @{String(item.username || "").replace(/^@/, "")}
            </span>
          )}

          {item.reviewsUrl && (
            <a
              href={item.reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
              style={{
                color: "var(--color-accent)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg-elevated)",
                borderRadius: 9999,
                padding: "2px 8px",
                fontSize: 12,
                lineHeight: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Отзывы"
            >
              Отзывы
              <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {subtitleText && (
        <p className="text-xs pt-2 border-t" style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}>
          {subtitleText}
        </p>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map((l) => (
            <a
              key={`${l.url}-${l.label}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 12,
                lineHeight: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

    </article>
  );
}
