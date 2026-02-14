"use client";

import { useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronDown, faChevronUp, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { fetchFaqItems, type FaqItem } from "@/shared/api/faq";

export default function ProfileFaqPage() {
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchFaqItems()
      .then((items) => {
        setFaqItems(items);
        setOpenFaqId(items[0]?.id ?? null);
        setLoadError(null);
      })
      .catch((error) => {
        console.error("Failed to load FAQ:", error);
        setLoadError(error instanceof Error ? error.message : String(error));
      });
  }, []);

  return (
    <main className="px-4 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-medium mb-4"
        style={{ color: "var(--color-accent)" }}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        Назад в профиль
      </Link>

      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h1 className="font-semibold mb-3 flex items-center gap-2 text-lg" style={{ color: "var(--color-text)" }}>
          <FontAwesomeIcon icon={faCircleQuestion} className="w-4 h-4 shrink-0" style={{ color: "var(--color-text)" }} />
          Частые вопросы
        </h1>
        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {faqItems.map((item) => {
            const isOpen = openFaqId === item.id;
            return (
              <div key={item.id} className="py-2">
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                  className="w-full flex items-center justify-between gap-2 text-left"
                >
                  <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    {item.title}
                  </span>
                  <FontAwesomeIcon
                    icon={isOpen ? faChevronUp : faChevronDown}
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                </button>
                {isOpen && (
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {item.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {loadError && (
          <p className="mt-3 text-xs" style={{ color: "var(--color-accent)" }}>
            Ошибка загрузки FAQ: {loadError}
          </p>
        )}
      </section>
    </main>
  );
}
