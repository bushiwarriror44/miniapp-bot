import { fetchDatasetOrFallback } from "./dataSource";

export type GuarantConfig = {
  guarantor: {
    username: string;
    displayName: string;
    profileLink: string;
  };
  commissionTiers: string[];
  aboutText: string;
};

export async function fetchGuarantConfig(): Promise<GuarantConfig> {
  return fetchDatasetOrFallback<GuarantConfig>("guarantConfig", async () => ({
    guarantor: {
      username: "autogarant_example",
      displayName: "Гарант miniapp-bot",
      profileLink: "https://t.me/autogarant_example",
    },
    commissionTiers: [
      "До 100 000 ₽ — 5% от суммы сделки",
      "От 100 000 ₽ до 500 000 ₽ — 4% от суммы сделки",
      "Свыше 500 000 ₽ — 3% от суммы сделки (обсуждается индивидуально)",
    ],
    aboutText: "Автогарант сейчас находится в разработке, сейчас гарант доступен в ручном режиме.",
  }));
}
