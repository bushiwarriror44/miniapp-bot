"use client";

import Link from "next/link";
import type { UserListingItem } from "@/shared/api/user-listings";
import { UserListingCard } from "./UserListingCard";

export function ProfileUserListingsPreview({
  username,
  listings,
  loading,
}: {
  username: string;
  listings: UserListingItem[];
  loading: boolean;
}) {
  return (
    <section
      className="rounded-xl p-4 mb-4"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold" style={{ color: "var(--color-text)" }}>
          Текущие активные объявления пользователя
        </h2>
        {!loading && listings.length > 3 && (
          <Link
            href={`/profile/user/${encodeURIComponent(username)}/listings`}
            className="text-xs font-medium shrink-0"
            style={{ color: "var(--color-accent)", textDecoration: "none" }}
          >
            Показать все
          </Link>
        )}
      </div>
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg p-3 animate-pulse"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div className="h-3 rounded w-1/3 mb-2" style={{ backgroundColor: "var(--color-border)" }} />
              <div className="h-4 rounded w-full" style={{ backgroundColor: "var(--color-border)" }} />
            </div>
          ))}
        </div>
      )}
      {!loading && listings.length === 0 && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Нет активных объявлений.
        </p>
      )}
      {!loading && listings.length > 0 && (
        <div className="space-y-2">
          {listings.slice(0, 3).map((listing) => (
            <UserListingCard key={`${listing.section}-${listing.id}`} listing={listing} />
          ))}
          {listings.length > 3 && (
            <Link
              href={`/profile/user/${encodeURIComponent(username)}/listings`}
              className="block text-center text-xs font-medium py-2"
              style={{ color: "var(--color-accent)", textDecoration: "none" }}
            >
              Показать все
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
