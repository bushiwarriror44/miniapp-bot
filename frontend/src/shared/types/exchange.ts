export type ExchangeSection =
  | "buy-ads"
  | "sell-ads"
  | "jobs"
  | "designers"
  | "currency"
  | "sell-channel"
  | "buy-channel"
  | "other";

export type SearchHit = {
  section: ExchangeSection;
  id: string;
  title: string;
  snippet?: string;
};
