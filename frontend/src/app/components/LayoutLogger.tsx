"use client";

import { useEffect, useLayoutEffect } from "react";

export function LayoutLogger({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    console.log("[LayoutLogger] Layout render");
  }, []);

  useEffect(() => {
    console.log("[LayoutLogger] Layout mounted");
  }, []);

  return <>{children}</>;
}
