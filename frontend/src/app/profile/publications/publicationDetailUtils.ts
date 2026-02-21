export function formatPublicationDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatRange(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const str = String(value).trim();
  if (!str) return "—";

  const rangeMatch = str.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (!isNaN(min) && !isNaN(max)) {
      if (min === max) {
        return `${min.toLocaleString("ru-RU")}`;
      }
      return `${min.toLocaleString("ru-RU")} — ${max.toLocaleString("ru-RU")}`;
    }
  }

  const num = parseFloat(str);
  if (!isNaN(num)) {
    return num.toLocaleString("ru-RU");
  }

  return str;
}

export function formatPriceRange(value: string | number | null | undefined): string {
  const formatted = formatRange(value);
  return formatted === "—" ? formatted : `${formatted} ₽`;
}

export function formatViewsRange(value: string | number | null | undefined): string {
  return formatRange(value);
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "на модерации",
  approved: "Опубликовано",
  rejected: "Отклонено",
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "var(--color-accent)";
    case "approved":
      return "#16a34a";
    case "rejected":
      return "#dc2626";
    default:
      return "var(--color-text-muted)";
  }
}

const SECTION_LABELS: Record<string, string> = {
  "buy-ads": "Покупка рекламы",
  "sell-ads": "Продажа рекламы",
  jobs: "Вакансии",
  services: "Услуги",
  "sell-channels": "Продажа каналов",
  "buy-channels": "Покупка каналов",
  other: "Прочее",
};

export function getSectionLabel(section: string): string {
  return SECTION_LABELS[section] || section;
}
