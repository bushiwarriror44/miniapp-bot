"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faCheck, faStar, faCircleExclamation, faChartLine, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@/shared/theme/ThemeContext";
import { getTelegramWebApp } from "@/shared/api/client";
import { submitSupportRequest } from "@/shared/api/support";
import { fetchUserProfile, type UserProfileResponse } from "@/shared/api/users";
import { UserLabelBadge } from "@/app/components/UserLabelBadge";

const ADMIN_TG_LINK = "https://t.me/miniapp_admin_example";


type TelegramProfile = {
  username: string;
  userId: string;
  avatarUrl: string;
};

function getInitialTelegramProfile(): TelegramProfile {
  const fallback: TelegramProfile = {
    username: "user",
    userId: "-",
    avatarUrl: "/assets/telegram-ico.svg",
  };

  const telegram = getTelegramWebApp();
  const user = telegram?.initDataUnsafe?.user;
  if (!user) return fallback;

  const username = user.username || "";
  const firstName = user.first_name || "";
  const displayName = username || firstName || "user";
  const avatarByUsername = username
    ? `https://t.me/i/userpic/320/${username}.jpg`
    : "/assets/telegram-ico.svg";

  return {
    username: displayName,
    userId: String(user.id ?? "-"),
    avatarUrl: user.photo_url || avatarByUsername,
  };
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [{ username: tgUsername, userId: tgUserId, avatarUrl: tgAvatarUrl }] =
    useState<TelegramProfile>(getInitialTelegramProfile);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportText, setSupportText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const showNotice = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 6000);
  };

  const handleVerifySubmit = () => {
    setShowVerifyModal(false);
    setVerifyPhone("");
    showNotice(
      "Заявка на верификацию отправлена. Модераторы свяжутся с вами по указанному номеру телефона."
    );
  };

  const handleSupportSubmit = async () => {
    const text = supportText.trim();
    if (!text) return;
    const telegram = getTelegramWebApp();
    const telegramUsername = telegram?.initDataUnsafe?.user?.username ?? tgUsername;
    const username =
      typeof telegramUsername === "string" && telegramUsername && telegramUsername !== "user"
        ? telegramUsername.replace(/^@/, "")
        : null;
    try {
      await submitSupportRequest({
        telegramId: tgUserId,
        username: username || undefined,
        message: text,
      });
      setShowSupportModal(false);
      setSupportText("");
      showNotice(
        "Ваше обращение отправлено. Мы рассмотрим его и постараемся решить проблему как можно быстрее."
      );
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : "Не удалось отправить обращение. Попробуйте позже."
      );
    }
  };

  useEffect(() => {
    if (!tgUserId || tgUserId === "-") return;
    fetchUserProfile(tgUserId)
      .then((response) => {
        setProfile(response);
        setProfileLoadError(null);
      })
      .catch((error) => {
        console.error("Failed to load profile data:", error);
        setProfileLoadError(error instanceof Error ? error.message : String(error));
      });
  }, [tgUserId]);

  return (
    <main className="px-4 py-6 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
        }}
        aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
      >
        <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} className="w-4 h-4" />
      </button>

      <h1 className="text-2xl font-bold mb-4 pr-12" style={{ color: "var(--color-text)" }}>
        Профиль
      </h1>

      <section className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
          <img
            src={tgAvatarUrl}
            alt={tgUsername || "user"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = "/assets/telegram-ico.svg";
            }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
            @{tgUsername || "user"}
          </p>
          {profile?.isScam && (
            <UserLabelBadge name="SCAM!" color="#dc2626" />
          )}
          {profile?.isBlocked && (
            <UserLabelBadge name="Заблокирован" color="#dc2626" />
          )}
          {profile?.labels?.map((label) => (
            <UserLabelBadge key={label.id} name={label.name} color={label.color} />
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          ID: {tgUserId}
        </p>
      </section>

      <section className="mb-4">
        {profile?.verified ? (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            <FontAwesomeIcon
              icon={faCheck}
              className="w-4 h-4 shrink-0"
              style={{ color: "var(--color-accent)" }}
            />
            <p className="text-sm" style={{ color: "var(--color-text)" }}>
              Аккаунт верифицирован. Ваши объявления отображаются приоритетно.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowVerifyModal(true)}
            className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ backgroundColor: "var(--color-accent)", border: "1px solid var(--color-accent)" }}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "white" }}
            >
              !
            </span>
            <p className="text-sm text-white">
              Пройдите верификацию для приоритетного размещения объявлений
            </p>
          </button>
        )}
      </section>

      <section
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
          <FontAwesomeIcon icon={faStar} className="w-4 h-4 shrink-0" style={{ color: "var(--color-text)" }} />
          Рейтинг
        </h2>
        <p className="text-sm mb-1" style={{ color: "var(--color-text)" }}>
          Текущий рейтинг:{" "}
          <span className="font-semibold">
            {typeof profile?.rating?.total === "number" ? profile.rating.total.toFixed(1) : "-"}
          </span>
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Авто-рейтинг:{" "}
          {typeof profile?.rating?.auto === "number" ? profile.rating.auto.toFixed(1) : "-"}, ручная
          корректировка:{" "}
          {typeof profile?.rating?.manualDelta === "number" ? profile.rating.manualDelta.toFixed(1) : "-"}
        </p>
        {profileLoadError && (
          <p className="text-xs mt-2" style={{ color: "var(--color-accent)" }}>
            Ошибка загрузки профиля: {profileLoadError}
          </p>
        )}
      </section>

      <div className="space-y-2 mb-4">
        <Link
          href="/profile/statistics"
          className="flex items-center gap-3 rounded-xl px-4 py-3 w-full text-left transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 shrink-0" style={{ color: "var(--color-accent)" }} />
          <span className="font-semibold" style={{ color: "var(--color-text)" }}>
            Статистика
          </span>
        </Link>
        <Link
          href="/profile/favorites"
          className="flex items-center gap-3 rounded-xl px-4 py-3 w-full text-left transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          <FontAwesomeIcon icon={faStar} className="w-5 h-5 shrink-0" style={{ color: "var(--color-accent)" }} />
          <span className="font-semibold" style={{ color: "var(--color-text)" }}>
            Избранное
          </span>
        </Link>
        <Link
          href="/profile/faq"
          className="flex items-center gap-3 rounded-xl px-4 py-3 w-full text-left transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          <FontAwesomeIcon icon={faCircleQuestion} className="w-5 h-5 shrink-0" style={{ color: "var(--color-accent)" }} />
          <span className="font-semibold" style={{ color: "var(--color-text)" }}>
            Частые вопросы
          </span>
        </Link>
      </div>

      <section
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
          <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4 shrink-0" style={{ color: "var(--color-text)" }} />
          Нашли проблему в приложении?
        </h2>
        <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
          Наше приложение только запустилось и ещё находится в открытом тестировании. Если вы заметили
          проблему, то, пожалуйста, сообщите нам об этом любым удобным для вас способом.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={ADMIN_TG_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl py-2.5 text-sm font-medium text-center"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            Телеграмм администратора
          </a>
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="w-full rounded-xl py-2.5 text-sm font-medium"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
          >
            Написать в поддержку
          </button>
        </div>
      </section>

      {showVerifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowVerifyModal(false)}
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
                onClick={() => setShowVerifyModal(false)}
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
              placeholder="+7 900 000-00-00"
              value={verifyPhone}
              onChange={(e) => setVerifyPhone(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-4"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
            />
            <button
              type="button"
              onClick={handleVerifySubmit}
              className="w-full rounded-xl py-2.5 text-sm font-medium"
              style={{ backgroundColor: "var(--color-accent)", color: "white" }}
            >
              Отправить
            </button>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowSupportModal(false)}
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
                onClick={() => setShowSupportModal(false)}
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
              onChange={(e) => setSupportText(e.target.value)}
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-4 resize-none"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
            />
            <button
              type="button"
              onClick={handleSupportSubmit}
              className="w-full rounded-xl py-2.5 text-sm font-medium"
              style={{ backgroundColor: "var(--color-accent)", color: "white" }}
            >
              Отправить
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div
          className="fixed left-4 right-4 bottom-6 z-[100] rounded-xl p-4 shadow-lg animate-fade-in"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          role="alert"
        >
          <p className="text-sm" style={{ color: "var(--color-text)" }}>
            {notice}
          </p>
        </div>
      )}
    </main>
  );
}
