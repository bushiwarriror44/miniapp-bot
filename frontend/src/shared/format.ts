export function safeLocaleNumber(value: number | undefined | null): string {
  if (value == null || typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toLocaleString("ru-RU");
}
