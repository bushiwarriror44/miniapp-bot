"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faFire } from "@fortawesome/free-solid-svg-icons";
import { fetchHotOffers, type HotOffer } from "@/shared/api/hot-offers";
import { fetchDatasetItem } from "@/shared/api/dataSource";
import { isExpired } from "@/shared/api/expiry";
import { useRenderLoggerContext } from "../contexts/RenderLoggerContext";

type ListingWithExpiresAt = {
  expiresAt?: string | null;
};

function sectionToDatasetName(section: string): string | null {
  switch (section) {
    case "sell-ads":
      return "ads";
    case "buy-ads":
      return "buyAds";
    case "jobs":
      return "jobs";
    case "designers":
      return "services";
    case "currency":
      return "currency";
    case "sell-channel":
      return "sellChannels";
    case "buy-channel":
      return "buyChannels";
    case "other":
      return "other";
    default:
      return null;
  }
}

function OfferSlide({ offer }: { offer: HotOffer }) {
  return (
    <article
      className="rounded-xl p-5 w-full h-full min-h-[100px] flex flex-col justify-center"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
        {offer.title}
      </p>
      <p className="text-lg font-bold mb-1" style={{ color: "var(--color-accent)" }}>
        {offer.price}
      </p>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {offer.subtitle}
      </p>
    </article>
  );
}

function OfferSlideSkeleton() {
  return (
    <article
      className="rounded-xl p-5 w-full h-full min-h-[100px] flex flex-col justify-center animate-pulse"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="h-4 rounded mb-2" style={{ backgroundColor: "var(--color-surface)", width: "75%" }} />
      <div className="h-6 w-24 rounded mb-2" style={{ backgroundColor: "var(--color-surface)" }} />
      <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--color-surface)" }} />
    </article>
  );
}

function isInternalHref(href: string): boolean {
  const v = (href || "").trim();
  if (!v) return false;
  return v.startsWith("/") || v.startsWith("?");
}

export function HotOffersBlock() {
  const [offers, setOffers] = useState<HotOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const logger = useRenderLoggerContext();
  const hasLoggedMount = useRef(false);

  useLayoutEffect(() => {
    if (!hasLoggedMount.current && logger) {
      hasLoggedMount.current = true;
      logger.logRender("HotOffersBlock", "MOUNT", "HotOffersBlock component render");
    }
  });

  useEffect(() => {
    let cancelled = false;
    logger?.logEvent("HotOffersBlock", "fetching hot offers");
    fetchHotOffers()
      .then(async (res) => {
        if (!cancelled) {
          logger?.logEvent("HotOffersBlock", "hot offers loaded", `${res.offers?.length ?? 0} offers`);
          const baseCleaned = (res.offers ?? []).filter((offer) => {
            if (!offer) return false;
            const title = (offer.title || "").trim();
            const price = (offer.price || "").trim();
            return Boolean(title && price);
          });
          const validated = await Promise.all(
            baseCleaned.map(async (offer) => {
              if (!(offer.type === "ad" && offer.category && offer.itemId)) {
                return offer;
              }
              const dataset = sectionToDatasetName(offer.category);
              if (!dataset) return null;
              const item = await fetchDatasetItem<Record<string, unknown>>(dataset, String(offer.itemId));
              if (!item?.item) return null;
              const expiresAt = (item.item as Partial<ListingWithExpiresAt>)?.expiresAt ?? null;
              if (isExpired(expiresAt)) return null;
              return offer;
            }),
          );
          const cleaned = validated.filter(Boolean) as HotOffer[];
          setOffers(cleaned);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          logger?.logEvent("HotOffersBlock", "error loading", error instanceof Error ? error.message : String(error));
          setOffers([]);
          setLoadError(error instanceof Error ? error.message : "Ошибка загрузки hot offers");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [logger]);

  if (!loading && offers.length === 0 && !loadError) return null;

  const safeActiveIndex = offers.length > 0 ? Math.min(activeIndex, offers.length - 1) : 0;
  const goPrev = () => setActiveIndex((i) => (i - 1 + offers.length) % offers.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % offers.length);

  return (
    <section className="mb-6">
      <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
        <FontAwesomeIcon icon={faFire} className="w-4 h-4 shrink-0" />
        Горячие предложения
      </h2>
      {loadError && (
        <p className="text-xs mb-3" style={{ color: "#ef4444" }}>
          Ошибка загрузки: {loadError}
        </p>
      )}
      {loading && (
        <div className="overflow-hidden rounded-xl">
          <div className="flex">
            <div className="shrink-0 w-full pr-2">
              <OfferSlideSkeleton />
            </div>
            <div className="shrink-0 w-full pl-2">
              <OfferSlideSkeleton />
            </div>
          </div>
        </div>
      )}
      {!loading && offers.length > 0 && (
        <>
          <div className="relative">
            <div className="overflow-hidden rounded-xl">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  width: `${offers.length * 100}%`,
                  transform: `translate3d(-${(safeActiveIndex / offers.length) * 100}%, 0, 0)`,
                }}
              >
                {offers.map((offer) => (
                  <div key={offer.id} className="shrink-0" style={{ width: `${100 / offers.length}%` }}>
                    {(() => {
                      const card = <OfferSlide offer={offer} />;
                      if (offer.type === "ad" && offer.category && offer.itemId) {
                        return (
                          <Link
                            href={`/exchange?section=${encodeURIComponent(offer.category)}&openItem=${encodeURIComponent(offer.itemId)}`}
                            style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}
                          >
                            {card}
                          </Link>
                        );
                      }
                      const linkUrl = (offer.linkUrl || "").trim();
                      if (!linkUrl) return card;
                      if (isInternalHref(linkUrl)) {
                        return (
                          <Link
                            href={linkUrl}
                            style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}
                          >
                            {card}
                          </Link>
                        );
                      }
                      return (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}
                        >
                          {card}
                        </a>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={goPrev}
              className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-opacity hover:opacity-90 shadow-md"
              style={{ backgroundColor: "var(--color-accent)", color: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
              aria-label="Предыдущее"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-opacity hover:opacity-90 shadow-md"
              style={{ backgroundColor: "var(--color-accent)", color: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
              aria-label="Следующее"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            {offers.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-(--color-accent)"
                style={{
                  width: index === safeActiveIndex ? 20 : 8,
                  height: 8,
                  backgroundColor: index === safeActiveIndex ? "var(--color-accent)" : "var(--color-border)",
                }}
                aria-label={`Слайд ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
