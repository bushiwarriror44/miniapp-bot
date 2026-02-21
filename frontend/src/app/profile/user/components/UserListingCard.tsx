"use client";

import Link from "next/link";
import { SECTION_LABELS } from "../constants";
import type { UserListingItem } from "@/shared/api/user-listings";

export function UserListingCard({ listing }: { listing: UserListingItem }) {
  return (
    <Link
      href={`/exchange/view?section=${encodeURIComponent(listing.section)}&id=${encodeURIComponent(listing.id)}`}
      className="block rounded-lg p-3 no-underline"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text)",
      }}
    >
      <span className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
        {SECTION_LABELS[listing.section] ?? listing.section}
      </span>
      <p className="text-sm mt-1 mb-0 line-clamp-2" style={{ color: "var(--color-text)" }}>
        {listing.title || "Без названия"}
      </p>
    </Link>
  );
}
