"use client";

export function VerifyModal({
  open,
  phone,
  isPhoneReadOnly = false,
  onPhoneChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  phone: string;
  isPhoneReadOnly?: boolean;
  onPhoneChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  const readOnly = Boolean(isPhoneReadOnly);

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
            Заявка на верификацию
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
          Укажите номер телефона, привязанный к вашему Telegram‑аккаунту. Мы используем его только
          для проверки и связи по вопросам верификации.
        </p>
        <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
          Номер телефона Telegram
        </label>
        <input
          type="tel"
          value={phone}
          readOnly={readOnly}
          onChange={
            readOnly
              ? undefined
              : (e) => {
                  onPhoneChange(e.target.value);
                }
          }
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-4"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
        {readOnly ? (
          <p className="text-[11px] mb-4" style={{ color: "var(--color-text-muted)" }}>
            Номер получен из Telegram и не может быть изменён вручную.
          </p>
        ) : (
          <p className="text-[11px] mb-4" style={{ color: "var(--color-text-muted)" }}>
            Введите номер телефона вручную. Он должен совпадать с номером, привязанным к вашему Telegram‑аккаунту.
          </p>
        )}
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
