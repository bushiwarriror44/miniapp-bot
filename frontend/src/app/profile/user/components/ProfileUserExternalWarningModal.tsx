"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export function ProfileUserExternalWarningModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h2
          className="font-semibold text-base mb-2 flex items-center gap-2"
          style={{ color: "var(--color-text)" }}
        >
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="w-4 h-4"
            style={{ color: "var(--color-accent)" }}
          />
          Внимание
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--color-text)" }}>
          Внимание, вы переходите на страницу пользователя. Администрация проекта не несет
          ответственности за все последующие действия. Рекомендуем проводить сделки через
          гаранта.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl py-2.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "white",
            }}
          >
            Понял, перейти
          </button>
        </div>
      </div>
    </div>
  );
}
