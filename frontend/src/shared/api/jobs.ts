import { fetchDatasetOrFallback } from "./dataSource";

export type WorkType =
  | "editor"
  | "sales"
  | "buyer"
  | "designer"
  | "motion_designer";

export type EmploymentType = "remote" | "offline";

export type PaymentCurrency = "usd" | "rub";

export type JobOfferType = "seeking" | "offering";

export type JobItem = {
  id: string;
  offerType: JobOfferType;
  work: WorkType;
  usernameLink: string;
  portfolioUrl: string | null;
  employmentType: EmploymentType;
  paymentCurrency: PaymentCurrency;
  paymentAmount: string;
  theme: string;
  description: string;
  publishedAt: string;
};

export const JOB_OFFER_TYPE_LABELS: Record<JobOfferType, string> = {
  seeking: "Ищу работу",
  offering: "Предлагаю работу",
};

export type JobsResponse = {
  jobs: JobItem[];
};

export async function fetchJobs(): Promise<JobsResponse> {
  return fetchDatasetOrFallback<JobsResponse>("jobs", async () => {
    const data = await import("@/shared/data/jobs.json");
    return data as JobsResponse;
  });
}

export const WORK_LABELS: Record<WorkType, string> = {
  editor: "Редактор",
  sales: "Продажник",
  buyer: "Закупщик",
  designer: "Дизайнер",
  motion_designer: "Моушен-дизайнер",
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  remote: "Удаленный",
  offline: "Оффлайн",
};

export const PAYMENT_CURRENCY_LABELS: Record<PaymentCurrency, string> = {
  usd: "доллары",
  rub: "рубли",
};
