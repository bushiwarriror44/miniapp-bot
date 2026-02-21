"use client";

export function SupportModal({
  open,
  supportText,
  onSupportTextChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  supportText: string;
  onSupportTextChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl p-4 mb-8"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold text-base" style={{ color: "var(--color-text)" }}>
            Сообщить о проблеме
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          Опишите, что пошло не так: на каком экране вы находитесь, что хотели сделать и что в итоге
          произошло.
        </p>
        <textarea
          placeholder="Опишите проблему..."
          value={supportText}
          onChange={(e) => onSupportTextChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-4 resize-none"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
        />
        <button
          type="button"
          onClick={onSubmit}
          className="w-full rounded-xl py-2.5 text-sm font-medium"
          style={{ backgroundColor: "var(--color-accent)", color: "white" }}
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
