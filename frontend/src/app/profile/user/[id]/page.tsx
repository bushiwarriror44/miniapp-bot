"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faExternalLink,
  faStar,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchPublicUserProfileByUsername,
  type UserProfileResponse,
  type UserStatisticsResponse,
} from "@/shared/api/users";

type LoadedState = "idle" | "loading" | "success" | "error";

export default function PublicUserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [statistics, setStatistics] = useState<UserStatisticsResponse | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadedState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showExternalWarning, setShowExternalWarning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError(null);

      try {
        const identifier = params.id.trim();
        if (!identifier) {
          throw new Error("username is required");
        }

        const loadedProfile = await fetchPublicUserProfileByUsername(
          identifier.startsWith("@") ? identifier.slice(1) : identifier,
        );

        if (cancelled) return;

        if (!loadedProfile) {
          setStatus("error");
          setError("Профиль пользователя не найден.");
          setProfile(null);
          setStatistics(null);
          setExternalUrl(null);
          return;
        }

        setProfile(loadedProfile);
        setStatistics(loadedProfile.statistics ?? null);

        const username = loadedProfile.username?.trim();
        setExternalUrl(username ? `https://t.me/${username.replace(/^@/, "")}` : null);

        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
        setProfile(null);
        setStatistics(null);
        setExternalUrl(null);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/exchange");
    }
  };

  const handleExternalOpen = () => {
    if (!externalUrl) return;
    setShowExternalWarning(true);
  };

  const confirmExternalOpen = () => {
    if (!externalUrl) return;
    setShowExternalWarning(false);
    window.open(externalUrl, "_blank", "noopener,noreferrer");
  };

  const usernameToShow =
    profile?.username && profile.username.trim()
      ? profile.username.trim().startsWith("@")
        ? profile.username.trim()
        : `@${profile.username.trim()}`
      : params.id.startsWith("@")
      ? params.id
      : `@${params.id}`;

  const adsStats = statistics?.ads;
  const dealsStats = statistics?.deals;

  return (
    <main className="px-4 py-6 relative">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm font-medium mb-4"
        style={{ color: "var(--color-accent)" }}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        Назад
      </button>

      <h1 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
        Профиль пользователя
      </h1>

      {/* Состояние загрузки / ошибок */}
      {status === "loading" && (
        <section
          className="rounded-xl p-4 space-y-3 animate-pulse"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          <div className="h-4 w-40 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
          <div className="h-6 w-24 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
          <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
        </section>
      )}

      {status === "error" && (
        <section
          className="rounded-xl p-4 mb-4 flex items-start gap-2"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: "var(--color-accent)" }}
          />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
              Не удалось загрузить профиль.
            </p>
            {error && (
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                {error}
              </p>
            )}
          </div>
        </section>
      )}

      {status === "success" && profile && (
        <>
          {/* Имя и рейтинг */}
          <section
            className="rounded-xl p-4 mb-4"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                  {usernameToShow}
                </p>
                {profile.firstName && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                    {profile.firstName} {profile.lastName || ""}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                >
                  <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
                  {typeof profile.rating?.total === "number" ? profile.rating.total.toFixed(1) : "-"}
                </span>
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  Общий зачёт в рейтинге
                </span>
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Авто-рейтинг: {profile.rating?.auto.toFixed(1)}; ручная корректировка:{" "}
              {profile.rating?.manualDelta.toFixed(1)}
            </p>
          </section>

          {/* Статистика объявлений и сделок */}
          <section
            className="rounded-xl p-4 mb-4"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h2 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>
              Статистика
            </h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>Активные объявления:</span>
              <span style={{ color: "var(--color-text)" }}>{adsStats ? adsStats.active : "-"}</span>
              <span style={{ color: "var(--color-text-muted)" }}>Завершённые объявления:</span>
              <span style={{ color: "var(--color-text)" }}>{adsStats ? adsStats.completed : "-"}</span>
              <span style={{ color: "var(--color-text-muted)" }}>Скрытые объявления:</span>
              <span style={{ color: "var(--color-text)" }}>{adsStats ? adsStats.hidden : "-"}</span>
              <span style={{ color: "var(--color-text-muted)" }}>На модерации:</span>
              <span style={{ color: "var(--color-text)" }}>
                {adsStats && typeof adsStats.onModeration === "number" ? adsStats.onModeration : "-"}
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>Всего сделок:</span>
              <span style={{ color: "var(--color-text)" }}>{dealsStats ? dealsStats.total : "-"}</span>
              <span style={{ color: "var(--color-text-muted)" }}>Успешные сделки:</span>
              <span style={{ color: "var(--color-text)" }}>{dealsStats ? dealsStats.successful : "-"}</span>
              <span style={{ color: "var(--color-text-muted)" }}>Спорные сделки:</span>
              <span style={{ color: "var(--color-text)" }}>{dealsStats ? dealsStats.disputed : "-"}</span>
            </div>
          </section>

          {/* Метки */}
          <section
            className="rounded-xl p-4 mb-4"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h2 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>
              Метки
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {profile.verified && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: "rgba(22,163,74,0.15)", color: "#16a34a" }}
                >
                  Верифицирован
                </span>
              )}
              {profile.isScam && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: "rgba(220,38,38,0.15)", color: "#dc2626" }}
                >
                  Скам
                </span>
              )}
              {profile.isBlocked && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: "rgba(220,38,38,0.15)", color: "#dc2626" }}
                >
                  Заблокирован
                </span>
              )}
              {!profile.verified && !profile.isScam && !profile.isBlocked && (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Без специальных меток
                </span>
              )}
            </div>
          </section>

          {/* Кнопка перехода во внешний профиль */}
          {externalUrl && (
            <section className="mb-4">
              <button
                type="button"
                onClick={handleExternalOpen}
                className="w-full rounded-xl py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "white",
                }}
              >
                <span>Перейти в профиль</span>
                <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3" />
              </button>
            </section>
          )}
        </>
      )}

      {/* Модальное окно-предупреждение */}
      {showExternalWarning && externalUrl && (
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
                onClick={() => setShowExternalWarning(false)}
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
                onClick={confirmExternalOpen}
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
      )}
    </main>
  );
}

