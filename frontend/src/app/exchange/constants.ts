import {
  faBullhorn,
  faBriefcase,
  faPalette,
  faCoins,
  faStore,
  faShoppingCart,
  faBox,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type ExchangeSection =
  | "buy-ads"
  | "sell-ads"
  | "jobs"
  | "designers"
  | "currency"
  | "sell-channel"
  | "buy-channel"
  | "other";

export type SubmitFormSection = Exclude<ExchangeSection, "currency">;

export const EXCHANGE_SECTIONS_WITH_ITEMS: ExchangeSection[] = [
  "buy-ads",
  "sell-ads",
  "jobs",
  "designers",
  "currency",
  "sell-channel",
  "buy-channel",
  "other",
];

export const SECTIONS: { id: ExchangeSection; label: string; icon: IconDefinition }[] = [
  { id: "buy-ads", label: "Покупка рекламы", icon: faBullhorn },
  { id: "sell-ads", label: "Продажа рекламы", icon: faBullhorn },
  { id: "jobs", label: "Вакансии", icon: faBriefcase },
  { id: "designers", label: "Услуги", icon: faPalette },
  { id: "currency", label: "Обмен валют", icon: faCoins },
  { id: "sell-channel", label: "Продать канал", icon: faStore },
  { id: "buy-channel", label: "Купить канал", icon: faShoppingCart },
  { id: "other", label: "Другое", icon: faBox },
];

export const SECTIONS_FOR_SUBMIT = SECTIONS.filter((s) => s.id !== "currency");

export const inputStyleModal = {
  backgroundColor: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--input-text)",
};

export const inputStyleError = {
  ...inputStyleModal,
  border: "2px solid #dc2626",
  boxShadow: "0 0 0 1px #dc2626",
};

export const EXCHANGE_PAGE_SIZE = 20;
