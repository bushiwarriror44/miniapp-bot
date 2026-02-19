"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink } from "@fortawesome/free-solid-svg-icons";
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
import { fetchCurrency, type CurrencyItem } from "@/shared/api/currency";
import { getTelegramWebApp } from "@/shared/api/client";
import { submitModerationRequest } from "@/shared/api/moderation";
import { fetchExchangeOptions, getJobTypeLabel, getCurrencyLabel, type ExchangeOptionsPayload } from "@/shared/api/exchangeOptions";
import { fetchHotOffers } from "@/shared/api/hot-offers";
import { safeLocaleNumber } from "@/shared/format";
import VerifiedBadge from "@/app/components/VerifiedBadge";
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
  faShieldHalved,
  faFire,
} from "@fortawesome/free-solid-svg-icons";

const EXCHANGE_SECTIONS_WITH_ITEMS: ExchangeSection[] = [
  "buy-ads",
  "sell-ads",
  "jobs",
  "designers",
  "currency",
  "sell-channel",
  "buy-channel",
  "other",
];

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

const inputStyleError = {
  ...inputStyleModal,
  border: "2px solid #dc2626",
  boxShadow: "0 0 0 1px #dc2626",
};

function getRequiredFields(section: SubmitFormSection): string[] {
  switch (section) {
    case "buy-ads":
      return ["username", "priceRange"];
    case "sell-ads":
      return ["channelOrChatLink"];
    case "jobs":
      return ["offerType", "work", "usernameLink", "employmentType", "paymentCurrency"];
    case "designers":
      return ["title", "username"];
    case "sell-channel":
      return ["name", "username"];
    case "buy-channel":
      return ["username", "theme"];
    case "other":
      return ["username"];
    default:
      return [];
  }
}

function getDefaultFormDataForSection(section: SubmitFormSection): Record<string, string> {
  const tg = getTelegramWebApp();
  const username = tg?.initDataUnsafe?.user?.username ?? "";
  const uname = typeof username === "string" ? username.replace(/^@/, "").trim() : "";
  const link = uname ? `https://t.me/${uname}` : "";
  const base: Record<string, string> = {};
  if (uname) base.username = uname;
  if (section === "jobs" && link) base.usernameLink = link;
  return base;
}

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
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [exchangeOptions, setExchangeOptions] = useState<ExchangeOptionsPayload | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [hotItemIdsBySection, setHotItemIdsBySection] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    fetchExchangeOptions().then(setExchangeOptions).catch(() => setExchangeOptions(null));
  }, []);

  useEffect(() => {
    fetchHotOffers()
      .then((res) => {
        const offers = res.offers ?? [];
        const bySection: Record<string, Set<string>> = {};
        EXCHANGE_SECTIONS_WITH_ITEMS.forEach((s) => {
          bySection[s] = new Set<string>();
        });
        offers.forEach((o) => {
          if (o.type === "ad" && o.category && o.itemId) {
            if (!bySection[o.category]) bySection[o.category] = new Set<string>();
            bySection[o.category].add(String(o.itemId));
          }
        });
        setHotItemIdsBySection(bySection);
      })
      .catch(() => setHotItemIdsBySection({}));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sectionParam = searchParams.get("section");
    const openItemParam = searchParams.get("openItem");
    if (sectionParam && EXCHANGE_SECTIONS_WITH_ITEMS.includes(sectionParam as ExchangeSection)) {
      setActiveSection(sectionParam as ExchangeSection);
    }
    if (openItemParam) {
      setOpenItemId(openItemParam);
    }
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
    setInvalidFields([]);
    setFormData(getDefaultFormDataForSection("buy-ads"));
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
    const required = getRequiredFields(submitSection);
    const missing = required.filter((key) => !String(formData[key] ?? "").trim());
    if (missing.length > 0) {
      setInvalidFields(missing);
      setSubmitError("Заполните обязательные поля.");
      return;
    }
    setInvalidFields([]);
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
                  const next = (e.target.value || "buy-ads") as SubmitFormSection;
                  setSubmitSection(next);
                  setInvalidFields([]);
                  setFormData(getDefaultFormDataForSection(next));
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
              inputStyleError={inputStyleError}
              invalidFields={invalidFields}
              exchangeOptions={exchangeOptions}
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
      {activeSection === "buy-ads" && (
        <BuyAdsSection openItemId={openItemId} hotItemIds={hotItemIdsBySection["buy-ads"]} />
      )}
      {activeSection === "sell-ads" && (
        <SellAdsSection openItemId={openItemId} hotItemIds={hotItemIdsBySection["sell-ads"]} />
      )}
      {activeSection === "jobs" && (
        <JobsSection exchangeOptions={exchangeOptions} openItemId={openItemId} hotItemIds={hotItemIdsBySection["jobs"]} />
      )}
      {activeSection === "designers" && (
        <DesignersSection openItemId={openItemId} hotItemIds={hotItemIdsBySection["designers"]} />
      )}
      {activeSection === "currency" && (
        <CurrencySection openItemId={openItemId} hotItemIds={hotItemIdsBySection["currency"]} />
      )}
      {activeSection === "sell-channel" && (
        <SellChannelSection openItemId={openItemId} hotItemIds={hotItemIdsBySection["sell-channel"]} />
      )}
      {activeSection === "buy-channel" && (
        <BuyChannelSection openItemId={openItemId} hotItemIds={hotItemIdsBySection["buy-channel"]} />
      )}
      {activeSection === "other" && (
        <OtherSection openItemId={openItemId} hotItemIds={hotItemIdsBySection["other"]} />
      )}
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
  inputStyleError,
  invalidFields,
  exchangeOptions,
}: {
  section: SubmitFormSection;
  formData: Record<string, string>;
  setFormField: (key: string, value: string) => void;
  inputStyleModal: React.CSSProperties;
  inputStyleError: React.CSSProperties;
  invalidFields: string[];
  exchangeOptions: ExchangeOptionsPayload | null;
}) {
  const isInvalid = (key: string) => invalidFields.includes(key);
  const styleFor = (key: string) => (isInvalid(key) ? inputStyleError : inputStyleModal);
  const errorClass = (key: string) => (isInvalid(key) ? " input-error" : "");
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
      className={`w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none box-border${errorClass(key)}`}
      style={styleFor(key)}
    />
  );
  const textarea = (key: string, placeholder?: string) => (
    <textarea
      placeholder={placeholder}
      value={formData[key] ?? ""}
      onChange={(e) => setFormField(key, e.target.value)}
      rows={2}
      className={`w-full min-w-0 rounded-lg px-3 py-2 text-sm outline-none resize-none box-border${errorClass(key)}`}
      style={styleFor(key)}
    />
  );
  const select = (key: string, options: { value: string; label: string }[]) => (
    <select
      value={formData[key] ?? ""}
      onChange={(e) => setFormField(key, e.target.value)}
      className={`select-next w-full rounded-lg px-3 py-2.5 text-sm outline-none min-w-0${errorClass(key)}`}
      style={styleFor(key)}
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
          {label("Сумма (₽)")}
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
    const defaultJobTypes: { value: string; label: string }[] = [
      ...(Object.entries(WORK_LABELS) as [WorkType, string][]).map(([v, l]) => ({ value: v, label: l })),
      { value: "other", label: "Другое" },
    ];
    const defaultCurrencies: { value: string; label: string }[] = (Object.entries(PAYMENT_CURRENCY_LABELS) as [PaymentCurrency, string][]).map(([v, l]) => ({ value: v, label: l }));
    const jobTypeOptions =
      exchangeOptions && Array.isArray(exchangeOptions.jobTypes) && exchangeOptions.jobTypes.length > 0
        ? exchangeOptions.jobTypes
        : defaultJobTypes;
    const currencyOptions =
      exchangeOptions && Array.isArray(exchangeOptions.currencies) && exchangeOptions.currencies.length > 0
        ? exchangeOptions.currencies
        : defaultCurrencies;
    return (
      <div className="space-y-3">
        <div>
          {label("Ищу работу / Предлагаю работу")}
          {select("offerType", Object.entries(JOB_OFFER_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })))}
        </div>
        <div>
          {label("Работа")}
          {select("work", jobTypeOptions)}
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
          {select("paymentCurrency", currencyOptions)}
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
          {label("Ссылка на канал")}
          {input("name", "https://t.me/...")}
        </div>
        <div>
          {label("Юзернейм")}
          {input("username", "@username")}
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
          {label("Тематика канала")}
          {input("theme", "например: крипто, маркетинг")}
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
      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2.5"
        style={{
          backgroundColor: "var(--color-accent)",
          color: "white",
        }}
      >
        <span className="flex shrink-0 w-8 h-8 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
          <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
        </span>
        <p className="text-xs leading-snug m-0" style={{ color: "white" }}>
          Проводите сделку через гаранта, чтобы обезопасить свои средства.
        </p>
      </div>
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
function AdCard({ ad, isHot, defaultOpen }: { ad: AdItem; isHot?: boolean; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  const authorLink = `https://t.me/${(ad.username || "").replace(/^@/, "")}`;
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
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
            {ad.verified && <VerifiedBadge />}
          </div>
          <Link
            href={`/profile/user/${encodeURIComponent(ad.username)}`}
            className="text-xs inline-flex items-center gap-1 truncate max-w-full"
            style={{ color: "var(--color-accent)" }}
            onClick={(e) => e.stopPropagation()}
          >
            Открыть профиль
            <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3 shrink-0" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Цена:</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(ad.price)} ₽</span>
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
function SellAdsSection({
  openItemId,
  hotItemIds,
}: {
  openItemId?: string | null;
  hotItemIds?: Set<string>;
}) {
  const openItemRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (openItemId && openItemRef.current) {
      openItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openItemId]);

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
        {!loading && filteredAds.length > 0 &&
          filteredAds.map((ad) => (
            <div key={ad.id} ref={ad.id === openItemId ? openItemRef : undefined}>
              <AdCard
                ad={ad}
                isHot={hotItemIds?.has(String(ad.id))}
                defaultOpen={ad.id === openItemId}
              />
            </div>
          ))}
      </div>
    </section>
  );
}

/* ——— Карточка заявки на покупку рекламы ——— */
function BuyAdCard({
  item,
  isHot,
  defaultOpen,
}: { item: BuyAdItem; isHot?: boolean; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  const formatPriceRange = (min: number | undefined | null, max: number | undefined | null): string => {
    const m = min != null && typeof min === "number" && !Number.isNaN(min) ? min : null;
    const n = max != null && typeof max === "number" && !Number.isNaN(max) ? max : null;
    if (m == null && n == null) return "—";
    if (m != null && n != null && m === n) return `${m.toLocaleString("ru-RU")} ₽`;
    if (m != null && n != null) return `${m.toLocaleString("ru-RU")} — ${n.toLocaleString("ru-RU")} ₽`;
    return m != null ? `${m.toLocaleString("ru-RU")} ₽` : n != null ? `${n.toLocaleString("ru-RU")} ₽` : "—";
  };

  const formatViewsRange = (min: number | undefined | null, max: number | undefined | null): string => {
    const m = min != null && typeof min === "number" && !Number.isNaN(min) ? min : null;
    const n = max != null && typeof max === "number" && !Number.isNaN(max) ? max : null;
    if (m == null && n == null) return "—";
    if (m != null && n != null && m === n) return m.toLocaleString("ru-RU");
    if (m != null && n != null) return `${m.toLocaleString("ru-RU")} — ${n.toLocaleString("ru-RU")}`;
    return m != null ? m.toLocaleString("ru-RU") : n != null ? n.toLocaleString("ru-RU") : "—";
  };

  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
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
        {item.verified && <VerifiedBadge />}
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
function BuyAdsSection({
  openItemId,
  hotItemIds,
}: {
  openItemId?: string | null;
  hotItemIds?: Set<string>;
}) {
  const openItemRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (openItemId && openItemRef.current) {
      openItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openItemId]);

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
              <div key={item.id} ref={item.id === openItemId ? openItemRef : undefined}>
                <BuyAdCard
                  item={item}
                  isHot={hotItemIds?.has(String(item.id))}
                  defaultOpen={item.id === openItemId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ——— Карточка вакансии ——— */
function JobCard({
  job,
  exchangeOptions,
  isHot,
  defaultOpen,
}: {
  job: JobItem;
  exchangeOptions: ExchangeOptionsPayload | null;
  isHot?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
      <p className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
        {JOB_OFFER_TYPE_LABELS[job.offerType]}
      </p>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
          {getJobTypeLabel(job.work, exchangeOptions)}
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
          {job.paymentAmount} {getCurrencyLabel(job.paymentCurrency, exchangeOptions)}
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
function JobsSection({
  exchangeOptions,
  openItemId,
  hotItemIds,
}: {
  exchangeOptions: ExchangeOptionsPayload | null;
  openItemId?: string | null;
  hotItemIds?: Set<string>;
}) {
  const openItemRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (openItemId && openItemRef.current) {
      openItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openItemId]);

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
            <div key={job.id} ref={job.id === openItemId ? openItemRef : undefined}>
              <JobCard
                job={job}
                exchangeOptions={exchangeOptions}
                isHot={hotItemIds?.has(String(job.id))}
                defaultOpen={job.id === openItemId}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ——— Карточка услуги ——— */
function ServiceCard({
  service,
  isHot,
  defaultOpen,
}: { service: ServiceItem; isHot?: boolean; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  const authorLink = `https://t.me/${(service.username || "").replace(/^@/, "")}`;
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm flex-1 min-w-0" style={{ color: "var(--color-text)" }}>
          {service.title}
        </p>
        {service.verified && <VerifiedBadge />}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm" style={{ color: "var(--color-accent)" }}>
          {safeLocaleNumber(service.price)} ₽
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
function DesignersSection({
  openItemId,
  hotItemIds,
}: {
  openItemId?: string | null;
  hotItemIds?: Set<string>;
}) {
  const openItemRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (openItemId && openItemRef.current) {
      openItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openItemId]);

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
            <div key={s.id} ref={s.id === openItemId ? openItemRef : undefined}>
              <ServiceCard
                service={s}
                isHot={hotItemIds?.has(String(s.id))}
                defaultOpen={s.id === openItemId}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ——— Обмен валют (отдельный раздел) ——— */
function CurrencyCard({
  item,
  isHot,
  defaultOpen,
}: {
  item: CurrencyItem;
  isHot?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

  const rawLinks = Array.isArray(item.additionalLinks) ? item.additionalLinks : [];
  const links = rawLinks
    .map((l, idx) => {
      if (typeof l === "string") return { url: l, label: `Ссылка ${idx + 1}` };
      if (l && typeof l === "object") {
        const url = "url" in l ? (l as { url?: unknown }).url : undefined;
        const label = "label" in l ? (l as { label?: unknown }).label : undefined;
        if (typeof url === "string" && url.trim()) {
          return { url: url.trim(), label: typeof label === "string" && label.trim() ? label.trim() : `Ссылка ${idx + 1}` };
        }
      }
      return null;
    })
    .filter(Boolean) as { url: string; label: string }[];

  const rateText =
    item.rate != null && String(item.rate).trim()
      ? String(item.rate).trim()
      : item.price != null && String(item.price).trim()
        ? String(item.price).trim()
        : "";

  const subtitleText =
    (item.subtitle && String(item.subtitle).trim()) ||
    (item.description && String(item.description).trim()) ||
    "";

  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate" style={{ color: "var(--color-text)" }}>
            {item.title || "Обмен валют"}
          </p>
          {rateText && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Курс: <span style={{ color: "var(--color-text)" }}>{rateText}</span>
            </p>
          )}
        </div>
      </div>

      {(item.usernameLink || item.username) && (
        <div className="flex items-center gap-2 flex-wrap">
          {item.usernameLink ? (
            <a
              href={item.usernameLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs"
              style={{ color: "var(--color-accent)" }}
              onClick={(e) => e.stopPropagation()}
            >
              @{(item.username || "").replace(/^@/, "") || "контакт"}
              {item.verified && <VerifiedBadge />}
            </a>
          ) : (
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              @{String(item.username || "").replace(/^@/, "")}
            </span>
          )}

          {item.reviewsUrl && (
            <a
              href={item.reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
              style={{
                color: "var(--color-accent)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg-elevated)",
                borderRadius: 9999,
                padding: "2px 8px",
                fontSize: 12,
                lineHeight: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Отзывы"
            >
              Отзывы
              <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {subtitleText && (
        <p className="text-xs pt-2 border-t" style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}>
          {subtitleText}
        </p>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map((l) => (
            <a
              key={`${l.url}-${l.label}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 12,
                lineHeight: "16px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      {isOpen && <CardExpandedBlock authorLink={item.usernameLink || ""} />}
    </article>
  );
}

function CurrencySection({
  openItemId,
  hotItemIds,
}: {
  openItemId?: string | null;
  hotItemIds?: Set<string>;
}) {
  const openItemRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<CurrencyItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCurrency()
      .then((res) => {
        if (!cancelled) {
          setItems(res.currency ?? []);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("[ui] Failed to load currency", error);
        if (!cancelled) {
          setItems([]);
          setLoadError(toErrorMessage(error));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (openItemId && openItemRef.current) {
      openItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openItemId]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
          Обмен валют
        </h2>
      </div>

      {loading && (
        <div
          className="rounded-xl p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          <FontAwesomeIcon icon={faArrowRightArrowLeft} className="shrink-0" style={{ fontSize: 48, color: "var(--color-text-muted)" }} />
          <p className="text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
            Загрузка…
          </p>
        </div>
      )}

      {!loading && loadError && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          Ошибка загрузки: {loadError}
        </div>
      )}

      {!loading && !loadError && items.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
          Пока нет доступных обменов.
        </p>
      )}

      {!loading && !loadError && items.length > 0 && (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} ref={String(it.id) === String(openItemId) ? openItemRef : undefined}>
              <CurrencyCard
                item={it}
                isHot={hotItemIds?.has(String(it.id))}
                defaultOpen={String(it.id) === String(openItemId)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ——— Карточка канала на продажу ——— */
function SellChannelCard({
  channel,
  isHot,
  defaultOpen,
}: { channel: SellChannelItem; isHot?: boolean; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
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
            {channel.verified && <VerifiedBadge />}
          </a>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Подписчиков:</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(channel.subscribers)}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Охват:</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(channel.reach)}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Цена:</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(channel.price)} ₽</span>
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
function SellChannelSection({
  openItemId,
  hotItemIds,
}: {
  openItemId?: string | null;
  hotItemIds?: Set<string>;
}) {
  const openItemRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (openItemId && openItemRef.current) {
      openItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openItemId]);

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
            <div key={ch.id} ref={ch.id === openItemId ? openItemRef : undefined}>
              <SellChannelCard
                channel={ch}
                isHot={hotItemIds?.has(String(ch.id))}
                defaultOpen={ch.id === openItemId}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ——— Карточка заявки на покупку канала ——— */
function formatRange(min: number | undefined | null, max: number | undefined | null): string {
  const m = min != null && typeof min === "number" && !Number.isNaN(min) ? min : null;
  const n = max != null && typeof max === "number" && !Number.isNaN(max) ? max : null;
  if (m == null && n == null) return "—";
  if (m != null && n != null && m === n) return m.toLocaleString("ru-RU");
  if (m != null && n != null) return `${m.toLocaleString("ru-RU")} — ${n.toLocaleString("ru-RU")}`;
  return m != null ? m.toLocaleString("ru-RU") : n != null ? n.toLocaleString("ru-RU") : "—";
}

function BuyChannelCard({
  item,
  isHot,
  defaultOpen,
}: { item: BuyChannelItem; isHot?: boolean; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
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
        {item.verified && <VerifiedBadge />}
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
function BuyChannelSection({
  openItemId,
  hotItemIds,
}: {
  openItemId?: string | null;
  hotItemIds?: Set<string>;
}) {
  const openItemRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (openItemId && openItemRef.current) {
      openItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openItemId]);

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
            <div key={item.id} ref={item.id === openItemId ? openItemRef : undefined}>
              <BuyChannelCard
                item={item}
                isHot={hotItemIds?.has(String(item.id))}
                defaultOpen={item.id === openItemId}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ——— Карточка товара/услуги из раздела Другое ——— */
function OtherCard({
  item,
  isHot,
  defaultOpen,
}: { item: OtherItem; isHot?: boolean; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  return (
    <article
      role="button"
      tabIndex={0}
      className="rounded-xl p-4 space-y-3 min-w-0 cursor-pointer relative"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
      onClick={() => setIsOpen((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setIsOpen((v) => !v))}
    >
      {isHot && (
        <span className="absolute top-3 right-3" style={{ color: "var(--color-accent)" }} aria-hidden>
          <FontAwesomeIcon icon={faFire} className="w-4 h-4" />
        </span>
      )}
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
        {item.verified && <VerifiedBadge />}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Верифицирован:</span>
        <span style={{ color: "var(--color-text)" }}>{item.verified ? "Да" : "Нет"}</span>
        <span style={{ color: "var(--color-text-muted)" }}>Цена (₽):</span>
        <span style={{ color: "var(--color-text)" }}>{safeLocaleNumber(item.price)}</span>
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
function OtherSection({
  openItemId,
  hotItemIds,
}: {
  openItemId?: string | null;
  hotItemIds?: Set<string>;
}) {
  const openItemRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (openItemId && openItemRef.current) {
      openItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openItemId]);

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
            <div key={item.id} ref={item.id === openItemId ? openItemRef : undefined}>
              <OtherCard
                item={item}
                isHot={hotItemIds?.has(String(item.id))}
                defaultOpen={item.id === openItemId}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
