"use client";

export function VerifyViaBotModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold text-base" style={{ color: "var(--color-text)" }}>
            Верификация
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
            }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Верификация выполняется через Telegram-бота.
        </p>

        <ol className="mt-3 list-decimal pl-5 space-y-1 text-sm" style={{ color: "var(--color-text)" }}>
          <li>Закройте мини‑приложение.</li>
          <li>Откройте чат с ботом.</li>
          <li>Нажмите кнопку «Верификация».</li>
          <li>Нажмите «Поделиться номером» и отправьте контакт.</li>
          <li>Вернитесь в мини‑приложение и обновите профиль.</li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl py-2.5 text-sm font-medium mt-4"
          style={{ backgroundColor: "var(--color-accent)", color: "white" }}
        >
          Понятно
        </button>
      </div>
    </div>
  );
}

 
