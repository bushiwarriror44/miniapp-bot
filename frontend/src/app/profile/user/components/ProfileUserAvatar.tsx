"use client";

import { getUserAvatarUrl } from "../utils";

export function ProfileUserAvatar({
  username,
  alt,
}: { username: string | null; alt: string }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="relative">
        <img
          src={getUserAvatarUrl(username)}
          alt={alt}
          className="w-20 h-20 rounded-full object-cover"
          style={{ border: "2px solid var(--color-border)" }}
          onError={(e) => {
            e.currentTarget.src = "/assets/telegram-ico.svg";
          }}
        />
      </div>
    </div>
  );
}
