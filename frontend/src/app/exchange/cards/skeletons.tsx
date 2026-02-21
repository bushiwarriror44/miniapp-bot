export function ExchangeCardSkeleton() {
  return (
    <div
      className="rounded-xl p-4 min-w-0 animate-pulse"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="h-4 rounded mb-2" style={{ backgroundColor: "var(--color-surface)", width: "80%" }} />
      <div className="h-3 rounded mb-2" style={{ backgroundColor: "var(--color-surface)", width: "50%" }} />
      <div className="h-3 rounded mb-2" style={{ backgroundColor: "var(--color-surface)", width: "40%" }} />
      <div className="h-3 rounded" style={{ backgroundColor: "var(--color-surface)", width: "30%" }} />
    </div>
  );
}

export function CurrencyCardSkeleton() {
  return (
    <div
      className="rounded-xl p-4 min-w-0 animate-pulse"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="h-4 rounded mb-2" style={{ backgroundColor: "var(--color-surface)", width: "70%" }} />
      <div className="h-3 rounded mb-2" style={{ backgroundColor: "var(--color-surface)", width: "50%" }} />
      <div className="h-6 rounded mt-2" style={{ backgroundColor: "var(--color-surface)", width: "40%" }} />
    </div>
  );
}
