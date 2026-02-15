import { fetchDatasetFromApi } from "./dataSource";
import { WORK_LABELS, PAYMENT_CURRENCY_LABELS } from "./jobs";
import type { WorkType } from "./jobs";
import type { PaymentCurrency } from "./jobs";

export type ExchangeOptionItem = { value: string; label: string };

export type ExchangeOptionsPayload = {
  jobTypes?: ExchangeOptionItem[];
  currencies?: ExchangeOptionItem[];
};

const DEFAULT_JOB_TYPES: ExchangeOptionItem[] = [
  ...(Object.entries(WORK_LABELS) as [WorkType, string][]).map(([value, label]) => ({ value, label })),
  { value: "other", label: "Другое" },
];

const DEFAULT_CURRENCIES: ExchangeOptionItem[] = (Object.entries(PAYMENT_CURRENCY_LABELS) as [PaymentCurrency, string][]).map(
  ([value, label]) => ({ value, label })
);

export function getDefaultExchangeOptions(): ExchangeOptionsPayload {
  return { jobTypes: DEFAULT_JOB_TYPES, currencies: DEFAULT_CURRENCIES };
}

export async function fetchExchangeOptions(): Promise<ExchangeOptionsPayload> {
  const payload = await fetchDatasetFromApi<ExchangeOptionsPayload>("exchangeOptions");
  if (payload && Array.isArray(payload.jobTypes) && payload.jobTypes.length > 0 && Array.isArray(payload.currencies) && payload.currencies.length > 0) {
    return { jobTypes: payload.jobTypes, currencies: payload.currencies };
  }
  return getDefaultExchangeOptions();
}

export function getJobTypeLabel(value: string, options: ExchangeOptionsPayload | null): string {
  const item = options?.jobTypes?.find((o) => o.value === value);
  if (item) return item.label;
  if (value === "other") return "Другое";
  return WORK_LABELS[value as WorkType] ?? value;
}

export function getCurrencyLabel(value: string, options: ExchangeOptionsPayload | null): string {
  const item = options?.currencies?.find((o) => o.value === value);
  if (item) return item.label;
  return PAYMENT_CURRENCY_LABELS[value as PaymentCurrency] ?? value;
}
