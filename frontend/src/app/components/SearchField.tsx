"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useRenderLoggerContext } from "../contexts/RenderLoggerContext";
import { searchListings } from "@/shared/search/listingSearch";
import type { SearchHit } from "@/shared/types/exchange";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export function SearchField() {
  const logger = useRenderLoggerContext();
  const hasLoggedMount = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>("");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const router = useRouter();

  useLayoutEffect(() => {
    if (!hasLoggedMount.current && logger) {
      hasLoggedMount.current = true;
      logger.logRender("SearchField", "MOUNT", "SearchField component render");
    }
  });

  useEffect(() => {
    if (logger) {
      logger.logEvent("SearchField", "mounted");
    }
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }
    lastQueryRef.current = trimmed;
    setLoading(true);
    try {
      const hits = await searchListings(trimmed);
      if (lastQueryRef.current === trimmed) {
        setResults(hits);
      }
    } catch {
      if (lastQueryRef.current === trimmed) {
        setResults([]);
      }
    } finally {
      if (lastQueryRef.current === trimmed) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setResults([]);
      setLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      runSearch(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, runSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = dropdownVisible && query.trim().length >= MIN_QUERY_LENGTH;

  const handleResultClick = (hit: SearchHit) => {
    router.push(`/exchange?section=${encodeURIComponent(hit.section)}&openItem=${encodeURIComponent(hit.id)}`);
    setDropdownVisible(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative mb-6">
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
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
          aria-expanded={showDropdown}
          aria-controls="search-results"
          role="combobox"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setDropdownVisible(true)}
        />
      </div>

      {showDropdown && (
        <div
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[min(70vh,400px)] overflow-y-auto rounded-xl border shadow-lg"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            borderColor: "var(--color-border)",
          }}
        >
          {loading ? (
            <div
              className="px-4 py-3 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Загрузка…
            </div>
          ) : results.length === 0 ? (
            <div
              className="px-4 py-3 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Результаты не были найдены
            </div>
          ) : (
            <ul className="py-1">
              {results.map((hit) => (
                <li key={`${hit.section}-${hit.id}`} role="option">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm hover:opacity-90 focus:outline-none focus:ring-0"
                    style={{
                      color: "var(--color-text)",
                      backgroundColor: "transparent",
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleResultClick(hit)}
                  >
                    <div
                      className="font-medium"
                      style={{ color: "var(--color-text)" }}
                    >
                      {hit.title}
                    </div>
                    {hit.snippet && (
                      <div
                        className="mt-0.5 truncate text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {hit.snippet}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
