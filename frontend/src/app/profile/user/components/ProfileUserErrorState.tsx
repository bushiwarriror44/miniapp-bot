"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export function ProfileUserErrorState({ error }: { error: string | null }) {
  return (
    <section
      className="rounded-xl p-4 mb-4 flex items-start gap-2"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
    >
      <FontAwesomeIcon
        icon={faTriangleExclamation}
        className="w-4 h-4 mt-0.5 shrink-0"
        style={{ color: "var(--color-accent)" }}
      />
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          Не удалось загрузить профиль.
        </p>
        {error && (
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
