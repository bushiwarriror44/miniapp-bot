"use client";

type AdsStats = { active?: number; completed?: number; hidden?: number; onModeration?: number } | null;
type DealsStats = { total?: number; successful?: number; disputed?: number } | null;

export function ProfileUserStats({
  adsStats,
  dealsStats,
}: { adsStats: AdsStats; dealsStats: DealsStats }) {
  return (
    <section
      className="rounded-xl p-4 mb-4"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h2 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>
        Статистика
      </h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Активные объявления:</span>
        <span style={{ color: "var(--color-text)" }}>{adsStats ? adsStats.active : "-"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Завершённые объявления:</span>
        <span style={{ color: "var(--color-text)" }}>{adsStats ? adsStats.completed : "-"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Скрытые объявления:</span>
        <span style={{ color: "var(--color-text)" }}>{adsStats ? adsStats.hidden : "-"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>На модерации:</span>
        <span style={{ color: "var(--color-text)" }}>
          {adsStats && typeof adsStats.onModeration === "number" ? adsStats.onModeration : "-"}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Всего сделок:</span>
        <span style={{ color: "var(--color-text)" }}>{dealsStats ? dealsStats.total : "-"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Успешные сделки:</span>
        <span style={{ color: "var(--color-text)" }}>{dealsStats ? dealsStats.successful : "-"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Спорные сделки:</span>
        <span style={{ color: "var(--color-text)" }}>{dealsStats ? dealsStats.disputed : "-"}</span>
      </div>
    </section>
  );
}
