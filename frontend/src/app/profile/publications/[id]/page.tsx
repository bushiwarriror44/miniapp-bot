"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faClipboard, faCheckCircle, faXmarkCircle, faFlagCheckered } from "@fortawesome/free-solid-svg-icons";
import { getTelegramWebApp } from "@/shared/api/client";
import { fetchMyPublications, completePublication, type MyPublicationItem } from "@/shared/api/users";
import { AD_TYPE_LABELS, PAYMENT_LABELS, type AdType, type PaymentMethod } from "@/shared/api/ads";
import { safeLocaleNumber } from "@/shared/format";
import {
  formatPublicationDate,
  formatPriceRange,
  formatViewsRange,
  getStatusLabel,
  getStatusColor,
  getSectionLabel,
} from "../publicationDetailUtils";
import { CompletePublicationModal } from "../CompletePublicationModal";

export default function PublicationDetailPage() {
  const params = useParams();
  const publicationId = params?.id as string | undefined;

  const [publication, setPublication] = useState<MyPublicationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const telegramId = useMemo(() => {
    const telegram = getTelegramWebApp();
    const user = telegram?.initDataUnsafe?.user;
    const userId = user != null && "id" in user ? (user as { id: number }).id : undefined;
    return userId != null ? String(userId) : "";
  }, []);

  useEffect(() => {
    if (!telegramId || !publicationId) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    setLoading(true);
    fetchMyPublications(telegramId)
      .then((result) => {
        const found = result.publications.find((item) => item.id === publicationId);
        if (found) {
          setPublication(found);
          setLoadError(null);
        } else {
          setLoadError("Публикация не найдена");
        }
      })
      .catch((err) => {
        console.error("Failed to load publication:", err);
        setLoadError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [telegramId, publicationId]);

  if (loading) {
    return (
      <main className="px-4 py-6">
        <Link
          href="/profile/publications"
          className="inline-flex items-center gap-2 text-sm font-medium mb-4"
          style={{ color: "var(--color-accent)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          Назад к публикациям
        </Link>
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Загрузка…
          </p>
        </div>
      </main>
    );
  }

  if (loadError || !publication) {
    return (
      <main className="px-4 py-6">
        <Link
          href="/profile/publications"
          className="inline-flex items-center gap-2 text-sm font-medium mb-4"
          style={{ color: "var(--color-accent)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          Назад к публикациям
        </Link>
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-accent)" }}>
            {loadError || "Публикация не найдена"}
          </p>
        </div>
      </main>
    );
  }

  const formData = publication.formData || {};
  const section = publication.section;

  return (
    <main className="px-4 py-6">
      <Link
        href="/profile/publications"
        className="inline-flex items-center gap-2 text-sm font-medium mb-4"
        style={{ color: "var(--color-accent)" }}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
        Назад к публикациям
      </Link>

      <section
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-semibold flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
            <FontAwesomeIcon icon={faClipboard} className="w-4 h-4 shrink-0" style={{ color: "var(--color-accent)" }} />
            Детали публикации
          </h1>
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: publication.status === "pending" ? "var(--color-surface)" : "transparent",
              color: getStatusColor(publication.status),
            }}
          >
            {publication.status === "approved" && (
              <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" style={{ color: "#16a34a" }} />
            )}
            {publication.status === "rejected" && (
              <FontAwesomeIcon icon={faXmarkCircle} className="w-3 h-3" style={{ color: "#dc2626" }} />
            )}
            {publication.status === "completed" && (
              <FontAwesomeIcon icon={faFlagCheckered} className="w-3 h-3" style={{ color: "var(--color-text-muted)" }} />
            )}
            {getStatusLabel(publication.status)}
          </span>
        </div>

        {publication.status === "approved" && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => { setCompleteError(null); setCompleteModalOpen(true); }}
              className="w-full rounded-xl py-2.5 text-sm font-medium"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              Завершить объявление
            </button>
            {completeError && (
              <p className="text-xs mt-2" style={{ color: "var(--color-accent)" }}>
                {completeError}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Раздел
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
              {getSectionLabel(section)}
            </p>
          </div>

          {section === "buy-ads" && (
            <>
              {formData.username && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Username:</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {String(formData.username).startsWith("@") ? String(formData.username) : `@${formData.username}`}
                  </span>
                </div>
              )}
              {formData.priceRange && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Сумма:</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {formatPriceRange(formData.priceRange as string | number | null | undefined)}
                  </span>
                </div>
              )}
              {formData.viewsRange && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Просмотров:</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {formatViewsRange(formData.viewsRange as string | number | null | undefined)}
                  </span>
                </div>
              )}
              {formData.theme && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
                  <span style={{ color: "var(--color-text)" }}>{String(formData.theme)}</span>
                </div>
              )}
              {formData.description && (
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                    Описание:
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-text)" }}>
                    {String(formData.description)}
                  </p>
                </div>
              )}
            </>
          )}

          {section === "sell-ads" && (
            <>
              {formData.username && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Username:</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {String(formData.username).startsWith("@") ? String(formData.username) : `@${formData.username}`}
                  </span>
                </div>
              )}
              {formData.channelOrChatLink && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Ссылка на канал/чат:</span>
                  <a
                    href={String(formData.channelOrChatLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs truncate"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {String(formData.channelOrChatLink)}
                  </a>
                </div>
              )}
              {formData.price != null && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Цена:</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {safeLocaleNumber(Number(formData.price))} ₽
                  </span>
                </div>
              )}
              {formData.adType && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Тип объявления:</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {(AD_TYPE_LABELS[String(formData.adType) as AdType] as string | undefined) || String(formData.adType)}
                  </span>
                </div>
              )}
              {formData.paymentMethod && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Способ оплаты:</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {(PAYMENT_LABELS[String(formData.paymentMethod) as PaymentMethod] as string | undefined) || String(formData.paymentMethod)}
                  </span>
                </div>
              )}
              {formData.pinned != null && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>С закрепом:</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {formData.pinned ? "Да" : "Нет"}
                  </span>
                </div>
              )}
              {formData.underGuarantee != null && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Под гаранта:</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {formData.underGuarantee ? "Да" : "Нет"}
                  </span>
                </div>
              )}
              {formData.publishTime && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Время публикации:</span>
                  <span style={{ color: "var(--color-text)" }}>{String(formData.publishTime)}</span>
                </div>
              )}
              {formData.postDuration && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Длительность поста:</span>
                  <span style={{ color: "var(--color-text)" }}>{String(formData.postDuration)}</span>
                </div>
              )}
              {formData.theme && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
                  <span style={{ color: "var(--color-text)" }}>{String(formData.theme)}</span>
                </div>
              )}
              {formData.description && (
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                    Описание:
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-text)" }}>
                    {String(formData.description)}
                  </p>
                </div>
              )}
            </>
          )}

          {section !== "buy-ads" && section !== "sell-ads" && (
            <>
              {Object.entries(formData).map(([key, value]) => {
                if (value == null || value === "") return null;
                return (
                  <div key={key} className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <span style={{ color: "var(--color-text-muted)" }}>{key}:</span>
                    <span style={{ color: "var(--color-text)" }}>{String(value)}</span>
                  </div>
                );
              })}
            </>
          )}

          <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>Дата создания:</span>
              <span style={{ color: "var(--color-text)" }}>
                {formatPublicationDate(publication.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <CompletePublicationModal
        open={completeModalOpen}
        loading={completeLoading}
        onConfirm={async () => {
          if (!telegramId || !publication) return;
          setCompleteLoading(true);
          setCompleteError(null);
          try {
            await completePublication(telegramId, publication.id);
            setPublication({ ...publication, status: "completed" });
            setCompleteModalOpen(false);
          } catch (err) {
            setCompleteError(err instanceof Error ? err.message : String(err));
          } finally {
            setCompleteLoading(false);
          }
        }}
        onCancel={() => setCompleteModalOpen(false)}
      />
    </main>
  );
}
