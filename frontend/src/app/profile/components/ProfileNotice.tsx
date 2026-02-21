"use client";

export function ProfileNotice({ text }: { text: string | null }) {
  if (!text) return null;

  return (
    <div
      className="fixed left-4 right-4 bottom-6 z-[100] rounded-xl p-4 shadow-lg animate-fade-in"
      style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      role="alert"
    >
      <p className="text-sm" style={{ color: "var(--color-text)" }}>
        {text}
      </p>
    </div>
  );
}
