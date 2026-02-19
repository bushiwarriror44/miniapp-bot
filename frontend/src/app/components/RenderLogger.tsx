"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";

export type RenderLog = {
  timestamp: number;
  type: "RENDER" | "EVENT";
  label: string;
  renderCount?: number;
  reason?: string;
  sinceMountMs?: number;
  sincePrevMs?: number;
  details?: string;
};

type Props = {
  logs: RenderLog[];
  onClear?: () => void;
  title?: string;
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  const pad = (n: number, len: number = 2) => String(n).padStart(len, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(
    d.getMilliseconds(),
    3,
  )}`;
};

const formatLogsAsText = (logs: RenderLog[]): string => {
  return logs
    .map((log) => {
      const time = formatTime(log.timestamp);
      const type = log.type === "RENDER" ? "RENDER" : "EVENT";
      const renderCount = log.renderCount != null ? ` #${log.renderCount}` : "";
      const reason = log.reason ? ` — ${log.reason}` : "";
      const timing =
        log.sinceMountMs != null || log.sincePrevMs != null
          ? ` (${log.sinceMountMs != null ? `from start: ${log.sinceMountMs}ms` : ""}${
              log.sinceMountMs != null && log.sincePrevMs != null ? " | " : ""
            }${log.sincePrevMs != null ? `since prev: ${log.sincePrevMs}ms` : ""})`
          : "";
      const details = log.details ? `\n  ${log.details}` : "";
      return `[${time}] ${type}${renderCount}\n${log.label}${reason}${timing}${details}`;
    })
    .join("\n\n");
};

export function RenderLogger({ logs, onClear, title = "Render log" }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  const handleCopy = async () => {
    try {
      const text = formatLogsAsText(logs);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy logs:", err);
    }
  };

  if (!logs || logs.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-16 right-4 z-[90] max-w-md w-[90vw] sm:w-[360px]"
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="rounded-xl shadow-lg overflow-hidden"
        style={{
          backgroundColor: "rgba(0,0,0,0.8)",
          border: "1px solid var(--color-border)",
          color: "#f9fafb",
          fontFamily: "monospace",
          fontSize: "11px",
        }}
      >
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            >
              {collapsed ? "+" : "−"}
            </button>
            <span className="truncate font-semibold">
              {title} ({logs.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              className="w-6 h-6 rounded flex items-center justify-center text-xs transition-colors"
              style={{
                backgroundColor: copied ? "rgba(34,197,94,0.2)" : "rgba(148,163,184,0.2)",
                color: copied ? "#22c55e" : "#e5e7eb",
              }}
              title="Копировать логи"
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-3 h-3" />
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-[10px] px-2 py-1 rounded"
                style={{
                  backgroundColor: "rgba(148,163,184,0.2)",
                  color: "#e5e7eb",
                }}
              >
                Очистить
              </button>
            )}
          </div>
        </div>
        {!collapsed && (
          <div
            ref={containerRef}
            className="max-h-56 overflow-y-auto border-t"
            style={{ borderColor: "rgba(148,163,184,0.4)" }}
          >
            {logs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className="px-3 py-1.5 border-b last:border-b-0"
                style={{ borderColor: "rgba(55,65,81,0.7)" }}
              >
                <div className="flex justify-between gap-2">
                  <span style={{ color: "#9ca3af" }}>{formatTime(log.timestamp)}</span>
                  <span style={{ color: "#e5e7eb" }}>
                    {log.type === "RENDER" ? "RENDER" : "EVENT"}
                    {log.renderCount != null ? ` #${log.renderCount}` : ""}
                  </span>
                </div>
                <div className="mt-0.5">
                  <span style={{ color: "#e5e7eb" }}>{log.label}</span>
                  {log.reason && (
                    <span style={{ color: "#9ca3af" }}> — {log.reason}</span>
                  )}
                </div>
                {(log.sinceMountMs != null || log.sincePrevMs != null) && (
                  <div style={{ color: "#6b7280" }}>
                    {log.sinceMountMs != null && `from start: ${log.sinceMountMs}ms`}
                    {log.sinceMountMs != null && log.sincePrevMs != null && " | "}
                    {log.sincePrevMs != null && `since prev: ${log.sincePrevMs}ms`}
                  </div>
                )}
                {log.details && (
                  <div className="mt-0.5 whitespace-pre-wrap" style={{ color: "#9ca3af" }}>
                    {log.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

