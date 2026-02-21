"use client";

import { useEffect, useMemo, useState } from "react";
import { getTelegramWebApp } from "@/shared/api/client";
import { fetchUserProfile } from "@/shared/api/users";
import { fetchBotConfig } from "@/shared/api/bot-config";

const DEFAULT_SUPPORT_LINK = "https://t.me/miniapp_admin_example";

function isValidUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

export function AppBlockGuard({ children }: { children: React.ReactNode }) {
  const [isMounted] = useState(() => typeof window !== "undefined");
  const telegramId = useMemo(() => {
    if (typeof window === 'undefined') return "";
    const tg = getTelegramWebApp();
    const id = tg?.initDataUnsafe?.user?.id;
    return id ? String(id) : "";
  }, []);

  const [isReady, setIsReady] = useState(() => !telegramId);
  const [isBlocked, setIsBlocked] = useState(false);
  const [supportLink, setSupportLink] = useState<string>(DEFAULT_SUPPORT_LINK);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!telegramId) {
      queueMicrotask(() => setIsReady(true));
      return;
    }

    Promise.all([fetchUserProfile(telegramId), fetchBotConfig()])
      .then(([profile, botConfig]) => {
        setIsBlocked(Boolean(profile?.isBlocked));
        if (isValidUrl(botConfig?.supportLink)) {
          setSupportLink(botConfig.supportLink);
        }
      })
      .catch((error) => {
        console.error("Failed to check block status:", error);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, [telegramId]);

  if (!isMounted || !isReady) {
    return null;
  }

  if (!isBlocked) {
    return <>{children}</>;
  }

  return (
    <main className="px-4 py-8 min-h-screen flex items-center justify-center">
      <section
        className="w-full max-w-md rounded-2xl p-5 text-center"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h1 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Доступ ограничен
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Сожалеем, но вы заблокированы в этом боте, можете написать в нашу поддержку для решения этой проблемы.
        </p>
        {isValidUrl(supportLink) && (
          <a
            href={supportLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 rounded-xl px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            Написать в поддержку
          </a>
        )}
      </section>
    </main>
  );
}
