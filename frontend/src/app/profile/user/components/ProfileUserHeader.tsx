"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { UserLabelBadge } from "@/app/components/UserLabelBadge";
import type { UserProfileResponse } from "@/shared/api/users";

export function ProfileUserHeader({
  profile,
  usernameToShow,
}: { profile: UserProfileResponse; usernameToShow: string }) {
  return (
    <section
      className="rounded-xl p-4 mb-4"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
              {usernameToShow}
            </p>
            {profile.isScam && (
              <UserLabelBadge name="SCAM!" color="#dc2626" />
            )}
            {profile.isBlocked && (
              <UserLabelBadge name="Заблокирован" color="#dc2626" />
            )}
            {profile.labels?.map((label) => (
              <UserLabelBadge key={label.id} name={label.name} color={label.color} />
            ))}
          </div>
          {profile.firstName && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
              {profile.firstName} {profile.lastName || ""}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
            {typeof profile.rating?.total === "number" ? profile.rating.total.toFixed(1) : "-"}
          </span>
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            Общий зачёт в рейтинге
          </span>
        </div>
      </div>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Авто-рейтинг: {typeof profile.rating?.auto === "number" ? profile.rating.auto.toFixed(1) : "-"}; ручная корректировка:{" "}
        {typeof profile.rating?.manualDelta === "number" ? profile.rating.manualDelta.toFixed(1) : "-"}
      </p>
    </section>
  );
}
