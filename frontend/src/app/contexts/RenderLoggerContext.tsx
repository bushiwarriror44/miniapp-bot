"use client";

import { createContext, useContext, ReactNode, useCallback, useMemo } from "react";
import type { RenderLog } from "../components/RenderLogger";

type RenderLoggerContextType = {
  logRender: (label: string, reason: "MOUNT" | "UPDATE" | "EVENT", details?: string) => void;
  logEvent: (label: string, reason: string, details?: string) => void;
};

const RenderLoggerContext = createContext<RenderLoggerContextType | null>(null);

export function useRenderLoggerContext() {
  const ctx = useContext(RenderLoggerContext);
  return ctx;
}

type Props = {
  children: ReactNode;
  onLog: (log: RenderLog) => void;
};

export function RenderLoggerProvider({ children, onLog }: Props) {
  const logRender = useCallback(
    (label: string, reason: "MOUNT" | "UPDATE" | "EVENT", details?: string) => {
      const now = Date.now();
      onLog({
        timestamp: now,
        type: "RENDER",
        label,
        reason,
        details,
      });
    },
    [onLog],
  );

  const logEvent = useCallback(
    (label: string, reason: string, details?: string) => {
      const now = Date.now();
      onLog({
        timestamp: now,
        type: "EVENT",
        label,
        reason,
        details,
      });
    },
    [onLog],
  );

  const value = useMemo(() => ({ logRender, logEvent }), [logRender, logEvent]);

  return (
    <RenderLoggerContext.Provider value={value}>
      {children}
    </RenderLoggerContext.Provider>
  );
}
