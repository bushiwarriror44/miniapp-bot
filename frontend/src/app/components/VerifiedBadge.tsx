"use client";

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

const TOOLTIP_TEXT = "Этот пользователь верифицирован";
const TOOLTIP_HIDE_MS = 2500;

export default function VerifiedBadge() {
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearHideTimeout();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    clearHideTimeout();
    setShowTooltip(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearHideTimeout();
    setShowTooltip(true);
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      hideTimeoutRef.current = null;
    }, TOOLTIP_HIDE_MS);
  };

  useEffect(() => () => clearHideTimeout(), []);

  return (
    <span
      role="img"
      aria-label="Верифицирован"
      className="relative inline-flex shrink-0 w-7 h-7 items-center justify-center rounded-full border"
      style={{
        borderColor: "var(--color-accent)",
        color: "var(--color-accent)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
      {showTooltip && (
        <span
          className="absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          {TOOLTIP_TEXT}
        </span>
      )}
    </span>
  );
}
