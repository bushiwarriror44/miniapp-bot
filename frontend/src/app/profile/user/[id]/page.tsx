"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
import { fetchUserListingsPaginated, type UserListingItem } from "@/shared/api/user-listings";
import { UserLabelBadge } from "@/app/components/UserLabelBadge";

const SECTION_LABELS: Record<string, string> = {
  "sell-ads": "Продажа рекламы",
  "buy-ads": "Покупка рекламы",
  jobs: "Вакансии",
  designers: "Услуги",
  currency: "Обмен валют",
  "sell-channel": "Продажа канала",
  "buy-channel": "Покупка канала",
  other: "Другое",
};

type LoadedState = "idle" | "loading" | "success" | "error";

function getUserAvatarUrl(username: string | null): string {
  if (!username) {
    return "/assets/telegram-ico.svg";
  }
  return `https://t.me/i/userpic/320/${username}.jpg`;
}

export default function PublicUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const idFromUrl = params?.id as string | undefined;
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [statistics, setStatistics] = useState<UserStatisticsResponse | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadedState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showExternalWarning, setShowExternalWarning] = useState(false);
  const [listings, setListings] = useState<UserListingItem[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError(null);

      try {
        const raw = (idFromUrl ?? "").toString();
        const identifier = raw.trim();

        const cleanedIdentifier =
          identifier.charAt(0) === "@" ? identifier.slice(1) : identifier;

        if (!identifier) {
          if (!cancelled) {
            setStatus("error");
            setError("Профиль пользователя не найден.");
            setProfile(null);
            setStatistics(null);
            setExternalUrl(null);
          }
          return;
        }

        const loadedProfile = await fetchPublicUserProfileByUsername(cleanedIdentifier);

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

        console.log("[ProfilePage] Loaded profile:", {
          id: loadedProfile.id,
          telegramId: loadedProfile.telegramId,
          username: loadedProfile.username,
          statistics: loadedProfile.statistics,
        });
        console.log("[ProfilePage] Statistics breakdown:", {
          ads: {
            active: loadedProfile.statistics?.ads?.active ?? 0,
            completed: loadedProfile.statistics?.ads?.completed ?? 0,
            hidden: loadedProfile.statistics?.ads?.hidden ?? 0,
            onModeration: loadedProfile.statistics?.ads?.onModeration ?? 0,
          },
          deals: {
            total: loadedProfile.statistics?.deals?.total ?? 0,
            successful: loadedProfile.statistics?.deals?.successful ?? 0,
            disputed: loadedProfile.statistics?.deals?.disputed ?? 0,
          },
        });

        const username = loadedProfile.username?.trim();
        setExternalUrl(username ? `https://t.me/${username.replace(/^@/, "")}` : null);

        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[ProfilePage] Failed to load profile:", errorMessage, err);
        setError(
          errorMessage.includes("not found") || errorMessage.includes("не найден")
            ? "Профиль пользователя не найден."
            : `Не удалось загрузить профиль: ${errorMessage}`
        );
        setProfile(null);
        setStatistics(null);
        setExternalUrl(null);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [idFromUrl]);

  const profileUsername = profile?.username ?? idFromUrl;
  const cleanedUsername =
    typeof profileUsername === "string"
      ? profileUsername.trim().replace(/^@/, "")
      : (idFromUrl ?? "").toString().trim().replace(/^@/, "");

  useEffect(() => {
    if (!cleanedUsername || status !== "success") {
      const t = setTimeout(() => {
        setListings([]);
        setListingsLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    const t = setTimeout(() => {
      setListingsLoading(true);
      fetchUserListingsPaginated(cleanedUsername, { limit: 4 })
        .then((res) => {
          if (cancelled) return;
          setListings(res.items ?? []);
        })
        .catch(() => {
          if (!cancelled) setListings([]);
        })
        .finally(() => {
          if (!cancelled) setListingsLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [cleanedUsername, status]);

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

  const slug = (idFromUrl ?? "").toString().trim();
  const baseUsername =
    profile?.username && typeof profile.username === "string"
      ? profile.username.trim()
      : slug;

  const usernameToShow =
    baseUsername && baseUsername.charAt(0) === "@"
      ? baseUsername
      : baseUsername
      ? `@${baseUsername}`
      : "@user";

  const adsStats = statistics?.ads;
  const dealsStats = statistics?.deals;

  if (status === "success" && profile) {
    console.log("[ProfilePage] Rendering statistics:", {
      adsStats: {
        active: adsStats?.active ?? 0,
        completed: adsStats?.completed ?? 0,
        hidden: adsStats?.hidden ?? 0,
        onModeration: adsStats?.onModeration ?? 0,
      },
      dealsStats: {
        total: dealsStats?.total ?? 0,
        successful: dealsStats?.successful ?? 0,
        disputed: dealsStats?.disputed ?? 0,
      },
    });
  }

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

      {status === "success" && profile && (
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src={getUserAvatarUrl(profile.username)}
              alt={usernameToShow}
              className="w-20 h-20 rounded-full object-cover"
              style={{ border: "2px solid var(--color-border)" }}
              onError={(e) => {
                e.currentTarget.src = "/assets/telegram-ico.svg";
              }}
            />
          </div>
        </div>
      )}

      {status === "loading" && (
        <>
          <div className="flex justify-center mb-4">
            <div
              className="w-20 h-20 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--color-surface)" }}
            />
          </div>
          <section
            className="rounded-xl p-4 space-y-3 animate-pulse"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            <div className="h-4 w-40 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
            <div className="h-6 w-24 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
            <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
          </section>
        </>
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
          <section
            className="rounded-xl p-4 mb-4"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                    {usernameToShow}
                  </p>
                  {profile.isScam && (
                    <UserLabelBadge name="SCAM!" color="#dc2626" />
                  )}
                  {profile.isBlocked && (
                    <UserLabelBadge name="Заблокирован" color="#dc2626" />
                  )}
                  {profile.labels?.map((label) => (
                    <UserLabelBadge key={label.id} name={label.name} color={label.color} />
                  ))}
                </div>
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

          <section
            className="rounded-xl p-4 mb-4"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-semibold" style={{ color: "var(--color-text)" }}>
                Текущие активные объявления пользователя
              </h2>
              {!listingsLoading && listings.length > 3 && (
                <Link
                  href={`/profile/user/${encodeURIComponent(cleanedUsername || idFromUrl || "")}/listings`}
                  className="text-xs font-medium shrink-0"
                  style={{ color: "var(--color-accent)", textDecoration: "none" }}
                >
                  Показать все
                </Link>
              )}
            </div>
            {listingsLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 animate-pulse"
                    style={{ backgroundColor: "var(--color-surface)" }}
                  >
                    <div className="h-3 rounded w-1/3 mb-2" style={{ backgroundColor: "var(--color-border)" }} />
                    <div className="h-4 rounded w-full" style={{ backgroundColor: "var(--color-border)" }} />
                  </div>
                ))}
              </div>
            )}
            {!listingsLoading && listings.length === 0 && (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Нет активных объявлений.
              </p>
            )}
            {!listingsLoading && listings.length > 0 && (
              <div className="space-y-2">
                {listings.slice(0, 3).map((listing) => (
                  <Link
                    key={`${listing.section}-${listing.id}`}
                    href={`/exchange/view?section=${encodeURIComponent(listing.section)}&id=${encodeURIComponent(listing.id)}`}
                    className="block rounded-lg p-3 no-underline"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  >
                    <span className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
                      {SECTION_LABELS[listing.section] ?? listing.section}
                    </span>
                    <p className="text-sm mt-1 mb-0 line-clamp-2" style={{ color: "var(--color-text)" }}>
                      {listing.title || "Без названия"}
                    </p>
                  </Link>
                ))}
                {listings.length > 3 && (
                  <Link
                    href={`/profile/user/${encodeURIComponent(cleanedUsername || idFromUrl || "")}/listings`}
                    className="block text-center text-xs font-medium py-2"
                    style={{ color: "var(--color-accent)", textDecoration: "none" }}
                  >
                    Показать все
                  </Link>
                )}
              </div>
            )}
          </section>

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

