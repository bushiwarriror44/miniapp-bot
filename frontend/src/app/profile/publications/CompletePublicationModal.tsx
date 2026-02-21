"use client";

export function CompletePublicationModal({
  open,
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-xl p-4 mb-8"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm mb-4" style={{ color: "var(--color-text)" }}>
          Статус этого объявления изменится на «завершённое», оно больше не будет отображаться на
          бирже. Вы уверены?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            Нет
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            {loading ? "…" : "Да, я уверен"}
          </button>
        </div>
      </div>
    </div>
  );
}
