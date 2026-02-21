"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export function ProfileMenuRow({
  href,
  icon,
  label,
}: { href: string; icon: IconDefinition; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-3 w-full text-left transition-opacity hover:opacity-90"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
    >
      <FontAwesomeIcon icon={icon} className="w-5 h-5 shrink-0" style={{ color: "var(--color-accent)" }} />
      <span className="font-semibold" style={{ color: "var(--color-text)" }}>
        {label}
      </span>
    </Link>
  );
}
