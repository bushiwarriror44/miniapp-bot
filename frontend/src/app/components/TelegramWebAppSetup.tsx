"use client";

import { useEffect } from "react";
import { getTelegramWebApp } from "@/shared/api/client";

/**
 * При старте Mini App в Telegram:
 * - разворачивает на всю доступную высоту (expand);
 * - отключает закрытие свайпом вниз по контенту (disableVerticalSwipes, API 7.7+).
 * Закрытие свайпом по шапке остаётся возможным.
 */
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
