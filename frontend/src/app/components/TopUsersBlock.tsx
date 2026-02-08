"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { fetchTopUsers, type TopUser } from "@/shared/api/top-users";

function UserRow({ user }: { user: TopUser }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 border-b border-(--color-border) last:border-b-0"
      style={{ borderColor: "var(--color-border)" }}
    >
      <span
        className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
      >
        {user.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate" style={{ color: "var(--color-text)" }}>
          {user.name}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {user.dealsCount} сделок
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-sm" style={{ color: "var(--color-accent)" }}>
          ★ {user.rating.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-(--color-border)" style={{ borderColor: "var(--color-border)" }}>
      <div className="w-7 h-7 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="h-4 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
        <div className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
      </div>
      <div className="h-4 w-10 rounded animate-pulse shrink-0" style={{ backgroundColor: "var(--color-surface)" }} />
    </div>
  );
}

export function TopUsersBlock() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ users: TopUser[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTopUsers().then((res) => {
      if (!cancelled) {
        setData(res);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      className="mb-6 rounded-xl p-4"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
        <FontAwesomeIcon icon={faTrophy} className="w-4 h-4 shrink-0" />
        Топ пользователей
      </h2>
      {loading && (
        <div>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}
      {!loading && data?.users?.length > 0 && (
        <div>
          {data.users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      )}
    </section>
  );
}
