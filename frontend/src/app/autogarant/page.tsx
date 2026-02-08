"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";

export default function AutogarantPage() {
  return (
    <main className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
        Автогарант
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        Защита сделок и гарант исполнения.
      </p>
      <section
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span
            className="flex items-center justify-center w-10 h-10 rounded-full"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5" />
          </span>
          <h2 className="font-semibold" style={{ color: "var(--color-text)" }}>
            Активные гарантии
          </h2>
        </div>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Список ваших гарантий будет отображаться здесь после подключения к бэкенду.
        </p>
      </section>
      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>
          Как это работает
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Автогарант защищает стороны сделки: средства блокируются до подтверждения выполнения условий.
        </p>
      </section>
    </main>
  );
}
