"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

export function ProfileUserBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm font-medium mb-4"
      style={{ color: "var(--color-accent)" }}
    >
      <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
      Назад
    </button>
  );
}
