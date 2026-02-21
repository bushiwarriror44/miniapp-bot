"use client";

import { AD_TYPE_LABELS, PAYMENT_LABELS } from "@/shared/api/ads";
import {
  WORK_LABELS,
  EMPLOYMENT_LABELS,
  PAYMENT_CURRENCY_LABELS,
  JOB_OFFER_TYPE_LABELS,
  type WorkType,
  type EmploymentType,
  type PaymentCurrency,
  type JobOfferType,
} from "@/shared/api/jobs";
import { type ExchangeOptionsPayload } from "@/shared/api/exchangeOptions";
import { inputStyleModal, inputStyleError } from "./constants";
import type { SubmitFormSection } from "./constants";

export type SubmitFormBySectionProps = {
  section: SubmitFormSection;
  formData: Record<string, string>;
  setFormField: (key: string, value: string) => void;
  invalidFields: string[];
  exchangeOptions: ExchangeOptionsPayload | null;
};

export function SubmitFormBySection({
  section,
  formData,
  setFormField,
  invalidFields,
  exchangeOptions,
}: SubmitFormBySectionProps) {
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

  const LISTING_DURATION_OPTIONS: { value: string; label: string }[] = [
    { value: "24", label: "1 день (24 часа)" },
    { value: "48", label: "2 дня (48 часов)" },
    { value: "72", label: "3 дня (72 часа)" },
    { value: "168", label: "7 дней (168 часов)" },
  ];
  const listingDurationField = (
    <div>
      {label("Срок размещения")}
      {select("listingDuration", LISTING_DURATION_OPTIONS)}
    </div>
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
        {listingDurationField}
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
        {listingDurationField}
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
        {listingDurationField}
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
        {listingDurationField}
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
        {listingDurationField}
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
        {listingDurationField}
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
        {listingDurationField}
      </div>
    );
  }

  return null;
}
