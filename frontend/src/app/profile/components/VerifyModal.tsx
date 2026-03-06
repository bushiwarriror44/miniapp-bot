"use client";

export interface VerifyModalProps {
  open: boolean;
  phone: string;
  isPhoneReadOnly?: boolean;
  showNoPhoneHint?: boolean;
  onHideNoPhoneHint?: () => void;
  onPhoneChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function VerifyModal({
  open,
  phone,
  isPhoneReadOnly = false,
  showNoPhoneHint,
  onHideNoPhoneHint,
  onPhoneChange,
  onClose,
  onSubmit,
}: VerifyModalProps) {
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
        {showNoPhoneHint && (
          <div
            className="mb-3 rounded-lg p-3 relative text-xs"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            <button
              type="button"
              onClick={onHideNoPhoneHint}
              className="absolute right-2 top-2 w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
              }}
              aria-label="Скрыть подсказку"
            >
              ×
            </button>
            <p className="mb-1">
              Telegram не передал ваш номер телефона. Верификация доступна только для аккаунтов с раскрытым номером.
            </p>
            <p className="mb-1">Как включить показ номера в Telegram:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Откройте Telegram → «Настройки».</li>
              <li>Перейдите в раздел «Конфиденциальность» / «Privacy».</li>
              <li>Откройте пункт «Номер телефона».</li>
              <li>
                Выберите вариант, при котором ваш номер может быть передан ботам/мини‑приложениям (например, «Мои
                контакты» или менее строгий вариант).
              </li>
              <li>Перезапустите мини‑приложение и повторите попытку.</li>
            </ol>
            <p className="mt-1">
              Либо введите номер вручную ниже и убедитесь, что он совпадает с номером в вашем аккаунте Telegram.
            </p>
          </div>
        )}
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          Укажите номер телефона, привязанный к вашему Telegram‑аккаунту. Мы используем его только
          для проверки и связи по вопросам верификации.
        </p>
        <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
          Номер телефона Telegram
        </label>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={phone}
          readOnly={readOnly}
          onChange={
            readOnly
              ? undefined
              : (e) => {
                  const digitsOnly = e.target.value.replace(/\D+/g, "");
                  onPhoneChange(digitsOnly);
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
