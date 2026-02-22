"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { fetchDatasetItem } from "@/shared/api/dataSource";
import { fetchExchangeOptions, type ExchangeOptionsPayload } from "@/shared/api/exchangeOptions";
import type { AdItem } from "@/shared/api/ads";
import type { BuyAdItem } from "@/shared/api/buyAds";
import type { JobItem } from "@/shared/api/jobs";
import type { ServiceItem } from "@/shared/api/services";
import type { CurrencyItem } from "@/shared/api/currency";
import type { SellChannelItem } from "@/shared/api/sellChannels";
import type { BuyChannelItem } from "@/shared/api/buyChannels";
import type { OtherItem } from "@/shared/api/other";
import type { ExchangeSection } from "../constants";
import {
  AdCard,
  BuyAdCard,
  JobCard,
  ServiceCard,
  CurrencyCard,
  SellChannelCard,
  BuyChannelCard,
  OtherCard,
} from "../cards";

const SECTION_TO_DATASET: Record<ExchangeSection, string> = {
  "sell-ads": "ads",
  "buy-ads": "buyAds",
  jobs: "jobs",
  designers: "services",
  currency: "currency",
  "sell-channel": "sellChannels",
  "buy-channel": "buyChannels",
  other: "other",
};

function getUsernameFromItem(item: Record<string, unknown>): string {
  const uname = (item.username as string) || "";
  const link = (item.usernameLink as string) || "";
  if (uname && typeof uname === "string") return String(uname).replace(/^@/, "").trim();
  if (link && typeof link === "string" && link.includes("t.me/")) {
    const parts = link.trim().split("t.me/");
    const tail = parts[parts.length - 1] || "";
    return tail.split("/")[0].split("?")[0].trim() || "";
  }
  return "";
}

function GuarantorBlock({ authorLink }: { authorLink: string }) {
  const rating: number | null = null;
  return (
    <div className="pt-3 mt-3 space-y-2" style={{ borderTop: "1px solid var(--color-border)" }}>
      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2.5"
        style={{
          backgroundColor: "var(--color-accent)",
          color: "white",
        }}
      >
        <span
          className="flex shrink-0 w-8 h-8 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
        >
          <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
        </span>
        <p className="text-xs leading-snug m-0" style={{ color: "white" }}>
          Проводите сделку через гаранта, чтобы обезопасить свои средства.
        </p>
      </div>
      
      <a
        href={authorLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-xl py-2.5 px-4 text-sm font-medium w-full"
        style={{ backgroundColor: "var(--color-accent)", color: "white" }}
      >
        Написать
      </a>
    </div>
  );
}

export default function ExchangeViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = (searchParams.get("section") || "") as ExchangeSection | "";
  const id = searchParams.get("id") || "";

  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [datasetName, setDatasetName] = useState<string | null>(null);
  const [exchangeOptions, setExchangeOptions] = useState<ExchangeOptionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validSections: ExchangeSection[] = [
    "sell-ads",
    "buy-ads",
    "jobs",
    "designers",
    "currency",
    "sell-channel",
    "buy-channel",
    "other",
  ];
  const currentSection: ExchangeSection | null =
    section && validSections.includes(section as ExchangeSection) ? (section as ExchangeSection) : null;
  const isValidSection = currentSection != null;

  const load = useCallback(async () => {
    if (!id.trim() || !currentSection) {
      setError("Не указан раздел или объявление.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const dataset = SECTION_TO_DATASET[currentSection];
    try {
      const [itemRes, optionsRes] = await Promise.all([
        fetchDatasetItem(dataset, id.trim()),
        currentSection === "jobs" ? fetchExchangeOptions() : Promise.resolve(null),
      ]);
      if (!itemRes) {
        setError("Объявление не найдено.");
        setItem(null);
        setDatasetName(null);
      } else {
        setItem(itemRes.item as Record<string, unknown>);
        setDatasetName(itemRes.name);
      }
      if (optionsRes) setExchangeOptions(optionsRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки.");
      setItem(null);
      setDatasetName(null);
    } finally {
      setLoading(false);
    }
  }, [id, currentSection]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push(currentSection ? `/exchange?section=${encodeURIComponent(currentSection)}` : "/exchange");
    }
  };

  const username = item ? getUsernameFromItem(item) : "";
  const authorLink = username ? `https://t.me/${username}` : "";

  if (!isValidSection || !id.trim()) {
    return (
      <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--color-bg)" }}>
        <button
          type="button"
          onClick={() => router.push("/exchange")}
          className="inline-flex items-center gap-2 text-sm font-medium mb-4"
          style={{ color: "var(--color-accent)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          Назад
        </button>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Не указан раздел или объявление.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--color-bg)" }}>
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm font-medium mb-4"
        style={{ color: "var(--color-accent)" }}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        Назад
      </button>

      {loading && (
        <div
          className="rounded-xl p-4 animate-pulse"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="h-4 rounded mb-2 w-3/4" style={{ backgroundColor: "var(--color-surface)" }} />
          <div className="h-3 rounded mb-2 w-1/2" style={{ backgroundColor: "var(--color-surface)" }} />
          <div className="h-3 rounded w-1/3" style={{ backgroundColor: "var(--color-surface)" }} />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm py-4" style={{ color: "var(--color-text-muted)" }}>
          {error}
        </p>
      )}

      {!loading && !error && item && datasetName && (
        <>
          
            {currentSection === "sell-ads" && <AdCard ad={item as AdItem} onOpenView={undefined} />}
            {currentSection === "buy-ads" && <BuyAdCard item={item as BuyAdItem} onOpenView={undefined} />}
            {currentSection === "jobs" && (
              <JobCard
                job={item as JobItem}
                exchangeOptions={exchangeOptions}
                onOpenView={undefined}
              />
            )}
            {currentSection === "designers" && (
              <ServiceCard service={item as ServiceItem} onOpenView={undefined} />
            )}
            {currentSection === "currency" && (
              <CurrencyCard item={item as CurrencyItem} onOpenView={undefined} />
            )}
            {currentSection === "sell-channel" && (
              <SellChannelCard channel={item as SellChannelItem} onOpenView={undefined} />
            )}
            {currentSection === "buy-channel" && (
              <BuyChannelCard item={item as BuyChannelItem} onOpenView={undefined} />
            )}
            {currentSection === "other" && <OtherCard item={item as OtherItem} onOpenView={undefined} />}
          

          {authorLink && (
            <>
              
                <GuarantorBlock authorLink={authorLink} />
             
              <Link
                href={`/profile/user/${encodeURIComponent(username)}`}
                className="block w-full rounded-xl py-2.5 px-4 text-sm font-medium text-center"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "white",
                  textDecoration: "none",
                }}
              >
                Перейти на профиль пользователя
              </Link>
            </>
          )}
        </>
      )}
    </main>
  );
}
