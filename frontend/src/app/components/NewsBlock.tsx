"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import telegramIco from "@/app/assets/telegram-ico.svg";
import { fetchMainPageData } from "@/shared/api/main-page";

function svgSrc(value: string | { default?: string; src?: string }): string {
  if (typeof value === "string") return value;
  return value.default ?? value.src ?? "";
}

export function NewsBlock() {
  const [channelUrl, setChannelUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchMainPageData()
      .then((data) => {
        const url = data?.news?.channelUrl?.trim();
        if (url) setChannelUrl(url);
        setLoadError(null);
      })
      .catch((error) => {
        console.error("[ui] Failed to load mainPage.news", error);
        setLoadError(error instanceof Error ? error.message : "Ошибка загрузки mainPage");
      })
  }, []);

  return (
    <section
      className="mb-6 rounded-xl p-4"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
        <FontAwesomeIcon icon={faNewspaper} className="w-4 h-4 shrink-0" />
        Новости
      </h2>
      {loadError && (
        <p className="text-xs mb-3" style={{ color: "#ef4444" }}>
          Ошибка загрузки: {loadError}
        </p>
      )}
      <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        Все новости относительно проекта, полезные админские и не только, лайфхаки вы можете найти в
        нашем профессиональном сообществе.
      </p>
      <a
        href={channelUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 w-full sm:w-auto font-medium text-sm transition-opacity hover:opacity-90"
        style={{
          backgroundColor: "var(--color-accent)",
          color: "white",
          pointerEvents: channelUrl ? "auto" : "none",
          opacity: channelUrl ? 1 : 0.5,
        }}
      >
        <img
          src={svgSrc(telegramIco)}
          alt=""
          width={24}
          height={24}
          className="w-6 h-6 object-contain shrink-0"
        />
        Открыть
      </a>
    </section>
  );
}
