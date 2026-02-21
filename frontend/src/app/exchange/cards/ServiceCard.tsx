"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { type ServiceItem } from "@/shared/api/services";
import { formatServiceDate } from "@/shared/api/services";
import { safeLocaleNumber } from "@/shared/format";
import VerifiedBadge from "@/app/components/VerifiedBadge";

export function ServiceCard({
  service,
  isHot,
  onOpenView,
}: { service: ServiceItem; isHot?: boolean; onOpenView?: (id: string) => void }) {
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => onOpenView?.(service.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpenView?.(service.id))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm flex-1 min-w-0" style={{ color: "var(--color-text)" }}>
          {service.title}
        </p>
        {service.verified && <VerifiedBadge />}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm" style={{ color: "var(--color-accent)" }}>
          {safeLocaleNumber(service.price)} ₽
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          @{service.username}
        </span>
      </div>
      <div className="text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Тематика: </span>
        <span style={{ color: "var(--color-text)" }}>{service.theme}</span>
      </div>
      {service.description && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {service.description}
        </p>
      )}
      <p className="text-xs pt-1 border-t" style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}>
        Опубликовано: {formatServiceDate(service.publishedAt)}
      </p>
    </article>
  );
}
