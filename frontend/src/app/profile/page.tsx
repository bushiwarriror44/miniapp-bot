"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faCircleExclamation, faChartLine, faStar, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@/shared/theme/ThemeContext";
import { getTelegramWebApp } from "@/shared/api/client";
import { submitSupportRequest } from "@/shared/api/support";
import { fetchUserProfile, type UserProfileResponse } from "@/shared/api/users";
import { getInitialTelegramProfile } from "./utils";
import {
  ProfileHeader,
  ProfileVerifiedBlock,
  ProfileRatingBlock,
  ProfileMenuRow,
  SupportModal,
  VerifyModal,
  VerifyConsentDialog,
  ProfileNotice,
} from "./components";
import { submitVerifyPhone } from "@/shared/api/users";

const ADMIN_TG_LINK = "https://t.me/miniapp_admin_example";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [{ username: tgUsername, userId: tgUserId, avatarUrl: tgAvatarUrl }] =
    useState(getInitialTelegramProfile);
  const [showVerifyConsent, setShowVerifyConsent] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportText, setSupportText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const showNotice = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 6000);
  };

  const handleVerifyConsentConfirm = async () => {
    setShowVerifyConsent(false);
    const telegram = getTelegramWebApp();
    const requestContact = telegram?.requestContact;
    if (typeof requestContact === "function") {
      try {
        const result = await requestContact();
        const phone = result?.contact?.phone_number?.trim();
        if (phone && tgUserId && tgUserId !== "-") {
          await submitVerifyPhone(tgUserId, phone);
          showNotice(
            "Номер телефона передан для верификации. Модераторы свяжутся с вами при необходимости."
          );
          return;
        }
      } catch {
      }
    }
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async () => {
    const phone = verifyPhone.trim();
    if (!phone) return;
    if (!tgUserId || tgUserId === "-") {
      showNotice("Не удалось определить пользователя.");
      return;
    }
    try {
      await submitVerifyPhone(tgUserId, phone);
      setShowVerifyModal(false);
      setVerifyPhone("");
      showNotice(
        "Заявка на верификацию отправлена. Модераторы свяжутся с вами по указанному номеру телефона."
      );
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Не удалось отправить номер. Попробуйте позже.");
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
    if (!tgUserId || tgUserId === "-") {
      queueMicrotask(() => setProfileLoading(false));
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
          onVerifyClick={() => setShowVerifyConsent(true)}
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

      <VerifyConsentDialog
        open={showVerifyConsent}
        onConfirm={handleVerifyConsentConfirm}
        onCancel={() => setShowVerifyConsent(false)}
      />
      <VerifyModal
        open={showVerifyModal}
        phone={verifyPhone}
        onPhoneChange={setVerifyPhone}
        onClose={() => setShowVerifyModal(false)}
        onSubmit={handleVerifySubmit}
      />
      <SupportModal
        open={showSupportModal}
        supportText={supportText}
        onSupportTextChange={setSupportText}
        onClose={() => setShowSupportModal(false)}
        onSubmit={handleSupportSubmit}
      />
      <ProfileNotice text={notice} />
    </main>
  );
}
