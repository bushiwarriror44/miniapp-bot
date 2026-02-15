"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { getTelegramWebApp } from "@/shared/api/client";
import { fetchUserStatistics, type UserStatisticsResponse } from "@/shared/api/users";

export default function ProfileStatisticsPage() {
  const [statistics, setStatistics] = useState<UserStatisticsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const telegramId = useMemo(() => {
    const telegram = getTelegramWebApp();
    const userId = telegram?.initDataUnsafe?.user?.id;
    return userId ? String(userId) : "";
  }, []);

  useEffect(() => {
    if (!telegramId) {
      setLoadError("Telegram user id is missing.");
      return;
    }
    fetchUserStatistics(telegramId)
      .then((response) => {
        setStatistics(response);
        setLoadError(null);
      })
      .catch((error) => {
        console.error("Failed to load statistics:", error);
        setLoadError(error instanceof Error ? error.message : String(error));
      });
  }, [telegramId]);

  const stats = statistics ?? {
    ads: { active: 0, completed: 0, hidden: 0, onModeration: 0 },
    deals: { total: 0, successful: 0, disputed: 0 },
    profileViews: { week: 0, month: 0 },
  };

  return (
    <main className="px-4 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-medium mb-4"
        style={{ color: "var(--color-accent)" }}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        Назад в профиль
      </Link>

      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h1 className="font-semibold mb-3 flex items-center gap-2 text-lg" style={{ color: "var(--color-text)" }}>
          <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 shrink-0" style={{ color: "var(--color-text)" }} />
          Статистика активности
        </h1>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
              Объявления
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                на модерации: <strong>{stats.ads.onModeration ?? 0}</strong>
              </span>
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                активные: <strong>{stats.ads.active}</strong>
              </span>
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                завершённые: <strong>{stats.ads.completed}</strong>
              </span>
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                скрытые: <strong>{stats.ads.hidden}</strong>
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
              Сделки
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                всего совершено: <strong>{stats.deals.total}</strong>
              </span>
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                успешных: <strong>{stats.deals.successful}</strong>
              </span>
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                спорных: <strong>{stats.deals.disputed}</strong>
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-3" style={{ color: "var(--color-text-muted)" }}>
              Просмотры профиля
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xl font-bold mb-0.5" style={{ color: "var(--color-text)" }}>
                  {stats.profileViews.week}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  просмотров профиля за неделю
                </p>
              </div>
              <div>
                <p className="text-xl font-bold mb-0.5" style={{ color: "var(--color-text)" }}>
                  {stats.profileViews.month}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  просмотров профиля за месяц
                </p>
              </div>
            </div>
          </div>
          {loadError && (
            <p className="text-xs" style={{ color: "var(--color-accent)" }}>
              Ошибка загрузки статистики: {loadError}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
