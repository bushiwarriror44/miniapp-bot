"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard } from "@fortawesome/free-solid-svg-icons";

export function PublicationsBlock() {
  const hasPublications = false; // декоративно: пока всегда пусто

  if (hasPublications) {
    return null; // позже — список публикаций
  }

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
