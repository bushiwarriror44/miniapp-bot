"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
import { getTelegramWebApp } from "@/shared/api/client";
import { submitModerationRequest } from "@/shared/api/moderation";
import { fetchExchangeOptions, type ExchangeOptionsPayload } from "@/shared/api/exchangeOptions";
import { fetchHotOffers } from "@/shared/api/hot-offers";
import {
  EXCHANGE_SECTIONS_WITH_ITEMS,
  SECTIONS,
  SECTIONS_FOR_SUBMIT,
  inputStyleModal,
  type ExchangeSection,
  type SubmitFormSection,
} from "./constants";
import { getRequiredFields, getDefaultFormDataForSection } from "./formHelpers";
import { SubmitFormBySection } from "./SubmitFormBySection";
import {
  SellAdsSection,
  BuyAdsSection,
  JobsSection,
  DesignersSection,
  CurrencySection,
  SellChannelSection,
  BuyChannelSection,
  OtherSection,
} from "./sections";

function ExchangePageContent() {
  const router = useRouter();
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
  const [hotItemIdsBySection, setHotItemIdsBySection] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    fetchExchangeOptions().then(setExchangeOptions).catch(() => setExchangeOptions(null));
  }, []);

  useEffect(() => {
    const sectionParam = searchParams.get("section");
    const openItemParam = searchParams.get("openItem");
    if (openItemParam && sectionParam && EXCHANGE_SECTIONS_WITH_ITEMS.includes(sectionParam as ExchangeSection)) {
      router.replace(`/exchange/view?section=${encodeURIComponent(sectionParam)}&id=${encodeURIComponent(openItemParam)}`);
      return;
    }
    if (sectionParam && EXCHANGE_SECTIONS_WITH_ITEMS.includes(sectionParam as ExchangeSection)) {
      setActiveSection(sectionParam as ExchangeSection);
    }
    if (searchParams.get("openSubmit") === "1") {
      setShowSubmitModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("openSubmit");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams, router]);

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

      {activeSection === "buy-ads" && (
        <BuyAdsSection hotItemIds={hotItemIdsBySection["buy-ads"]} />
      )}
      {activeSection === "sell-ads" && (
        <SellAdsSection hotItemIds={hotItemIdsBySection["sell-ads"]} />
      )}
      {activeSection === "jobs" && (
        <JobsSection exchangeOptions={exchangeOptions} hotItemIds={hotItemIdsBySection["jobs"]} />
      )}
      {activeSection === "designers" && (
        <DesignersSection hotItemIds={hotItemIdsBySection["designers"]} />
      )}
      {activeSection === "currency" && (
        <CurrencySection hotItemIds={hotItemIdsBySection["currency"]} />
      )}
      {activeSection === "sell-channel" && (
        <SellChannelSection hotItemIds={hotItemIdsBySection["sell-channel"]} />
      )}
      {activeSection === "buy-channel" && (
        <BuyChannelSection hotItemIds={hotItemIdsBySection["buy-channel"]} />
      )}
      {activeSection === "other" && (
        <OtherSection hotItemIds={hotItemIdsBySection["other"]} />
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

