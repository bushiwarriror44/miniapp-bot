"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { USER_ACTIVITY } from "../profileData";

export default function ProfileStatisticsPage() {
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
                активные: <strong>{USER_ACTIVITY.ads.active}</strong>
              </span>
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                завершённые: <strong>{USER_ACTIVITY.ads.completed}</strong>
              </span>
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                скрытые: <strong>{USER_ACTIVITY.ads.hidden}</strong>
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
                всего совершено: <strong>{USER_ACTIVITY.deals.total}</strong>
              </span>
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                успешных: <strong>{USER_ACTIVITY.deals.successful}</strong>
              </span>
              <span
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                спорных: <strong>{USER_ACTIVITY.deals.disputed}</strong>
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
                  {USER_ACTIVITY.profileViews.week}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  просмотров профиля за неделю
                </p>
              </div>
              <div>
                <p className="text-xl font-bold mb-0.5" style={{ color: "var(--color-text)" }}>
                  {USER_ACTIVITY.profileViews.month}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  просмотров профиля за месяц
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
