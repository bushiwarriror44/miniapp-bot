export function parseExpiresAt(expiresAt: unknown): Date | null {
  if (expiresAt == null) return null;
  if (expiresAt instanceof Date) {
    return Number.isNaN(expiresAt.getTime()) ? null : expiresAt;
  }
  if (typeof expiresAt !== "string") return null;
  const s = expiresAt.trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function isExpired(expiresAt: unknown, now: Date = new Date()): boolean {
  const d = parseExpiresAt(expiresAt);
  if (!d) return false;
  return now.getTime() > d.getTime();
}

export function filterNotExpired<T extends { expiresAt?: unknown }>(
  items: T[],
  now: Date = new Date(),
): T[] {
  return (items ?? []).filter((x) => !isExpired(x?.expiresAt, now));
}

