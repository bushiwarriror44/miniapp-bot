"use client";

export function SupportSuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm mb-4" style={{ color: "var(--color-text)" }}>
          Ваше обращение отправлено. Мы рассмотрим его и постараемся решить проблему как можно быстрее.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl py-2.5 text-sm font-medium"
          style={{ backgroundColor: "var(--color-accent)", color: "white" }}
        >
          Понятно
        </button>
      </div>
    </div>
  );
}

