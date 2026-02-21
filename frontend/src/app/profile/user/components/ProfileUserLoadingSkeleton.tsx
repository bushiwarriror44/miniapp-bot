"use client";

export function ProfileUserLoadingSkeleton() {
  return (
    <>
      <div className="flex justify-center mb-4">
        <div
          className="w-20 h-20 rounded-full animate-pulse"
          style={{ backgroundColor: "var(--color-surface)" }}
        />
      </div>
      <section
        className="rounded-xl p-4 space-y-3 animate-pulse"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <div className="h-4 w-40 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
        <div className="h-6 w-24 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
        <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
      </section>
    </>
  );
}
