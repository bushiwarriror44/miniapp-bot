"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink, faFire } from "@fortawesome/free-solid-svg-icons";
import {
  JOB_OFFER_TYPE_LABELS,
  EMPLOYMENT_LABELS,
  type JobItem,
} from "@/shared/api/jobs";
import { formatServiceDate } from "@/shared/api/services";
import { getJobTypeLabel, getCurrencyLabel, type ExchangeOptionsPayload } from "@/shared/api/exchangeOptions";

export function JobCard({
  job,
  exchangeOptions,
  isHot,
  onOpenView,
}: {
  job: JobItem;
  exchangeOptions: ExchangeOptionsPayload | null;
  isHot?: boolean;
  onOpenView?: (id: string) => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => onOpenView?.(job.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpenView?.(job.id))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
      <p className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
        {JOB_OFFER_TYPE_LABELS[job.offerType]}
      </p>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
          {getJobTypeLabel(job.work, exchangeOptions)}
        </p>
        <a
          href={job.usernameLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs inline-flex items-center gap-1 shrink-0"
          style={{ color: "var(--color-accent)" }}
          onClick={(e) => e.stopPropagation()}
        >
          Профиль
          <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Портфолио:</span>
        <span style={{ color: "var(--color-text)" }}>
          {job.portfolioUrl ? (
            <a
              href={job.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5"
              style={{ color: "var(--color-accent)" }}
              onClick={(e) => e.stopPropagation()}
            >
              Ссылка
              <FontAwesomeIcon icon={faExternalLink} className="w-2.5 h-2.5" />
            </a>
          ) : (
            "—"
          )}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Тип занятости:</span>
        <span style={{ color: "var(--color-text)" }}>{EMPLOYMENT_LABELS[job.employmentType]}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Оплата:</span>
        <span style={{ color: "var(--color-text)" }}>
          {job.paymentAmount} {getCurrencyLabel(job.paymentCurrency, exchangeOptions)}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
        <span style={{ color: "var(--color-text)" }}>{job.theme}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(job.publishedAt)}</span>
      </div>
      {job.description && (
        <p
          className="text-xs pt-2 border-t"
          style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
        >
          {job.description}
        </p>
      )}
    </article>
  );
}
