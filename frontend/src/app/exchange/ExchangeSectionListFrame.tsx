"use client";

import { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFilterCircleXmark } from "@fortawesome/free-solid-svg-icons";

export function ExchangeCardSkeleton() {
  return (
    <div
      className="rounded-xl p-4 min-w-0 animate-pulse"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="h-4 rounded mb-2" style={{ backgroundColor: "var(--color-surface)", width: "80%" }} />
      <div className="h-3 rounded mb-2" style={{ backgroundColor: "var(--color-surface)", width: "50%" }} />
      <div className="h-3 rounded mb-2" style={{ backgroundColor: "var(--color-surface)", width: "40%" }} />
      <div className="h-3 rounded" style={{ backgroundColor: "var(--color-surface)", width: "30%" }} />
    </div>
  );
}

export interface ExchangeSectionListFrameProps {
  title: string;
  showFilters: boolean;
  onToggleFilters: () => void;
  filterPanel?: ReactNode;
  loading: boolean;
  loadError: string | null;
  hasItems: boolean;
  emptyMessage?: ReactNode;
  loadMoreLoading: boolean;
  sentinelRef: (el: HTMLElement | null) => void;
  children: ReactNode;
}

export function ExchangeSectionListFrame({
  title,
  showFilters,
  onToggleFilters,
  filterPanel,
  loading,
  loadError,
  hasItems,
  emptyMessage = "Объявлений пока нет.",
  loadMoreLoading,
  sentinelRef,
  children,
}: ExchangeSectionListFrameProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          {title}
        </h2>
        <button
          type="button"
          onClick={onToggleFilters}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && filterPanel && (
        <div
          className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          {filterPanel}
        </div>
      )}
      <div className="space-y-3">
        {loadError && (
          <p className="text-xs py-2" style={{ color: "#ef4444" }}>
            Ошибка загрузки: {loadError}
          </p>
        )}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <ExchangeCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!loading && !hasItems && (
          <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            {emptyMessage}
          </p>
        )}
        {!loading && hasItems && (
          <>
            {children}
            {loadMoreLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <ExchangeCardSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}
            <div ref={sentinelRef} className="h-2" aria-hidden />
          </>
        )}
      </div>
    </section>
  );
}
