"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faCircleExclamation, faChartLine, faStar, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@/shared/theme/ThemeContext";
import { getTelegramWebApp } from "@/shared/api/client";
import { submitSupportRequest } from "@/shared/api/support";
import { fetchUserProfile, type UserProfileResponse } from "@/shared/api/users";
import { fetchBotConfig } from "@/shared/api/bot-config";
import { getInitialTelegramProfile } from "./utils";
import {
  ProfileHeader,
  ProfileVerifiedBlock,
  ProfileRatingBlock,
  ProfileMenuRow,
  SupportModal,
  SupportSuccessModal,
  ProfileNotice,
} from "./components";
import { VerifyViaBotModal } from "./components/VerifyViaBotModal";

const DEFAULT_SUPPORT_LINK = "https://t.me/miniapp_admin_example";

function isValidUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [telegramProfile, setTelegramProfile] = useState(getInitialTelegramProfile);
  const { username: tgUsername, userId: tgUserId, avatarUrl: tgAvatarUrl } = telegramProfile;
  const [showVerifyViaBotModal, setShowVerifyViaBotModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportText, setSupportText] = useState("");
  const [showSupportSuccess, setShowSupportSuccess] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [supportLink, setSupportLink] = useState<string>(DEFAULT_SUPPORT_LINK);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const showNotice = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 6000);
  };

  const refreshTelegramProfile = () => {
    const next = getInitialTelegramProfile();
    setTelegramProfile(next);
    if (!next.userId || next.userId === "-") {
      showNotice(
        "Telegram не передал данные пользователя. Попробуйте перезапустить мини‑приложение или обновить Telegram до актуальной версии.",
      );
    } else {
      showNotice("Данные профиля Telegram обновлены. Если профиль не загрузился, попробуйте снова.");
    }
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
      setShowSupportSuccess(true);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : "Не удалось отправить обращение. Попробуйте позже."
      );
    }
  };

  useEffect(() => {
    if (!tgUserId || tgUserId === "-") {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[profile] Skip profile load: invalid tgUserId", {
          tgUserId,
        });
      }
      queueMicrotask(() => {
        setProfileLoading(false);
        showNotice(
          "Не удалось определить ваш Telegram‑профиль. Откройте мини‑приложение из Telegram ещё раз или обновите клиент.",
        );
      });
      return;
    }
    fetchUserProfile(tgUserId)
      .then((response) => {
        setProfile(response);
        setProfileLoadError(null);
        setProfileLoading(false);
      })
      .catch((error) => {
        setProfileLoadError(error instanceof Error ? error.message : String(error));
        setProfileLoading(false);
      });
  }, [tgUserId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    fetchBotConfig()
      .then((cfg) => {
        if (isValidUrl(cfg?.supportLink)) {
          setSupportLink(cfg.supportLink);
        }
      })
      .catch(() => {
        // keep default
      });
  }, []);

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

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex-1" />
        <button
          type="button"
          onClick={refreshTelegramProfile}
          className="rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          Обновить данные Telegram
        </button>
      </div>

      <ProfileHeader
        username={tgUsername}
        userId={tgUserId}
        avatarUrl={tgAvatarUrl}
        profile={profile}
        loading={profileLoading}
      />

      <section className="mb-4">
        <ProfileVerifiedBlock
          verified={!!profile?.verified}
          onVerifyClick={() => setShowVerifyViaBotModal(true)}
        />
      </section>

      <ProfileRatingBlock profile={profile} loadError={profileLoadError} />

      <div className="space-y-2 mb-4">
        <ProfileMenuRow href="/profile/statistics" icon={faChartLine} label="Статистика" />
        <ProfileMenuRow href="/profile/favorites" icon={faStar} label="Избранное" />
        <ProfileMenuRow href="/profile/faq" icon={faCircleQuestion} label="Частые вопросы" />
      </div>

      <section
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="font-semibold mb-2 flex items-start gap-2" style={{ color: "var(--color-text)" }}>
          <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-text)" }} />
          Нашли проблему в приложении?
        </h2>
        <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
          Наше приложение только запустилось и ещё находится в открытом тестировании. Если вы заметили
          проблему, то, пожалуйста, сообщите нам об этом любым удобным для вас способом.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={supportLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl py-2.5 text-sm font-medium text-center"
            style={{ backgroundColor: "var(--color-accent)", color: "white" }}
          >
            Телеграм администратора
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

      <VerifyViaBotModal
        open={showVerifyViaBotModal && !profile?.verified}
        onClose={() => setShowVerifyViaBotModal(false)}
      />
      <SupportModal
        open={showSupportModal}
        supportText={supportText}
        onSupportTextChange={setSupportText}
        onClose={() => setShowSupportModal(false)}
        onSubmit={handleSupportSubmit}
      />
      <SupportSuccessModal open={showSupportSuccess} onClose={() => setShowSupportSuccess(false)} />
      <ProfileNotice text={notice} />
    </main>
  );
}
