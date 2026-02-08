"use client";

import { useTheme } from "@/shared/theme/ThemeContext";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();

  return (
    <main className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
        Профиль
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        Настройки и данные пользователя.
      </p>
      <section
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Тема
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme("dark")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: theme === "dark" ? "var(--color-accent)" : "var(--color-surface)",
              color: theme === "dark" ? "white" : "var(--color-text)",
            }}
          >
            Тёмная
          </button>
          <button
            onClick={() => setTheme("light")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: theme === "light" ? "var(--color-accent)" : "var(--color-surface)",
              color: theme === "light" ? "white" : "var(--color-text)",
            }}
          >
            Светлая
          </button>
        </div>
      </section>
      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>
          Демо: данные профиля
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Имя, аватар и настройки уведомлений будут подгружаться из API и Telegram.
        </p>
      </section>
    </main>
  );
}
