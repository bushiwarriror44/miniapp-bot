"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { fetchAds, AD_TYPE_LABELS, PAYMENT_LABELS, type AdItem } from "@/shared/api/ads";
import { fetchBuyAds, type BuyAdItem } from "@/shared/api/buyAds";
import {
  fetchJobs,
  WORK_LABELS,
  EMPLOYMENT_LABELS,
  PAYMENT_CURRENCY_LABELS,
  JOB_OFFER_TYPE_LABELS,
  type JobItem,
  type WorkType,
  type EmploymentType,
  type PaymentCurrency,
  type JobOfferType,
} from "@/shared/api/jobs";
import {
  fetchServices,
  formatServiceDate,
  type ServiceItem,
} from "@/shared/api/services";
import { fetchSellChannels, type SellChannelItem } from "@/shared/api/sellChannels";
import { fetchBuyChannels, type BuyChannelItem } from "@/shared/api/buyChannels";
import { fetchOther, type OtherItem } from "@/shared/api/other";
import { getTelegramWebApp } from "@/shared/api/client";
import { submitModerationRequest } from "@/shared/api/moderation";
import {
  faBullhorn,
  faBriefcase,
  faPalette,
  faCoins,
  faArrowRightArrowLeft,
  faStore,
  faShoppingCart,
  faPenToSquare,
  faFilter,
  faFilterCircleXmark,
  faXmark,
  faBox,
} from "@fortawesome/free-solid-svg-icons";

type ExchangeSection = "buy-ads" | "sell-ads" | "jobs" | "designers" | "currency" | "sell-channel" | "buy-channel" | "other";

type SubmitFormSection = Exclude<ExchangeSection, "currency">;

const SECTIONS: { id: ExchangeSection; label: string; icon: typeof faBullhorn }[] = [
  { id: "buy-ads", label: "Покупка рекламы", icon: faBullhorn },
  { id: "sell-ads", label: "Продажа рекламы", icon: faBullhorn },
  { id: "jobs", label: "Вакансии", icon: faBriefcase },
  { id: "designers", label: "Услуги", icon: faPalette },
  { id: "currency", label: "Обмен валют", icon: faCoins },
  { id: "sell-channel", label: "Продать канал", icon: faStore },
  { id: "buy-channel", label: "Купить канал", icon: faShoppingCart },
  { id: "other", label: "Другое", icon: faBox },
];

const SECTIONS_FOR_SUBMIT = SECTIONS.filter((s) => s.id !== "currency");

const inputStyleModal = {
  backgroundColor: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--input-text)",
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

function ExchangePageContent() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<ExchangeSection>("buy-ads");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitSection, setSubmitSection] = useState<SubmitFormSection>("buy-ads");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (searchParams.get("openSubmit") === "1") {
      setShowSubmitModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("openSubmit");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams]);

  const openSubmitModal = () => {
    setShowSubmitModal(true);
    setSubmitSection("buy-ads");
    setFormData({});
  };

  const closeSubmitModal = () => setShowSubmitModal(false);

  const setFormField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitRequest = async () => {
    const tg = getTelegramWebApp();
    const telegramId = tg?.initDataUnsafe?.user?.id;
    if (!telegramId) {
      setSubmitError("Не удалось определить Telegram ID пользователя.");
      return;
    }
    if (!Object.keys(formData).length) {
      setSubmitError("Заполните хотя бы одно поле заявки.");
      return;
    }
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await submitModerationRequest({
        telegramId: String(telegramId),
        section: submitSection,
        formData,
      });
      setShowSubmitModal(false);
      setShowSuccessNotice(true);
      setFormData({});
      setTimeout(() => setShowSuccessNotice(false), 6000);
    } catch (error) {
      console.error("Failed to submit moderation request:", error);
      setSubmitError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <main className="px-4 py-6">
      {/* Блок размещения объявления — открывает попап заявки */}
      <button
        type="button"
        onClick={openSubmitModal}
        className="w-full text-left rounded-xl p-4 mb-4 flex gap-3 cursor-pointer transition-opacity hover:opacity-95"
        style={{ backgroundColor: "var(--color-accent)" }}
      >
        <FontAwesomeIcon icon={faPenToSquare} className="w-6 h-6 shrink-0 text-white" />
        <div className="min-w-0">
          <h2 className="font-semibold text-sm mb-2 text-white">
            Разместите свое объявление
          </h2>
          <p className="text-xs text-white/90" style={{ lineHeight: 1.083 }}>
            Разместить объявление проще простого: подайте заявку в форму, оно пройдет модерацию и будет опубликовано в этой ленте.
          </p>
        </div>
      </button>

      {/* Уведомление об отправке заявки */}
      {showSuccessNotice && (
        <div
          className="fixed left-4 right-4 bottom-6 z-100 rounded-xl p-4 shadow-lg animate-fade-in"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
          role="alert"
        >
          <p className="text-sm" style={{ color: "var(--color-text)" }}>
            Ваша заявка направлена модераторам проекта, подождите, если все в порядке, то мы скоро ее опубликуем.
          </p>
        </div>
      )}

      {/* Попап заявки на размещение */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && closeSubmitModal()}
        >
          <div
            className="w-full max-w-lg rounded-xl p-4 mb-8 relative"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-semibold text-base" style={{ color: "var(--color-text)" }}>
                Заявка на размещение
              </h2>
              <button
                type="button"
                onClick={closeSubmitModal}
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                aria-label="Закрыть"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                Раздел размещения
              </label>
              <select
                value={submitSection}
                onChange={(e) => {
                  setSubmitSection((e.target.value || "ads") as SubmitFormSection);
                  setFormData({});
                }}
                className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
                style={inputStyleModal}
              >
                {SECTIONS_FOR_SUBMIT.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <SubmitFormBySection
              section={submitSection}
              formData={formData}
              setFormField={setFormField}
              inputStyleModal={inputStyleModal}
            />

            <button
              type="button"
              onClick={handleSubmitRequest}
              disabled={submitLoading}
              className="w-full rounded-xl py-3 text-sm font-medium mt-4"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "white",
                opacity: submitLoading ? 0.7 : 1,
              }}
            >
              {submitLoading ? "Отправка..." : "Отправить"}
            </button>
            {submitError && (
              <p className="text-xs mt-3" style={{ color: "var(--color-accent)" }}>
                Ошибка отправки заявки: {submitError}
              </p>
            )}
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
        Биржа
      </h1>

      {/* Табы разделов — горизонтальный скролл с видимой полосой акцентного цвета */}
      <div className="mb-6 overflow-x-auto overflow-y-hidden scrollbar-accent -mx-4 px-4" style={{ paddingBottom: 5 }}>
        <div className="flex gap-2 min-w-0" style={{ marginBottom: 5 }}>
          {SECTIONS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeSection === id ? "var(--color-accent)" : "var(--color-bg-elevated)",
                color: activeSection === id ? "white" : "var(--color-text-muted)",
                border: `1px solid ${activeSection === id ? "var(--color-accent)" : "var(--color-border)"}`,
              }}
            >
              <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Контент по выбранному разделу */}
      {activeSection === "buy-ads" && <BuyAdsSection />}
      {activeSection === "sell-ads" && <SellAdsSection />}
      {activeSection === "jobs" && <JobsSection />}
      {activeSection === "designers" && <DesignersSection />}
      {activeSection === "currency" && <CurrencySection />}
      {activeSection === "sell-channel" && <SellChannelSection />}
      {activeSection === "buy-channel" && <BuyChannelSection />}
      {activeSection === "other" && <OtherSection />}
    </main>
  );
}

export default function ExchangePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center px-4" style={{ color: "var(--color-text-muted)" }}>Загрузка...</div>}>
      <ExchangePageContent />
    </Suspense>
  );
}

/* ——— Поля формы заявки в зависимости от раздела ——— */
function SubmitFormBySection({
  section,
  formData,
  setFormField,
  inputStyleModal,
}: {
  section: SubmitFormSection;
  formData: Record<string, string>;
  setFormField: (key: string, value: string) => void;
  inputStyleModal: React.CSSProperties;
}) {
  const label = (text: string, optional?: boolean) => (
    <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
      {text}{optional ? " (необязательно)" : ""}
    </label>
  );
  const input = (key: string, placeholder?: string, type: string = "text") => (
    <input
      type={type}
      placeholder={placeholder}
      value={formData[key] ?? ""}
      onChange={(e) => setFormField(key, e.target.value)}
      className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
      style={inputStyleModal}
    />
  );
  const textarea = (key: string, placeholder?: string) => (
    <textarea
      placeholder={placeholder}
      value={formData[key] ?? ""}
      onChange={(e) => setFormField(key, e.target.value)}
      rows={2}
      className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none resize-none box-border"
      style={inputStyleModal}
    />
  );
  const select = (key: string, options: { value: string; label: string }[]) => (
    <select
      value={formData[key] ?? ""}
      onChange={(e) => setFormField(key, e.target.value)}
      className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
      style={inputStyleModal}
    >
      <option value="">Выберите...</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  if (section === "buy-ads") {
    return (
      <div className="space-y-3">
        <div>
          {label("Юзернейм пользователя")}
          {input("username", "@username")}
        </div>
        <div>
          {label("Сумма (₽)", true)}
          {input("priceRange", "например: 1000-2000 или ~1500")}
        </div>
        <div>
          {label("Необходимое количество просмотров", true)}
          {input("viewsRange", "например: 5000-10000 или ~8000")}
        </div>
        <div>
          {label("Тематика канала", true)}
          {input("theme", "например: крипто, маркетинг")}
        </div>
        <div>
          {label("Дополнительное описание", true)}
          {textarea("description", "Опишите, какую рекламу вы хотите разместить...")}
        </div>
      </div>
    );
  }

  if (section === "sell-ads") {
    return (
      <div className="space-y-3">
        <div>
          {label("Тип объявления")}
          {select("adType", Object.entries(AD_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })))}
        </div>
        <div>
          {label("Ссылка на канал/чат")}
          {input("channelOrChatLink", "https://t.me/...")}
        </div>
        <div>
          {label("Юзернейм")}
          {input("username", "@username")}
        </div>
        <div>
          {label("Цена, ₽", true)}
          {input("price", "0", "number")}
        </div>
        <div>
          {label("С закрепом", true)}
          {select("pinned", [{ value: "", label: "—" }, { value: "yes", label: "Да" }, { value: "no", label: "Нет" }])}
        </div>
        <div>
          {label("Под гарантом", true)}
          {select("underGuarantee", [{ value: "", label: "—" }, { value: "yes", label: "Да" }, { value: "no", label: "Нет" }])}
        </div>
        <div>
          {label("Время публикации", true)}
          {input("publishTime", "например: вечер")}
        </div>
        <div>
          {label("Длительность поста", true)}
          {input("postDuration", "например: 24 часа")}
        </div>
        <div>
          {label("Способ оплаты", true)}
          {select("paymentMethod", Object.entries(PAYMENT_LABELS).map(([v, l]) => ({ value: v, label: l })))}
        </div>
        <div>
          {label("Тематика канала", true)}
          {input("theme", "например: крипто, маркетинг")}
        </div>
        <div>
          {label("Дополнительное описание", true)}
          {textarea("description", "Текст объявления...")}
        </div>
      </div>
    );
  }

  if (section === "jobs") {
    return (
      <div className="space-y-3">
        <div>
          {label("Ищу работу / Предлагаю работу")}
          {select("offerType", Object.entries(JOB_OFFER_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })))}
        </div>
        <div>
          {label("Работа")}
          {select("work", (Object.entries(WORK_LABELS) as [WorkType, string][]).map(([v, l]) => ({ value: v, label: l })))}
        </div>
        <div>
          {label("Ссылка на профиль")}
          {input("usernameLink", "https://t.me/...")}
        </div>
        <div>
          {label("Портфолио", true)}
          {input("portfolioUrl", "https://...")}
        </div>
        <div>
          {label("Тип занятости")}
          {select("employmentType", Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => ({ value: v, label: l })))}
        </div>
        <div>
          {label("Валюта оплаты")}
          {select("paymentCurrency", Object.entries(PAYMENT_CURRENCY_LABELS).map(([v, l]) => ({ value: v, label: l })))}
        </div>
        <div>
          {label("Сумма оплаты", true)}
          {input("paymentAmount", "например: 500")}
        </div>
        <div>
          {label("Тематика", true)}
          {input("theme", "например: контент, дизайн")}
        </div>
        <div>
          {label("Дополнительное описание", true)}
          {textarea("description", "Опишите вакансию...")}
        </div>
      </div>
    );
  }

  if (section === "designers") {
    return (
      <div className="space-y-3">
        <div>
          {label("Название услуги")}
          {input("title", "Например: монтаж видео")}
        </div>
        <div>
          {label("Юзернейм")}
          {input("username", "@username")}
        </div>
        <div>
          {label("Цена, ₽", true)}
          {input("price", "0", "number")}
        </div>
        <div>
          {label("Тематика", true)}
          {input("theme", "например: видео, дизайн")}
        </div>
        <div>
          {label("Дополнительное описание", true)}
          {textarea("description", "Описание услуги...")}
        </div>
      </div>
    );
  }

  if (section === "sell-channel") {
    return (
      <div className="space-y-3">
        <div>
          {label("Название канала")}
          {input("name", "Название канала")}
        </div>
        <div>
          {label("Юзернейм")}
          {input("username", "@username")}
        </div>
        <div>
          {label("Ссылка на профиль")}
          {input("usernameLink", "https://t.me/...")}
        </div>
        <div>
          {label("Количество подписчиков", true)}
          {input("subscribers", "0", "number")}
        </div>
        <div>
          {label("Примерный охват", true)}
          {input("reach", "0", "number")}
        </div>
        <div>
          {label("Цена, ₽", true)}
          {input("price", "0", "number")}
        </div>
        <div>
          {label("Через гаранта", true)}
          {select("viaGuarantor", [{ value: "", label: "—" }, { value: "yes", label: "Да" }, { value: "no", label: "Нет" }])}
        </div>
        <div>
          {label("Тематика канала", true)}
          {input("theme", "например: крипто, маркетинг")}
        </div>
        <div>
          {label("Дополнительное описание", true)}
          {textarea("description", "Описание канала...")}
        </div>
      </div>
    );
  }

  if (section === "buy-channel") {
    return (
      <div className="space-y-3">
        <div>
          {label("Юзернейм")}
          {input("username", "@username")}
        </div>
        <div>
          {label("Ссылка на профиль")}
          {input("usernameLink", "https://t.me/...")}
        </div>
        <div>
          {label("Цена от, ₽", true)}
          {input("priceMin", "0", "number")}
        </div>
        <div>
          {label("Цена до, ₽", true)}
          {input("priceMax", "0", "number")}
        </div>
        <div>
          {label("Охват от", true)}
          {input("reachMin", "0", "number")}
        </div>
        <div>
          {label("Охват до", true)}
          {input("reachMax", "0", "number")}
        </div>
        <div>
          {label("Подписчиков от", true)}
          {input("subscribersMin", "0", "number")}
        </div>
        <div>
          {label("Подписчиков до", true)}
          {input("subscribersMax", "0", "number")}
        </div>
        <div>
          {label("Согласен на гаранта", true)}
          {select("viaGuarantor", [{ value: "", label: "—" }, { value: "yes", label: "Да" }, { value: "no", label: "Нет" }])}
        </div>
        <div>
          {label("Тематика канала", true)}
          {input("theme", "например: крипто, маркетинг")}
        </div>
        <div>
          {label("Дополнительное описание", true)}
          {textarea("description", "Что ищете...")}
        </div>
      </div>
    );
  }

  if (section === "other") {
    return (
      <div className="space-y-3">
        <div>
          {label("Юзернейм пользователя")}
          {input("username", "@username")}
        </div>
        <div>
          {label("Ссылка на профиль")}
          {input("usernameLink", "https://t.me/...")}
        </div>
        <div>
          {label("Верифицирован", true)}
          {select("verified", [{ value: "", label: "—" }, { value: "yes", label: "Да" }, { value: "no", label: "Нет" }])}
        </div>
        <div>
          {label("Цена (₽)", true)}
          {input("price", "0", "number")}
        </div>
        <div>
          {label("Дополнительное описание", true)}
          {textarea("description", "Опишите товар или услугу...")}
        </div>
      </div>
    );
  }

  return null;
}

/* ——— Блок при раскрытии карточки: гарант, рейтинг, Написать ——— */
function CardExpandedBlock({ authorLink }: { authorLink: string }) {
  const rating: number | null = null;
  return (
    <div className="pt-3 mt-3 space-y-2" style={{ borderTop: "1px solid var(--color-border)" }}>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Проводите сделку через гаранта, чтобы обезопасить свои средства.
      </p>
      <p className="text-xs" style={{ color: "var(--color-text)" }}>
        Рейтинг: {rating != null ? rating : "—"}
      </p>
      <a
        href={authorLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-xl py-2.5 px-4 text-sm font-medium w-full"
        style={{ backgroundColor: "var(--color-accent)", color: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        Написать
      </a>
    </div>
  );
}

/* ——— Карточка объявления ——— */
function AdCard({ ad }: { ad: AdItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const authorLink = `https://t.me/${(ad.username || "").replace(/^@/, "")}`;
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      <div className="flex gap-3">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt=""
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center text-xs"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}
          >
            Нет фото
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>
            {AD_TYPE_LABELS[ad.adType]}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
              @{ad.username}
            </span>
            {ad.verified && (
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-(--color-accent)" />
            )}
          </div>
          <a
            href={ad.channelOrChatLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs inline-flex items-center gap-1 truncate max-w-full"
            style={{ color: "var(--color-accent)" }}
            onClick={(e) => e.stopPropagation()}
          >
            Ссылка на канал/чат
            <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Цена:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.price.toLocaleString("ru-RU")} ₽</span>
        <span style={{ color: "var(--color-text-muted)" }}>С закрепом:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.pinned ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Под гарант:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.underGuarantee ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Время:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.publishTime}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Стоит пост:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.postDuration}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Оплата:</span>
        <span style={{ color: "var(--color-text)" }}>{PAYMENT_LABELS[ad.paymentMethod]}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
        <span style={{ color: "var(--color-text)" }}>{ad.theme}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(ad.publishedAt)}</span>
      </div>
      {ad.description && (
        <p className="text-xs pt-1 border-t" style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}>
          {ad.description}
        </p>
      )}
      {isOpen && <CardExpandedBlock authorLink={authorLink} />}
    </article>
  );
}

/* ——— Продажа рекламы (фильтр + загрузка по API) ——— */
function SellAdsSection() {
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [reachFrom, setReachFrom] = useState("");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAds()
      .then((res) => {
        if (!cancelled) {
          setAds(res.ads ?? []);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("[ui] Failed to load ads", error);
        if (!cancelled) {
          setAds([]);
          setLoadError(toErrorMessage(error));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filteredAds = ads.filter((ad) => {
    const pFrom = priceFrom.trim() ? Number(priceFrom) : null;
    const pTo = priceTo.trim() ? Number(priceTo) : null;
    if (pFrom != null && !Number.isNaN(pFrom) && ad.price < pFrom) return false;
    if (pTo != null && !Number.isNaN(pTo) && ad.price > pTo) return false;
    const rFrom = reachFrom.trim() ? Number(reachFrom) : null;
    if (rFrom != null && !Number.isNaN(rFrom)) {
      // Для охвата можно использовать описание или другие поля, пока просто пропускаем
    }
    const themeMatch = !theme.trim() || ad.theme.toLowerCase().includes(theme.trim().toLowerCase());
    if (!themeMatch) return false;
    return true;
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Продажа рекламы
        </h2>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && (
      <div
        className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Фильтр по цене, охвату и тематике
        </p>
        <div className="grid gap-3 min-w-0">
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Цена, от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
              <input
                type="text"
                placeholder="До"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Охват, от
            </label>
            <input
              type="text"
              placeholder="Подписчиков"
              value={reachFrom}
              onChange={(e) => setReachFrom(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Тематика
            </label>
            <input
              type="text"
              placeholder="Например: крипто, маркетинг"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>
        </div>
      </div>
      )}

      <div className="space-y-3">
        {loadError && (
          <p className="text-xs py-2" style={{ color: "#ef4444" }}>
            Ошибка загрузки: {loadError}
          </p>
        )}
        {loading && (
          <div
            className="rounded-xl p-4 min-w-0"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
              Загрузка объявлений…
            </p>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div
                className="loader-progress h-full rounded-full"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
            </div>
          </div>
        )}
        {!loading && ads.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            Объявлений пока нет.
          </p>
        )}
        {!loading && ads.length > 0 && filteredAds.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            По фильтрам ничего не найдено.
          </p>
        )}
        {!loading && filteredAds.length > 0 && filteredAds.map((ad) => <AdCard key={ad.id} ad={ad} />)}
      </div>
    </section>
  );
}

/* ——— Карточка заявки на покупку рекламы ——— */
function BuyAdCard({ item }: { item: BuyAdItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const formatPriceRange = (min: number, max: number): string => {
    if (min === max) return `${min.toLocaleString("ru-RU")} ₽`;
    return `${min.toLocaleString("ru-RU")} — ${max.toLocaleString("ru-RU")} ₽`;
  };

  const formatViewsRange = (min: number, max: number): string => {
    if (min === max) return min.toLocaleString("ru-RU");
    return `${min.toLocaleString("ru-RU")} — ${max.toLocaleString("ru-RU")}`;
  };

  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      <div className="flex items-center justify-between gap-2">
        <a
          href={item.usernameLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium min-w-0"
          style={{ color: "var(--color-accent)" }}
          onClick={(e) => e.stopPropagation()}
        >
          @{item.username}
          <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3 shrink-0" />
        </a>
        {item.verified && (
          <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 shrink-0 text-(--color-accent)" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Сумма:</span>
        <span style={{ color: "var(--color-text)" }}>
          {formatPriceRange(item.priceMin, item.priceMax)}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Просмотров:</span>
        <span style={{ color: "var(--color-text)" }}>
          {formatViewsRange(item.viewsMin, item.viewsMax)}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
        <span style={{ color: "var(--color-text)" }}>{item.theme}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(item.publishedAt)}</span>
      </div>
      {item.description && (
        <p
          className="text-xs pt-2 border-t"
          style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
        >
          {item.description}
        </p>
      )}
      {isOpen && <CardExpandedBlock authorLink={item.usernameLink} />}
    </article>
  );
}

/* ——— Покупка рекламы (фильтры + загрузка по API) ——— */
function BuyAdsSection() {
  const [usernameSearch, setUsernameSearch] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [viewsFrom, setViewsFrom] = useState("");
  const [viewsTo, setViewsTo] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<BuyAdItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBuyAds()
      .then((res) => {
        if (!cancelled) {
          setItems(res.buyAds ?? []);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("[ui] Failed to load buyAds", error);
        if (!cancelled) {
          setItems([]);
          setLoadError(toErrorMessage(error));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filteredItems = items.filter((item) => {
    const usernameMatch = !usernameSearch.trim() || item.username.toLowerCase().includes(usernameSearch.trim().toLowerCase());
    if (!usernameMatch) return false;
    const pFrom = priceFrom.trim() ? Number(priceFrom) : null;
    const pTo = priceTo.trim() ? Number(priceTo) : null;
    if (pFrom != null && !Number.isNaN(pFrom) && item.priceMax < pFrom) return false;
    if (pTo != null && !Number.isNaN(pTo) && item.priceMin > pTo) return false;
    const vFrom = viewsFrom.trim() ? Number(viewsFrom) : null;
    const vTo = viewsTo.trim() ? Number(viewsTo) : null;
    if (vFrom != null && !Number.isNaN(vFrom) && item.viewsMax < vFrom) return false;
    if (vTo != null && !Number.isNaN(vTo) && item.viewsMin > vTo) return false;
    const themeMatch = !themeSearch.trim() || item.theme.toLowerCase().includes(themeSearch.trim().toLowerCase());
    if (!themeMatch) return false;
    const descMatch = !descriptionSearch.trim() || item.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase());
    if (!descMatch) return false;
    if (dateFrom.trim() && item.publishedAt < dateFrom) return false;
    if (dateTo.trim() && item.publishedAt > dateTo) return false;
    return true;
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Покупка рекламы
        </h2>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && (
      <div
        className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Фильтры по юзернейму, сумме, просмотрам, тематике, описанию и дате
        </p>
        <div className="grid gap-3 min-w-0">
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Юзернейм
            </label>
            <input
              type="text"
              placeholder="Поиск по юзернейму"
              value={usernameSearch}
              onChange={(e) => setUsernameSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Сумма (₽), от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="До"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Просмотров, от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={viewsFrom}
                onChange={(e) => setViewsFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="До"
                value={viewsTo}
                onChange={(e) => setViewsTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Тематика канала
            </label>
            <input
              type="text"
              placeholder="Например: крипто, маркетинг"
              value={themeSearch}
              onChange={(e) => setThemeSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Описание
            </label>
            <input
              type="text"
              placeholder="Поиск по описанию"
              value={descriptionSearch}
              onChange={(e) => setDescriptionSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата публикации, от
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата публикации, до
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
        </div>
      </div>
      )}

      <div className="space-y-3">
        {loadError && (
          <p className="text-xs py-2" style={{ color: "#ef4444" }}>
            Ошибка загрузки: {loadError}
          </p>
        )}
        {loading && (
          <div
            className="rounded-xl p-4 min-w-0"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
              Загрузка заявок…
            </p>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div
                className="loader-progress h-full rounded-full"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
            </div>
          </div>
        )}
        {!loading && items.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            Заявок на покупку рекламы пока нет.
          </p>
        )}
        {!loading && items.length > 0 && filteredItems.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            По фильтрам ничего не найдено.
          </p>
        )}
        {!loading && filteredItems.length > 0 && (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <BuyAdCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ——— Карточка вакансии ——— */
function JobCard({ job }: { job: JobItem }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      <p className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
        {JOB_OFFER_TYPE_LABELS[job.offerType]}
      </p>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
          {WORK_LABELS[job.work]}
        </p>
        <a
          href={job.usernameLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs inline-flex items-center gap-1 shrink-0"
          style={{ color: "var(--color-accent)" }}
          onClick={(e) => e.stopPropagation()}
        >
          Профиль
          <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Портфолио:</span>
        <span style={{ color: "var(--color-text)" }}>
          {job.portfolioUrl ? (
            <a
              href={job.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5"
              style={{ color: "var(--color-accent)" }}
              onClick={(e) => e.stopPropagation()}
            >
              Ссылка
              <FontAwesomeIcon icon={faExternalLink} className="w-2.5 h-2.5" />
            </a>
          ) : (
            "—"
          )}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Тип занятости:</span>
        <span style={{ color: "var(--color-text)" }}>{EMPLOYMENT_LABELS[job.employmentType]}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Оплата:</span>
        <span style={{ color: "var(--color-text)" }}>
          {job.paymentAmount} {PAYMENT_CURRENCY_LABELS[job.paymentCurrency]}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
        <span style={{ color: "var(--color-text)" }}>{job.theme}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(job.publishedAt)}</span>
      </div>
      {job.description && (
        <p
          className="text-xs pt-2 border-t"
          style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
        >
          {job.description}
        </p>
      )}
      {isOpen && <CardExpandedBlock authorLink={job.usernameLink} />}
    </article>
  );
}

const inputStyle = {
  backgroundColor: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--input-text)",
};

/* ——— Поиск/предложение вакансии (фильтры + загрузка по API) ——— */
function JobsSection() {
  const [offerType, setOfferType] = useState<JobOfferType | "">("");
  const [work, setWork] = useState<WorkType | "">("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [paymentCurrency, setPaymentCurrency] = useState<PaymentCurrency | "">("");
  const [hasPortfolio, setHasPortfolio] = useState<"" | "yes" | "no">("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchJobs()
      .then((res) => {
        if (!cancelled) {
          setJobs(res.jobs ?? []);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("[ui] Failed to load jobs", error);
        if (!cancelled) {
          setJobs([]);
          setLoadError(toErrorMessage(error));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filteredJobs = jobs.filter((job) => {
    if (offerType && job.offerType !== offerType) return false;
    if (work && job.work !== work) return false;
    if (employmentType && job.employmentType !== employmentType) return false;
    if (paymentCurrency && job.paymentCurrency !== paymentCurrency) return false;
    if (hasPortfolio === "yes" && !job.portfolioUrl) return false;
    if (hasPortfolio === "no" && job.portfolioUrl) return false;
    if (descriptionSearch.trim() && !job.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase())) return false;
    const themeMatch = !themeSearch.trim() || job.theme.toLowerCase().includes(themeSearch.trim().toLowerCase());
    if (!themeMatch) return false;
    return true;
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Поиск / предложение вакансии
        </h2>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && (
      <div
        className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Фильтр по типу, работе, занятости, оплате, тематике и портфолио.
        </p>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Ищу работу / Предлагаю работу
          </label>
          <select
            value={offerType}
            onChange={(e) => setOfferType((e.target.value || "") as JobOfferType | "")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyle}
          >
            <option value="">Любое</option>
            <option value="seeking">{JOB_OFFER_TYPE_LABELS.seeking}</option>
            <option value="offering">{JOB_OFFER_TYPE_LABELS.offering}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Работа
          </label>
          <select
            value={work}
            onChange={(e) => setWork((e.target.value || "") as WorkType | "")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyle}
          >
            <option value="">Любая</option>
            {(Object.keys(WORK_LABELS) as WorkType[]).map((w) => (
              <option key={w} value={w}>{WORK_LABELS[w]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Тип занятости
          </label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType((e.target.value || "") as EmploymentType | "")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyle}
          >
            <option value="">Любой</option>
            <option value="remote">{EMPLOYMENT_LABELS.remote}</option>
            <option value="offline">{EMPLOYMENT_LABELS.offline}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Оплата
          </label>
          <select
            value={paymentCurrency}
            onChange={(e) => setPaymentCurrency((e.target.value || "") as PaymentCurrency | "")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyle}
          >
            <option value="">Любая</option>
            <option value="usd">{PAYMENT_CURRENCY_LABELS.usd}</option>
            <option value="rub">{PAYMENT_CURRENCY_LABELS.rub}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Портфолио
          </label>
          <select
            value={hasPortfolio}
            onChange={(e) => setHasPortfolio((e.target.value || "") as "" | "yes" | "no")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={inputStyle}
          >
            <option value="">Любое</option>
            <option value="yes">Есть</option>
            <option value="no">Нет</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Тематика
          </label>
          <input
            type="text"
            placeholder="Например: контент, дизайн"
            value={themeSearch}
            onChange={(e) => setThemeSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Поиск по описанию
          </label>
          <input
            type="text"
            placeholder="Введите текст..."
            value={descriptionSearch}
            onChange={(e) => setDescriptionSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={inputStyle}
          />
        </div>
      </div>
      )}

      <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--color-text)" }}>
        Вакансии
      </h3>
      {loadError && (
        <p className="text-xs py-2" style={{ color: "#ef4444" }}>
          Ошибка загрузки: {loadError}
        </p>
      )}
      {loading && (
        <div
          className="rounded-xl p-4 min-w-0"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
            Загрузка вакансий…
          </p>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <div
              className="loader-progress h-full rounded-full"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
          </div>
        </div>
      )}
      {!loading && jobs.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Вакансий пока нет.
        </p>
      )}
      {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          По фильтрам ничего не найдено.
        </p>
      )}
      {!loading && filteredJobs.length > 0 && (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ——— Карточка услуги ——— */
function ServiceCard({ service }: { service: ServiceItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const authorLink = `https://t.me/${(service.username || "").replace(/^@/, "")}`;
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm flex-1 min-w-0" style={{ color: "var(--color-text)" }}>
          {service.title}
        </p>
        {service.verified && (
          <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 shrink-0 text-(--color-accent)" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm" style={{ color: "var(--color-accent)" }}>
          {service.price.toLocaleString("ru-RU")} ₽
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          @{service.username}
        </span>
      </div>
      <div className="text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Тематика: </span>
        <span style={{ color: "var(--color-text)" }}>{service.theme}</span>
      </div>
      {service.description && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {service.description}
        </p>
      )}
      <p className="text-xs pt-1 border-t" style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}>
        Опубликовано: {formatServiceDate(service.publishedAt)}
      </p>
      {isOpen && <CardExpandedBlock authorLink={authorLink} />}
    </article>
  );
}

/* ——— Услуги (дизайнеры / монтажеры): загрузка из JSON + фильтры ——— */
function DesignersSection() {
  const [titleSearch, setTitleSearch] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [verified, setVerified] = useState<"" | "yes" | "no">("");
  const [usernameSearch, setUsernameSearch] = useState("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchServices()
      .then((res) => {
        if (!cancelled) {
          setServices(res.services ?? []);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("[ui] Failed to load services", error);
        if (!cancelled) {
          setServices([]);
          setLoadError(toErrorMessage(error));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filteredServices = services.filter((s) => {
    if (titleSearch.trim() && !s.title.toLowerCase().includes(titleSearch.trim().toLowerCase())) return false;
    const from = priceFrom.trim() ? Number(priceFrom) : null;
    const to = priceTo.trim() ? Number(priceTo) : null;
    if (from != null && s.price < from) return false;
    if (to != null && s.price > to) return false;
    if (verified === "yes" && !s.verified) return false;
    if (verified === "no" && s.verified) return false;
    if (usernameSearch.trim() && !s.username.toLowerCase().includes(usernameSearch.trim().toLowerCase())) return false;
    if (descriptionSearch.trim() && !s.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase())) return false;
    const themeMatch = !themeSearch.trim() || s.theme.toLowerCase().includes(themeSearch.trim().toLowerCase());
    if (!themeMatch) return false;
    if (dateFrom.trim() && s.publishedAt < dateFrom) return false;
    if (dateTo.trim() && s.publishedAt > dateTo) return false;
    return true;
  });

  const serviceInputStyle = {
    backgroundColor: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--input-text)",
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Дизайнеры / монтажеры
        </h2>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && (
      <div
        className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Фильтр по названию, цене, верификации, юзернейму, тематике, описанию и дате.
        </p>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Название услуги
          </label>
          <input
            type="text"
            placeholder="Сделаю монтаж, зарегистрирую кошелек..."
            value={titleSearch}
            onChange={(e) => setTitleSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={serviceInputStyle}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Цена, от — до
          </label>
          <div className="flex gap-2 min-w-0">
            <input
              type="number"
              placeholder="От"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
              style={serviceInputStyle}
            />
            <input
              type="number"
              placeholder="До"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
              style={serviceInputStyle}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Верифицированный
          </label>
          <select
            value={verified}
            onChange={(e) => setVerified((e.target.value || "") as "" | "yes" | "no")}
            className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
            style={serviceInputStyle}
          >
            <option value="">Любой</option>
            <option value="yes">Да</option>
            <option value="no">Нет</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Юзернейм
          </label>
          <input
            type="text"
            placeholder="Поиск по юзернейму..."
            value={usernameSearch}
            onChange={(e) => setUsernameSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={serviceInputStyle}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Тематика
          </label>
          <input
            type="text"
            placeholder="Например: видео, дизайн"
            value={themeSearch}
            onChange={(e) => setThemeSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={serviceInputStyle}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Поиск по описанию
          </label>
          <input
            type="text"
            placeholder="Текст в описании..."
            value={descriptionSearch}
            onChange={(e) => setDescriptionSearch(e.target.value)}
            className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
            style={serviceInputStyle}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            Дата публикации, от — до
          </label>
          <div className="flex gap-2 min-w-0">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
              style={serviceInputStyle}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
              style={serviceInputStyle}
            />
          </div>
        </div>
      </div>
      )}

      <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--color-text)" }}>
        Услуги
      </h3>
      {loadError && (
        <p className="text-xs py-2" style={{ color: "#ef4444" }}>
          Ошибка загрузки: {loadError}
        </p>
      )}
      {loading && (
        <div
          className="rounded-xl p-4 min-w-0"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
            Загрузка услуг…
          </p>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <div
              className="loader-progress h-full rounded-full"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
          </div>
        </div>
      )}
      {!loading && services.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Услуг пока нет.
        </p>
      )}
      {!loading && services.length > 0 && filteredServices.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          По фильтрам ничего не найдено.
        </p>
      )}
      {!loading && filteredServices.length > 0 && (
        <div className="space-y-3">
          {filteredServices.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ——— Обмен валют (отдельный раздел) ——— */
function CurrencySection() {
  return (
    <section className="space-y-4">
      <div
        className="rounded-xl p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]"
      >
        <FontAwesomeIcon
          icon={faArrowRightArrowLeft}
          className="shrink-0"
          style={{ fontSize: 64, color: "var(--color-text-muted)" }}
        />
        <p className="text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
          Обмен валют еще в разработке
        </p>
      </div>
    </section>
  );
}

/* ——— Карточка канала на продажу ——— */
function SellChannelCard({ channel }: { channel: SellChannelItem }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      <div className="flex gap-3">
        {channel.imageUrl ? (
          <img
            src={channel.imageUrl}
            alt=""
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center text-xs"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}
          >
            Нет фото
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
            {channel.name}
          </p>
          <a
            href={channel.usernameLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs mt-0.5"
            style={{ color: "var(--color-accent)" }}
            onClick={(e) => e.stopPropagation()}
          >
            @{channel.username}
            {channel.verified && (
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-(--color-accent)" />
            )}
          </a>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Подписчиков:</span>
        <span style={{ color: "var(--color-text)" }}>{channel.subscribers.toLocaleString("ru-RU")}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Охват:</span>
        <span style={{ color: "var(--color-text)" }}>{channel.reach.toLocaleString("ru-RU")}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Цена:</span>
        <span style={{ color: "var(--color-text)" }}>{channel.price.toLocaleString("ru-RU")} ₽</span>
        <span style={{ color: "var(--color-text-muted)" }}>Через гаранта:</span>
        <span style={{ color: "var(--color-text)" }}>{channel.viaGuarantor ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
        <span style={{ color: "var(--color-text)" }}>{channel.theme}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(channel.publishedAt)}</span>
      </div>
      {channel.description && (
        <p
          className="text-xs pt-2 border-t"
          style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
        >
          {channel.description}
        </p>
      )}
      {isOpen && <CardExpandedBlock authorLink={channel.usernameLink} />}
    </article>
  );
}

/* ——— Продажа канала (каталог из JSON + фильтры) ——— */
function SellChannelSection() {
  const [nameSearch, setNameSearch] = useState("");
  const [subscribersFrom, setSubscribersFrom] = useState("");
  const [subscribersTo, setSubscribersTo] = useState("");
  const [reachFrom, setReachFrom] = useState("");
  const [reachTo, setReachTo] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [viaGuarantor, setViaGuarantor] = useState<"" | "yes" | "no">("");
  const [usernameSearch, setUsernameSearch] = useState("");
  const [verified, setVerified] = useState<"" | "yes" | "no">("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hasPhoto, setHasPhoto] = useState<"" | "yes" | "no">("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [channels, setChannels] = useState<SellChannelItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSellChannels()
      .then((res) => {
        if (!cancelled) {
          setChannels(res.sellChannels ?? []);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("[ui] Failed to load sellChannels", error);
        if (!cancelled) {
          setChannels([]);
          setLoadError(toErrorMessage(error));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filteredChannels = channels.filter((ch) => {
    const nameMatch = !nameSearch.trim() || ch.name.toLowerCase().includes(nameSearch.trim().toLowerCase());
    const subFrom = subscribersFrom.trim() ? Number(subscribersFrom) : null;
    const subTo = subscribersTo.trim() ? Number(subscribersTo) : null;
    if (subFrom != null && !Number.isNaN(subFrom) && ch.subscribers < subFrom) return false;
    if (subTo != null && !Number.isNaN(subTo) && ch.subscribers > subTo) return false;
    const rFrom = reachFrom.trim() ? Number(reachFrom) : null;
    const rTo = reachTo.trim() ? Number(reachTo) : null;
    if (rFrom != null && !Number.isNaN(rFrom) && ch.reach < rFrom) return false;
    if (rTo != null && !Number.isNaN(rTo) && ch.reach > rTo) return false;
    const pFrom = priceFrom.trim() ? Number(priceFrom) : null;
    const pTo = priceTo.trim() ? Number(priceTo) : null;
    if (pFrom != null && !Number.isNaN(pFrom) && ch.price < pFrom) return false;
    if (pTo != null && !Number.isNaN(pTo) && ch.price > pTo) return false;
    if (viaGuarantor === "yes" && !ch.viaGuarantor) return false;
    if (viaGuarantor === "no" && ch.viaGuarantor) return false;
    const usernameMatch = !usernameSearch.trim() || ch.username.toLowerCase().includes(usernameSearch.trim().toLowerCase());
    if (!usernameMatch) return false;
    if (verified === "yes" && !ch.verified) return false;
    if (verified === "no" && ch.verified) return false;
    const descMatch = !descriptionSearch.trim() || ch.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase());
    if (!descMatch) return false;
    const themeMatch = !themeSearch.trim() || ch.theme.toLowerCase().includes(themeSearch.trim().toLowerCase());
    if (!themeMatch) return false;
    if (dateFrom.trim() && ch.publishedAt < dateFrom) return false;
    if (dateTo.trim() && ch.publishedAt > dateTo) return false;
    if (hasPhoto === "yes" && !ch.imageUrl) return false;
    if (hasPhoto === "no" && ch.imageUrl) return false;
    return nameMatch;
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Продажа канала
        </h2>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && (
      <div
        className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Фильтры по названию, подписчикам, охвату, цене, гаранту, юзернейму, верификации, тематике, описанию, дате и наличию фото
        </p>
        <div className="grid gap-3 min-w-0 grid-cols-1 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Название
            </label>
            <input
              type="text"
              placeholder="Поиск по названию"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Подписчиков, от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={subscribersFrom}
                onChange={(e) => setSubscribersFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="До"
                value={subscribersTo}
                onChange={(e) => setSubscribersTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Охват, от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={reachFrom}
                onChange={(e) => setReachFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="До"
                value={reachTo}
                onChange={(e) => setReachTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Цена, от — до (₽)
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="До"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Через гаранта
            </label>
            <select
              value={viaGuarantor}
              onChange={(e) => setViaGuarantor((e.target.value || "") as "" | "yes" | "no")}
              className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
              style={inputStyle}
            >
              <option value="">Любой</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Юзернейм
            </label>
            <input
              type="text"
              placeholder="Поиск по юзернейму"
              value={usernameSearch}
              onChange={(e) => setUsernameSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Верифицирован
            </label>
            <select
              value={verified}
              onChange={(e) => setVerified((e.target.value || "") as "" | "yes" | "no")}
              className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
              style={inputStyle}
            >
              <option value="">Любой</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Фото канала
            </label>
            <select
              value={hasPhoto}
              onChange={(e) => setHasPhoto((e.target.value || "") as "" | "yes" | "no")}
              className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
              style={inputStyle}
            >
              <option value="">Любой</option>
              <option value="yes">Есть</option>
              <option value="no">Нет</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Тематика канала
            </label>
            <input
              type="text"
              placeholder="Например: крипто, маркетинг"
              value={themeSearch}
              onChange={(e) => setThemeSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Описание
            </label>
            <input
              type="text"
              placeholder="Поиск по описанию"
              value={descriptionSearch}
              onChange={(e) => setDescriptionSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата публикации, от
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата публикации, до
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
        </div>
      </div>
      )}

      {loadError && (
        <p className="text-xs py-2" style={{ color: "#ef4444" }}>
          Ошибка загрузки: {loadError}
        </p>
      )}
      {loading && (
        <div
          className="rounded-xl p-4 min-w-0"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
            Загрузка каналов…
          </p>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <div
              className="loader-progress h-full rounded-full"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
          </div>
        </div>
      )}
      {!loading && channels.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Каналов пока нет.
        </p>
      )}
      {!loading && channels.length > 0 && filteredChannels.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          По фильтрам ничего не найдено.
        </p>
      )}
      {!loading && filteredChannels.length > 0 && (
        <div className="space-y-3">
          {filteredChannels.map((ch) => (
            <SellChannelCard key={ch.id} channel={ch} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ——— Карточка заявки на покупку канала ——— */
function formatRange(min: number, max: number): string {
  if (min === max) return min.toLocaleString("ru-RU");
  return `${min.toLocaleString("ru-RU")} — ${max.toLocaleString("ru-RU")}`;
}

function BuyChannelCard({ item }: { item: BuyChannelItem }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      <div className="flex items-center justify-between gap-2">
        <a
          href={item.usernameLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium min-w-0"
          style={{ color: "var(--color-accent)" }}
          onClick={(e) => e.stopPropagation()}
        >
          @{item.username}
          <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3 shrink-0" />
        </a>
        {item.verified && (
          <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 shrink-0 text-(--color-accent)" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Цена (₽):</span>
        <span style={{ color: "var(--color-text)" }}>
          {formatRange(item.priceMin, item.priceMax)}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Охват:</span>
        <span style={{ color: "var(--color-text)" }}>
          {formatRange(item.reachMin, item.reachMax)}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Подписчиков:</span>
        <span style={{ color: "var(--color-text)" }}>
          {formatRange(item.subscribersMin, item.subscribersMax)}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>Согласен на гаранта:</span>
        <span style={{ color: "var(--color-text)" }}>{item.viaGuarantor ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Тематика:</span>
        <span style={{ color: "var(--color-text)" }}>{item.theme}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(item.publishedAt)}</span>
      </div>
      {item.description && (
        <p
          className="text-xs pt-2 border-t"
          style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
        >
          {item.description}
        </p>
      )}
      {isOpen && <CardExpandedBlock authorLink={item.usernameLink} />}
    </article>
  );
}

/* ——— Покупка канала (каталог из JSON + фильтры) ——— */
function BuyChannelSection() {
  const [usernameSearch, setUsernameSearch] = useState("");
  const [verified, setVerified] = useState<"" | "yes" | "no">("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [reachFrom, setReachFrom] = useState("");
  const [reachTo, setReachTo] = useState("");
  const [subscribersFrom, setSubscribersFrom] = useState("");
  const [subscribersTo, setSubscribersTo] = useState("");
  const [viaGuarantor, setViaGuarantor] = useState<"" | "yes" | "no">("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<BuyChannelItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBuyChannels()
      .then((res) => {
        if (!cancelled) {
          setItems(res.buyChannels ?? []);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("[ui] Failed to load buyChannels", error);
        if (!cancelled) {
          setItems([]);
          setLoadError(toErrorMessage(error));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filteredItems = items.filter((item) => {
    const usernameMatch = !usernameSearch.trim() || item.username.toLowerCase().includes(usernameSearch.trim().toLowerCase());
    if (!usernameMatch) return false;
    if (verified === "yes" && !item.verified) return false;
    if (verified === "no" && item.verified) return false;
    const pFrom = priceFrom.trim() ? Number(priceFrom) : null;
    const pTo = priceTo.trim() ? Number(priceTo) : null;
    if (pFrom != null && !Number.isNaN(pFrom) && item.priceMax < pFrom) return false;
    if (pTo != null && !Number.isNaN(pTo) && item.priceMin > pTo) return false;
    const rFrom = reachFrom.trim() ? Number(reachFrom) : null;
    const rTo = reachTo.trim() ? Number(reachTo) : null;
    if (rFrom != null && !Number.isNaN(rFrom) && item.reachMax < rFrom) return false;
    if (rTo != null && !Number.isNaN(rTo) && item.reachMin > rTo) return false;
    const sFrom = subscribersFrom.trim() ? Number(subscribersFrom) : null;
    const sTo = subscribersTo.trim() ? Number(subscribersTo) : null;
    if (sFrom != null && !Number.isNaN(sFrom) && item.subscribersMax < sFrom) return false;
    if (sTo != null && !Number.isNaN(sTo) && item.subscribersMin > sTo) return false;
    if (viaGuarantor === "yes" && !item.viaGuarantor) return false;
    if (viaGuarantor === "no" && item.viaGuarantor) return false;
    const descMatch = !descriptionSearch.trim() || item.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase());
    if (!descMatch) return false;
    const themeMatch = !themeSearch.trim() || item.theme.toLowerCase().includes(themeSearch.trim().toLowerCase());
    if (!themeMatch) return false;
    if (dateFrom.trim() && item.publishedAt < dateFrom) return false;
    if (dateTo.trim() && item.publishedAt > dateTo) return false;
    return true;
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Покупка канала
        </h2>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && (
      <div
        className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Фильтры по нику, верификации, цене, охвату, подписчикам, гаранту, тематике, описанию и дате
        </p>
        <div className="grid gap-3 min-w-0 grid-cols-1 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Ник пользователя
            </label>
            <input
              type="text"
              placeholder="Поиск по нику"
              value={usernameSearch}
              onChange={(e) => setUsernameSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Верифицирован
            </label>
            <select
              value={verified}
              onChange={(e) => setVerified((e.target.value || "") as "" | "yes" | "no")}
              className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
              style={inputStyle}
            >
              <option value="">Любой</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Цена (₽), от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="До"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Охват, от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={reachFrom}
                onChange={(e) => setReachFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="До"
                value={reachTo}
                onChange={(e) => setReachTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Подписчиков, от — до
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="От"
                value={subscribersFrom}
                onChange={(e) => setSubscribersFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="До"
                value={subscribersTo}
                onChange={(e) => setSubscribersTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Согласен на гаранта
            </label>
            <select
              value={viaGuarantor}
              onChange={(e) => setViaGuarantor((e.target.value || "") as "" | "yes" | "no")}
              className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
              style={inputStyle}
            >
              <option value="">Любой</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Тематика канала
            </label>
            <input
              type="text"
              placeholder="Например: крипто, маркетинг"
              value={themeSearch}
              onChange={(e) => setThemeSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Описание
            </label>
            <input
              type="text"
              placeholder="Поиск по описанию"
              value={descriptionSearch}
              onChange={(e) => setDescriptionSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата, от
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата, до
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
        </div>
      </div>
      )}

      {loadError && (
        <p className="text-xs py-2" style={{ color: "#ef4444" }}>
          Ошибка загрузки: {loadError}
        </p>
      )}
      {loading && (
        <div
          className="rounded-xl p-4 min-w-0"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
            Загрузка заявок…
          </p>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <div
              className="loader-progress h-full rounded-full"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
          </div>
        </div>
      )}
      {!loading && items.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Заявок на покупку пока нет.
        </p>
      )}
      {!loading && items.length > 0 && filteredItems.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          По фильтрам ничего не найдено.
        </p>
      )}
      {!loading && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <BuyChannelCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ——— Карточка товара/услуги из раздела Другое ——— */
function OtherCard({ item }: { item: OtherItem }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      <div className="flex items-center justify-between gap-2">
        <a
          href={item.usernameLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium min-w-0"
          style={{ color: "var(--color-accent)" }}
          onClick={(e) => e.stopPropagation()}
        >
          @{item.username}
          <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3 shrink-0" />
        </a>
        {item.verified && (
          <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-accent)" }} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Верифицирован:</span>
        <span style={{ color: "var(--color-text)" }}>{item.verified ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Цена (₽):</span>
        <span style={{ color: "var(--color-text)" }}>{item.price.toLocaleString("ru-RU")}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Опубликовано:</span>
        <span style={{ color: "var(--color-text)" }}>{formatServiceDate(item.publishedAt)}</span>
      </div>
      {item.description && (
        <p
          className="text-xs pt-2 border-t"
          style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
        >
          {item.description}
        </p>
      )}
      {isOpen && <CardExpandedBlock authorLink={item.usernameLink} />}
    </article>
  );
}

/* ——— Другое (каталог из JSON + фильтры) ——— */
function OtherSection() {
  const [usernameSearch, setUsernameSearch] = useState("");
  const [verified, setVerified] = useState<"" | "yes" | "no">("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<OtherItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOther()
      .then((res) => {
        if (!cancelled) {
          setItems(res.other ?? []);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("[ui] Failed to load other", error);
        if (!cancelled) {
          setItems([]);
          setLoadError(toErrorMessage(error));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filteredItems = items.filter((item) => {
    const usernameMatch = !usernameSearch.trim() || item.username.toLowerCase().includes(usernameSearch.trim().toLowerCase());
    if (!usernameMatch) return false;
    if (verified === "yes" && !item.verified) return false;
    if (verified === "no" && item.verified) return false;
    const pFrom = priceFrom.trim() ? Number(priceFrom) : null;
    const pTo = priceTo.trim() ? Number(priceTo) : null;
    if (pFrom != null && !Number.isNaN(pFrom) && item.price < pFrom) return false;
    if (pTo != null && !Number.isNaN(pTo) && item.price > pTo) return false;
    const descMatch = !descriptionSearch.trim() || item.description.toLowerCase().includes(descriptionSearch.trim().toLowerCase());
    if (!descMatch) return false;
    if (dateFrom.trim() && item.publishedAt < dateFrom) return false;
    if (dateTo.trim() && item.publishedAt > dateTo) return false;
    return true;
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Другое
        </h2>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        >
          <FontAwesomeIcon icon={showFilters ? faFilterCircleXmark : faFilter} className="w-4 h-4" />
        </button>
      </div>
      {showFilters && (
      <div
        className="rounded-xl p-4 space-y-4 min-w-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Фильтр по юзернейму, верификации, цене, описанию и дате публикации.
        </p>
        <div className="grid gap-3 min-w-0 grid-cols-1 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Юзернейм пользователя
            </label>
            <input
              type="text"
              placeholder="Поиск по юзернейму"
              value={usernameSearch}
              onChange={(e) => setUsernameSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Верифицирован
            </label>
            <select
              value={verified}
              onChange={(e) => setVerified((e.target.value || "") as "" | "yes" | "no")}
              className="select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0"
              style={inputStyle}
            >
              <option value="">Любой</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Цена, от — до (₽)
            </label>
            <div className="flex gap-2 min-w-0">
              <input
                type="number"
                placeholder="От"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="До"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Описание
            </label>
            <input
              type="text"
              placeholder="Поиск по описанию"
              value={descriptionSearch}
              onChange={(e) => setDescriptionSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата публикации, от
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              Дата публикации, до
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border"
              style={inputStyle}
            />
          </div>
        </div>
      </div>
      )}

      {loadError && (
        <p className="text-xs py-2" style={{ color: "#ef4444" }}>
          Ошибка загрузки: {loadError}
        </p>
      )}
      {loading && (
        <div
          className="rounded-xl p-4 min-w-0"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
            Загрузка товаров и услуг…
          </p>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <div
              className="loader-progress h-full rounded-full"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
          </div>
        </div>
      )}
      {!loading && items.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Товаров и услуг пока нет.
        </p>
      )}
      {!loading && items.length > 0 && filteredItems.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          По фильтрам ничего не найдено.
        </p>
      )}
      {!loading && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <OtherCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
