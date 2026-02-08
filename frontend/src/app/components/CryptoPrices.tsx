"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCryptoPrices, type CryptoPriceItem, type CryptoId } from "@/shared/api/crypto";
import btcIcon from "@/app/assets/btc.svg";
import ethIcon from "@/app/assets/eth.svg";
import tonIcon from "@/app/assets/ton.svg";
import solanaIcon from "@/app/assets/solana.svg";
import bnbIcon from "@/app/assets/bnb.svg";

function svgSrc(
  value: string | { default?: string; src?: string }
): string {
  if (typeof value === "string") return value;
  return value.default ?? value.src ?? "";
}

const ICONS: Record<CryptoId, string> = {
  bitcoin: svgSrc(btcIcon),
  ethereum: svgSrc(ethIcon),
  "the-open-network": svgSrc(tonIcon),
  solana: svgSrc(solanaIcon),
  binancecoin: svgSrc(bnbIcon),
};

function formatPrice(usd: number): string {
  if (usd >= 1000) return usd.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (usd >= 1) return usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function CryptoCard({ item }: { item: CryptoPriceItem }) {
  const change = item.usd_24h_change;
  const isPositive = change != null && change >= 0;

  return (
    <article
      className="flex items-center gap-4 rounded-xl p-4"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="w-10 h-10 shrink-0 relative flex items-center justify-center">
        <img src={ICONS[item.id]} alt={item.symbol} width={40} height={40} className="w-10 h-10 object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          {item.symbol}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
          {item.name}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          ${formatPrice(item.usd)}
        </p>
        {change != null && (
          <p
            className="text-xs"
            style={{ color: isPositive ? "var(--color-positive, #22c55e)" : "var(--color-negative, #ef4444)" }}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </p>
        )}
      </div>
    </article>
  );
}

export function CryptoPrices() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["crypto-prices"],
    queryFn: fetchCryptoPrices,
    refetchInterval: 180_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data?.length && activeIndex >= data.length) setActiveIndex(Math.max(0, data.length - 1));
  }, [data?.length, activeIndex]);

  // Автопрокрутка каждые 7 секунд
  useEffect(() => {
    if (!data?.length) return;
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % data.length);
    }, 7000);
    return () => clearInterval(t);
  }, [data?.length]);

  // Свайп по горизонтали
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null || !data?.length) return;
    const endX = e.changedTouches[0].clientX;
    const delta = touchStartX - endX;
    const minSwipe = 50;
    if (delta > minSwipe) setActiveIndex((i) => Math.min(data.length - 1, i + 1));
    else if (delta < -minSwipe) setActiveIndex((i) => Math.max(0, i - 1));
    setTouchStartX(null);
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold text-sm min-w-0" style={{ color: "var(--color-text)" }}>
          Цены криптовалют
        </h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "white",
          }}
        >
          {isFetching ? "Обновление…" : "Обновить"}
        </button>
      </div>
      {isLoading && (
        <p className="py-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Загрузка…
        </p>
      )}
      {isError && (
        <p className="py-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Не удалось загрузить цены
        </p>
      )}
      {data && data.length > 0 && (
        <>
          <div
            className="overflow-hidden rounded-xl w-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-300 ease-out will-change-transform"
              style={{
                width: `${data.length * 100}%`,
                transform: `translate3d(-${(activeIndex / data.length) * 100}%, 0, 0)`,
              }}
            >
              {data.map((item) => (
                <div key={item.id} className="shrink-0" style={{ width: `${100 / data.length}%` }}>
                  <CryptoCard item={item} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            {data.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-(--color-accent)"
                style={{
                  width: index === activeIndex ? 20 : 8,
                  height: 8,
                  backgroundColor: index === activeIndex ? "var(--color-accent)" : "var(--color-border)",
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
