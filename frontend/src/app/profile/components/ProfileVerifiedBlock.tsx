"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

export function ProfileVerifiedBlock({
  verified,
  onVerifyClick,
}: { verified: boolean; onVerifyClick: () => void }) {
  if (verified) {
    return (
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-2"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <FontAwesomeIcon icon={faCheck} className="w-4 h-4 shrink-0" style={{ color: "var(--color-accent)" }} />
        <p className="text-sm" style={{ color: "var(--color-text)" }}>
          Аккаунт верифицирован. Ваши объявления отображаются приоритетно.
        </p>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onVerifyClick}
      className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-2"
      style={{ backgroundColor: "var(--color-accent)", border: "1px solid var(--color-accent)" }}
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "white" }}
      >
        !
      </span>
      <p className="text-sm text-white">
        Пройдите верификацию для приоритетного размещения объявлений
      </p>
    </button>
  );
}
