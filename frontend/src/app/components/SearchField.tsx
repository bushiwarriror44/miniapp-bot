"use client";

import { useEffect, useLayoutEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useRenderLoggerContext } from "../contexts/RenderLoggerContext";

export function SearchField() {
  const logger = useRenderLoggerContext();

  useLayoutEffect(() => {
    logger?.logRender("SearchField", "MOUNT", "SearchField component render");
  });

  useEffect(() => {
    logger?.logEvent("SearchField", "mounted");
  });

  return (
    <div
      className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        className="w-4 h-4 shrink-0"
        style={{ color: "var(--color-text-muted)" }}
      />
      <input
        type="search"
        placeholder="Поиск..."
        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:opacity-70"
        style={{ color: "var(--color-text)" }}
        aria-label="Поиск"
      />
    </div>
  );
}
