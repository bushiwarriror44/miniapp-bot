"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink } from "@fortawesome/free-solid-svg-icons";
import {
  fetchPublicUserProfileByUsername,
  type UserProfileResponse,
  type UserStatisticsResponse,
} from "@/shared/api/users";
import { fetchUserListingsPaginated, type UserListingItem } from "@/shared/api/user-listings";
import {
  ProfileUserBackButton,
  ProfileUserAvatar,
  ProfileUserHeader,
  ProfileUserStats,
  ProfileUserListingsPreview,
  ProfileUserExternalWarningModal,
  ProfileUserLoadingSkeleton,
  ProfileUserErrorState,
} from "../components";

type LoadedState = "idle" | "loading" | "success" | "error";

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
      const raw = (idFromUrl ?? "").toString().trim();
      const identifier = raw.charAt(0) === "@" ? raw.slice(1) : raw;
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
      try {
        const loadedProfile = await fetchPublicUserProfileByUsername(identifier);
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
        const msg = err instanceof Error ? err.message : String(err);
        setError(
          msg.includes("not found") || msg.includes("не найден")
            ? "Профиль пользователя не найден."
            : `Не удалось загрузить профиль: ${msg}`
        );
        setProfile(null);
        setStatistics(null);
        setExternalUrl(null);
      }
    }
    void load();
    return () => { cancelled = true; };
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
          if (!cancelled) setListings(res.items ?? []);
        })
        .catch(() => { if (!cancelled) setListings([]); })
        .finally(() => { if (!cancelled) setListingsLoading(false); });
    }, 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [cleanedUsername, status]);

  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else router.push("/exchange");
  };

  const handleExternalOpen = () => { if (externalUrl) setShowExternalWarning(true); };

  const confirmExternalOpen = () => {
    if (externalUrl) {
      setShowExternalWarning(false);
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  const baseUsername =
    profile?.username && typeof profile.username === "string"
      ? profile.username.trim()
      : (idFromUrl ?? "").toString().trim();
  const usernameToShow =
    baseUsername && baseUsername.charAt(0) === "@" ? baseUsername : baseUsername ? `@${baseUsername}` : "@user";
  const adsStats = statistics?.ads;
  const dealsStats = statistics?.deals;

  return (
    <main className="px-4 py-6 relative">
      <ProfileUserBackButton onClick={handleBack} />
      <h1 className="text-xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>
        Профиль пользователя
      </h1>

      {status === "success" && profile && (
        <ProfileUserAvatar username={profile.username} alt={usernameToShow} />
      )}
      {status === "loading" && <ProfileUserLoadingSkeleton />}
      {status === "error" && <ProfileUserErrorState error={error} />}

      {status === "success" && profile && (
        <>
          <ProfileUserHeader profile={profile} usernameToShow={usernameToShow} />
          <ProfileUserStats adsStats={adsStats ?? null} dealsStats={dealsStats ?? null} />

          <section
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          >
            <h2 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>Метки</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {profile.verified && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "rgba(22,163,74,0.15)", color: "#16a34a" }}>Верифицирован</span>
              )}
              {profile.isScam && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "rgba(220,38,38,0.15)", color: "#dc2626" }}>Скам</span>
              )}
              {profile.isBlocked && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "rgba(220,38,38,0.15)", color: "#dc2626" }}>Заблокирован</span>
              )}
              {profile.labels?.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: `${label.color}20`, color: label.color }}
                >
                  {label.name}
                </span>
              ))}
              {!profile.verified && !profile.isScam && !profile.isBlocked && (!profile.labels || profile.labels.length === 0) && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}>Без специальных меток</span>
              )}
            </div>
          </section>

          <ProfileUserListingsPreview username={cleanedUsername || idFromUrl || ""} listings={listings} loading={listingsLoading} />

          {externalUrl && (
            <section className="mb-4">
              <button
                type="button"
                onClick={handleExternalOpen}
                className="w-full rounded-xl py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-accent)", color: "white" }}
              >
                <span>Перейти в профиль</span>
                <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3" />
              </button>
            </section>
          )}
        </>
      )}

      <ProfileUserExternalWarningModal
        open={showExternalWarning && !!externalUrl}
        onClose={() => setShowExternalWarning(false)}
        onConfirm={confirmExternalOpen}
      />
    </main>
  );
}
