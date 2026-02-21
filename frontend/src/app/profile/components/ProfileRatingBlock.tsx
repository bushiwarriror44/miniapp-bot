"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import type { UserProfileResponse } from "@/shared/api/users";

export function ProfileRatingBlock({
  profile,
  loadError,
}: { profile: UserProfileResponse | null; loadError: string | null }) {
  return (
    <section
      className="rounded-xl p-4 mb-4"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
    >
      <h2 className="font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
        <FontAwesomeIcon icon={faStar} className="w-4 h-4 shrink-0" style={{ color: "var(--color-text)" }} />
        Рейтинг
      </h2>
      <p className="text-sm mb-1" style={{ color: "var(--color-text)" }}>
        Текущий рейтинг:{" "}
        <span className="font-semibold">
          {typeof profile?.rating?.total === "number" ? profile.rating.total.toFixed(1) : "-"}
        </span>
      </p>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Авто-рейтинг:{" "}
        {typeof profile?.rating?.auto === "number" ? profile.rating.auto.toFixed(1) : "-"}, ручная
        корректировка:{" "}
        {typeof profile?.rating?.manualDelta === "number" ? profile.rating.manualDelta.toFixed(1) : "-"}
      </p>
      <Link
        href="/profile/rating-rules"
        className="text-xs font-medium mt-2 inline-block"
        style={{ color: "var(--color-accent)", textDecoration: "none" }}
      >
        Правила рассчета рейтинга
      </Link>
      {loadError && (
        <p className="text-xs mt-2" style={{ color: "var(--color-accent)" }}>
          Ошибка загрузки профиля: {loadError}
        </p>
      )}
    </section>
  );
}
