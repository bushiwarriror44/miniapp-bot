"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { fetchBanners, type BannerItem } from "@/shared/api/banners";

function BannerSlide({ banner }: { banner: BannerItem }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ minHeight: 140 }}>
      <img
        src={banner.imageUrl}
        alt=""
        className="w-full h-full object-cover rounded-xl"
        style={{ minHeight: 140, maxHeight: 200 }}
      />
    </div>
  );
}

export function BannersBlock() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: fetchBanners,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (banners.length && activeIndex >= banners.length) setActiveIndex(Math.max(0, banners.length - 1));
  }, [banners.length, activeIndex]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null || !banners.length) return;
    const endX = e.changedTouches[0].clientX;
    const delta = touchStartX - endX;
    const minSwipe = 50;
    if (delta > minSwipe) setActiveIndex((i) => Math.min(banners.length - 1, i + 1));
    else if (delta < -minSwipe) setActiveIndex((i) => Math.max(0, i - 1));
    setTouchStartX(null);
  };

  if (isLoading || !banners.length) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 w-full">
        {banners.length > 1 ? (
          <button
            type="button"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
            aria-label="Предыдущий баннер"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          </button>
        ) : null}
        <div
          className="overflow-hidden rounded-xl flex-1 min-w-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out will-change-transform"
            style={{
              width: `${banners.length * 100}%`,
              transform: `translate3d(-${(activeIndex / banners.length) * 100}%, 0, 0)`,
            }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="shrink-0" style={{ width: `${100 / banners.length}%` }}>
                <BannerSlide banner={banner} />
              </div>
            ))}
          </div>
        </div>
        {banners.length > 1 ? (
          <button
            type="button"
            onClick={() => setActiveIndex((i) => Math.min(banners.length - 1, i + 1))}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
            aria-label="Следующий баннер"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
          </button>
        ) : null}
      </div>
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{
                width: index === activeIndex ? 20 : 8,
                height: 8,
                backgroundColor: index === activeIndex ? "var(--color-accent)" : "var(--color-border)",
              }}
              aria-label={`Слайд ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
