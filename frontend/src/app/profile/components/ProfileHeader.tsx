"use client";

import { UserLabelBadge } from "@/app/components/UserLabelBadge";
import type { UserProfileResponse } from "@/shared/api/users";

export function ProfileHeader({
  username,
  userId,
  avatarUrl,
  profile,
  loading,
}: {
  username: string;
  userId: string;
  avatarUrl: string;
  profile: UserProfileResponse | null;
  loading: boolean;
}) {
  return (
    <section className="flex flex-col items-center mb-6">
      <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
        {loading ? (
          <div
            className="w-full h-full rounded-full animate-pulse"
            style={{ backgroundColor: "var(--color-surface)" }}
          />
        ) : (
          <img
            src={avatarUrl}
            alt={username || "user"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = "/assets/telegram-ico.svg";
            }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          @{username || "user"}
        </p>
        {profile?.isScam && <UserLabelBadge name="SCAM!" color="#dc2626" />}
        {profile?.isBlocked && <UserLabelBadge name="Заблокирован" color="#dc2626" />}
        {profile?.labels?.map((label) => (
          <UserLabelBadge key={label.id} name={label.name} color={label.color} />
        ))}
      </div>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        ID: {userId}
      </p>
    </section>
  );
}
