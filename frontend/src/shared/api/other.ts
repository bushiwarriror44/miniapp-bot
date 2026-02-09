export type OtherItem = {
  id: string;
  username: string;
  usernameLink: string;
  verified: boolean;
  price: number;
  description: string;
  publishedAt: string;
};

export type OtherResponse = {
  other: OtherItem[];
};

const LOAD_DELAY_MS = 1200;

export async function fetchOther(): Promise<OtherResponse> {
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
  const data = await import("@/shared/data/other.json");
  return data as OtherResponse;
}
