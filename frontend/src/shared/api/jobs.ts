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

const LOAD_DELAY_MS = 1200;

export async function fetchJobs(): Promise<JobsResponse> {
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
  const data = await import("@/shared/data/jobs.json");
  return data as JobsResponse;
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
