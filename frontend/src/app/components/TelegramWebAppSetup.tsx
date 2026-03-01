"use client";

import { useEffect } from "react";
import { getTelegramWebApp } from "@/shared/api/client";

export function TelegramWebAppSetup() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = getTelegramWebApp();
    if (!tg) return;

    if (typeof tg.ready === "function") {
      tg.ready();
    }

    if (typeof tg.expand === "function") {
      tg.expand();
    }

    if (
      typeof tg.isVersionAtLeast === "function" &&
      tg.isVersionAtLeast("7.7") &&
      typeof tg.disableVerticalSwipes === "function"
    ) {
      tg.disableVerticalSwipes();
    }
  }, []);

  return null;
}
