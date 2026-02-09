"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronDown, faChevronUp, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FAQ_ITEMS } from "../profileData";

export default function ProfileFaqPage() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

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
          {FAQ_ITEMS.map((item) => {
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
      </section>
    </main>
  );
}
