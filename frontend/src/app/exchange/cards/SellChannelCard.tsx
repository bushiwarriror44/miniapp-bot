"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink, faFire } from "@fortawesome/free-solid-svg-icons";
import type { SellChannelItem } from "@/shared/api/sellChannels";
import { formatServiceDate } from "@/shared/api/services";
import { safeLocaleNumber } from "@/shared/format";
import VerifiedBadge from "@/app/components/VerifiedBadge";

export function SellChannelCard({
  channel,
  isHot,
  onOpenView,
}: { channel: SellChannelItem; isHot?: boolean; onOpenView?: (id: string) => void }) {
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => onOpenView?.(channel.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpenView?.(channel.id))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
      <div className="flex gap-3">
        {channel.imageUrl ? (
          <img
            src={channel.imageUrl}
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
          <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
            {channel.name}
          </p>
          <a
            href={channel.usernameLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs mt-0.5"
            style={{ color: "var(--color-accent)" }}
            onClick={(e) => e.stopPropagation()}
          >
            @{channel.username}
            {channel.verified && <VerifiedBadge />}
          </a>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Подписчиков:</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(channel.subscribers)}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Охват:</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(channel.reach)}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Цена:</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(channel.price)} ₽</span>
        <span style={{ color: "var(--color-text-muted)" }}>Через гаранта:</span>
        <span style={{ color: "var(--color-text)" }}>{channel.viaGuarantor ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
        <span style={{ color: "var(--color-text)" }}>{channel.theme}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(channel.publishedAt)}</span>
      </div>
      {channel.description && (
        <p
          className="text-xs pt-2 border-t"
          style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
        >
          {channel.description}
        </p>
      )}
    </article>
  );
}
