"use client";

import { useEffect, useMemo, useState, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard } from "@fortawesome/free-solid-svg-icons";
import { getTelegramWebApp } from "@/shared/api/client";
import { fetchMyPublications, type MyPublicationItem } from "@/shared/api/users";
import { useRenderLoggerContext } from "../contexts/RenderLoggerContext";

function formatPublicationDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function publicationTitle(item: MyPublicationItem): string {
  const fd = item.formData;
  const theme = typeof fd?.theme === "string" ? fd.theme.trim() : "";
  const description = typeof fd?.description === "string" ? fd.description.trim() : "";
  if (theme) return theme.length > 80 ? theme.slice(0, 77) + "…" : theme;
  if (description) return description.length > 80 ? description.slice(0, 77) + "…" : description;
  return "Без названия";
}

export function PublicationsBlock() {
  const logger = useRenderLoggerContext();
  const hasLoggedMount = useRef(false);
  const telegramId = useMemo(() => {
    const telegram = getTelegramWebApp();
    const userId = telegram?.initDataUnsafe?.user?.id;
    return userId ? String(userId) : "";
  }, []);

  const [publications, setPublications] = useState<MyPublicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!hasLoggedMount.current && logger) {
      hasLoggedMount.current = true;
      logger.logRender("PublicationsBlock", "MOUNT", "PublicationsBlock component render");
    }
  });

  useEffect(() => {
    if (!telegramId) {
      logger?.logEvent("PublicationsBlock", "no telegramId", "skipping fetch");
      queueMicrotask(() => {
        setLoading(false);
        setPublications([]);
      });
      return;
    }
    let cancelled = false;
    logger?.logEvent("PublicationsBlock", "fetching publications", `telegramId: ${telegramId}`);
    const tid = setTimeout(() => {
      if (!cancelled) {
        setLoading(true);
        setLoadError(null);
      }
    }, 0);
    fetchMyPublications(telegramId)
      .then((list) => {
        if (!cancelled) {
          logger?.logEvent("PublicationsBlock", "publications loaded", `${list.length} items`);
          setPublications(list);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logger?.logEvent("PublicationsBlock", "error loading", err instanceof Error ? err.message : String(err));
          setPublications([]);
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [telegramId]);

  const hasPublications = publications.length > 0;

  if (loading) {
    return (
      <section className="mb-6 p-0">
        <h2 className="font-semibold text-sm mb-4 text-left" style={{ color: "var(--color-text)" }}>
          Ваши публикации
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Загрузка…
        </p>
      </section>
    );
  }

  if (!hasPublications) {
    return (
      <section className="mb-6 p-0">
        <h2 className="font-semibold text-sm mb-4 text-left" style={{ color: "var(--color-text)" }}>
          Ваши публикации
        </h2>
        <div className="flex flex-col items-center">
          <FontAwesomeIcon
            icon={faClipboard}
            className="shrink-0 mb-4"
            style={{ color: "var(--color-text-muted)", width: 64, height: 64 }}
          />
          {loadError && (
            <p className="text-sm mb-2 text-center" style={{ color: "var(--color-accent)" }}>
              {loadError}
            </p>
          )}
          <p
            className="text-sm mb-4 max-w-xs text-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            Вы пока еще ничего не опубликовали, начните прямо сейчас!
          </p>
          <Link
            href="/exchange"
            className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] focus-visible:ring-[var(--color-accent)]"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "white",
            }}
          >
            Перейти на Биржу
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 p-0">
      <h2 className="font-semibold text-sm mb-4 text-left" style={{ color: "var(--color-text)" }}>
        Ваши публикации
      </h2>
      <ul className="space-y-3 list-none p-0 m-0">
        {publications.map((item) => (
          <li
            key={item.id}
            className="rounded-xl p-3 border"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              borderColor: "var(--color-border)",
            }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
              {publicationTitle(item)}
            </p>
            <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
              {formatPublicationDate(item.createdAt)}
            </p>
            {item.status === "pending" && (
              <span
                className="inline-block rounded-lg px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-accent)",
                }}
              >
                на модерации
              </span>
            )}
            {item.status === "approved" && (
              <span
                className="inline-block rounded-lg px-2 py-0.5 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Опубликовано
              </span>
            )}
            {item.status === "rejected" && (
              <span
                className="inline-block rounded-lg px-2 py-0.5 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Отклонено
              </span>
            )}
          </li>
        ))}
      </ul>
      <Link
        href="/exchange"
        className="inline-block mt-3 text-sm font-medium"
        style={{ color: "var(--color-accent)" }}
      >
        Перейти на Биржу
      </Link>
    </section>
  );
}
