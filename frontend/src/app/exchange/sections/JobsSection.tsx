"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFilterCircleXmark } from "@fortawesome/free-solid-svg-icons";
import {
  fetchJobsPaginated,
  WORK_LABELS,
  EMPLOYMENT_LABELS,
  PAYMENT_CURRENCY_LABELS,
  JOB_OFFER_TYPE_LABELS,
  type JobItem,
  type WorkType,
  type EmploymentType,
  type PaymentCurrency,
  type JobOfferType,
} from "@/shared/api/jobs";
import { fetchExchangeOptions, type ExchangeOptionsPayload } from "@/shared/api/exchangeOptions";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import { inputStyleModal, EXCHANGE_PAGE_SIZE } from "../constants";
import { toErrorMessage } from "../formHelpers";
import { JobCard, ExchangeCardSkeleton } from "../cards";

export function JobsSection({
  exchangeOptions,
  hotItemIds,
}: {
  exchangeOptions: ExchangeOptionsPayload | null;
  hotItemIds?: Set<string>;
}) {
  const router = useRouter();
  const [offerType, setOfferType] = useState<JobOfferType | "">("");
  const [work, setWork] = useState<WorkType | "">("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency | "">("");
  const [hasPortfolio, setHasPortfolio] = useState<"" | "yes" | "no">("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadFirstPage = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setJobs([]);
    setNextCursor(null);
    fetchJobsPaginated({
      offerType: offerType || undefined,
      work: work || undefined,
      employmentType: employmentType || undefined,
      paymentCurrency: paymentCurrency || undefined,
      hasPortfolio: hasPortfolio || undefined,
      themeSearch: themeSearch.trim() || undefined,
      descriptionSearch: descriptionSearch.trim() || undefined,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setJobs(res.jobs ?? []);
          setNextCursor(res.nextCursor);
        } else {
          setJobs([]);
          setNextCursor(null);
        }
      })
      .catch((error) => {
        setJobs([]);
        setNextCursor(null);
        setLoadError(toErrorMessage(error));
      })
      .finally(() => setLoading(false));
  }, [offerType, work, employmentType, paymentCurrency, hasPortfolio, themeSearch, descriptionSearch]);

  useEffect(() => {
    const t = setTimeout(() => loadFirstPage(), 0);
    return () => clearTimeout(t);
  }, [loadFirstPage]);

  const loadMore = useCallback(() => {
    if (loadMoreLoading || nextCursor == null) return;
    setLoadMoreLoading(true);
    fetchJobsPaginated({
      offerType: offerType || undefined,
      work: work || undefined,
      employmentType: employmentType || undefined,
      paymentCurrency: paymentCurrency || undefined,
      hasPortfolio: hasPortfolio || undefined,
      themeSearch: themeSearch.trim() || undefined,
      descriptionSearch: descriptionSearch.trim() || undefined,
      cursor: nextCursor,
      limit: EXCHANGE_PAGE_SIZE,
    })
      .then((res) => {
        if (res) {
          setJobs((prev) => [...prev, ...(res.jobs ?? [])]);
          setNextCursor(res.nextCursor);
        }
      })
      .catch(() => {})
      .finally(() => setLoadMoreLoading(false));
  }, [nextCursor, loadMoreLoading, offerType, work, employmentType, paymentCurrency, hasPortfolio, themeSearch, descriptionSearch]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: nextCursor != null && nextCursor !== "",
    loading: loadMoreLoading,
  });

  const handleOpenView = useCallback((id: string) => {
    router.push(`/exchange/view?section=jobs&id=${encodeURIComponent(id)}`);
  }, [router]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Поиск / предложение вакансии
        </h2>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && (
      <div
        className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Фильтр по типу, работе, занятости, оплате, тематике и портфолио.
        </p>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Ищу работу / Предлагаю работу
          </label>
          <select
            value={offerType}
            onChange={(e) => setOfferType((e.target.value || "") as JobOfferType | "")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyleModal}
          >
            <option value="">Любое</option>
            <option value="seeking">{JOB_OFFER_TYPE_LABELS.seeking}</option>
            <option value="offering">{JOB_OFFER_TYPE_LABELS.offering}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Работа
          </label>
          <select
            value={work}
            onChange={(e) => setWork((e.target.value || "") as WorkType | "")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyleModal}
          >
            <option value="">Любая</option>
            {(Object.keys(WORK_LABELS) as WorkType[]).map((w) => (
              <option key={w} value={w}>{WORK_LABELS[w]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Тип занятости
          </label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType((e.target.value || "") as EmploymentType | "")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyleModal}
          >
            <option value="">Любой</option>
            <option value="remote">{EMPLOYMENT_LABELS.remote}</option>
            <option value="offline">{EMPLOYMENT_LABELS.offline}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Оплата
          </label>
          <select
            value={paymentCurrency}
            onChange={(e) => setPaymentCurrency((e.target.value || "") as PaymentCurrency | "")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyleModal}
          >
            <option value="">Любая</option>
            <option value="usd">{PAYMENT_CURRENCY_LABELS.usd}</option>
            <option value="rub">{PAYMENT_CURRENCY_LABELS.rub}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Портфолио
          </label>
          <select
            value={hasPortfolio}
            onChange={(e) => setHasPortfolio((e.target.value || "") as "" | "yes" | "no")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyleModal}
          >
            <option value="">Любое</option>
            <option value="yes">Есть</option>
            <option value="no">Нет</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Тематика
          </label>
          <input
            type="text"
            placeholder="Например: контент, дизайн"
            value={themeSearch}
            onChange={(e) => setThemeSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyleModal}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Поиск по описанию
          </label>
          <input
            type="text"
            placeholder="Введите текст..."
            value={descriptionSearch}
            onChange={(e) => setDescriptionSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyleModal}
          />
        </div>
      </div>
      )}

      <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--color-text)" }}>
        Вакансии
      </h3>
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
      {!loading && jobs.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Вакансий пока нет.
        </p>
      )}
      {!loading && jobs.length > 0 && (
        <>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id}>
                <JobCard
                  job={job}
                  exchangeOptions={exchangeOptions}
                  isHot={hotItemIds?.has(String(job.id))}
                  onOpenView={handleOpenView}
                />
              </div>
            ))}
          </div>
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
    </section>
  );
}
