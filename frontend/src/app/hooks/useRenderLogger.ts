"use client";

import { useCallback, useRef, useState } from "react";
import type { RenderLog } from "../components/RenderLogger";

type LogReason = "MOUNT" | "UPDATE" | "EVENT";

export function useRenderLogger(label: string) {
  const [logs, setLogs] = useState<RenderLog[]>([]);
  const renderCountRef = useRef(0);
  const mountedAtRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number | null>(null);

  const appendLog = useCallback((log: RenderLog) => {
    setLogs((prev) => {
      const next = [...prev, log];
      // ограничиваем размер, чтобы не разрастался бесконечно
      return next.length > 100 ? next.slice(next.length - 100) : next;
    });
  }, []);

  const logRender = useCallback(
    (reason: LogReason, details?: string) => {
      const now = Date.now();
      if (mountedAtRef.current == null) {
        mountedAtRef.current = now;
      }
      renderCountRef.current += 1;

      const sinceMount = now - mountedAtRef.current;
      const sincePrev =
        lastRenderTimeRef.current != null ? now - lastRenderTimeRef.current : undefined;
      lastRenderTimeRef.current = now;

      appendLog({
        timestamp: now,
        type: "RENDER",
        label,
        renderCount: renderCountRef.current,
        reason,
        sinceMountMs: sinceMount,
        sincePrevMs: sincePrev,
        details,
      });
    },
    [appendLog, label],
  );

  const logEvent = useCallback(
    (reason: string, details?: string) => {
      const now = Date.now();
      appendLog({
        timestamp: now,
        type: "EVENT",
        label,
        reason,
        details,
      });
    },
    [appendLog, label],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    renderCountRef.current = 0;
    mountedAtRef.current = null;
    lastRenderTimeRef.current = null;
  }, []);

  return {
    logs,
    logRender,
    logEvent,
    clearLogs,
    appendLog,
  };
}

