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

    // Дополнительная блокировка масштабирования на iOS внутри Telegram WebApp
    const isIOS =
      /iPad|iPhone|iPod/i.test(window.navigator.userAgent) &&
      !(window as any).MSStream;

    let lastTouchEnd = 0;

    if (isIOS && typeof document !== "undefined") {
      const handleGesture = (event: Event) => {
        event.preventDefault();
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (event.scale && event.scale !== 1) {
          event.preventDefault();
        }
      };

      const handleTouchEnd = (event: TouchEvent) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      };

      document.addEventListener("gesturestart", handleGesture);
      document.addEventListener("gesturechange", handleGesture);
      document.addEventListener("gestureend", handleGesture);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd, false);

      return () => {
        document.removeEventListener("gesturestart", handleGesture);
        document.removeEventListener("gesturechange", handleGesture);
        document.removeEventListener("gestureend", handleGesture);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, []);

  return null;
}
