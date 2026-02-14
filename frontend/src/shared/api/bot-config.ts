import { fetchDatasetFromApi } from "./dataSource";

export type BotConfigPayload = {
  welcomeMessage?: string;
  welcomePhotoUrl?: string | null;
  supportLink?: string | null;
};

export async function fetchBotConfig(): Promise<BotConfigPayload | null> {
  const payload = await fetchDatasetFromApi<BotConfigPayload>("botConfig");
  if (!payload) {
    return null;
  }
  return payload;
}
