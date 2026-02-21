import { getTelegramWebApp } from "@/shared/api/client";
import type { SubmitFormSection } from "./constants";

export function getRequiredFields(section: SubmitFormSection): string[] {
  switch (section) {
    case "buy-ads":
      return ["username", "priceRange"];
    case "sell-ads":
      return ["channelOrChatLink"];
    case "jobs":
      return ["offerType", "work", "usernameLink", "employmentType", "paymentCurrency"];
    case "designers":
      return ["title", "username"];
    case "sell-channel":
      return ["name", "username"];
    case "buy-channel":
      return ["username", "theme"];
    case "other":
      return ["username"];
    default:
      return [];
  }
}

export function getDefaultFormDataForSection(section: SubmitFormSection): Record<string, string> {
  const tg = getTelegramWebApp();
  const username = tg?.initDataUnsafe?.user?.username ?? "";
  const uname = typeof username === "string" ? username.replace(/^@/, "").trim() : "";
  const link = uname ? `https://t.me/${uname}` : "";
  const base: Record<string, string> = {};
  if (uname) base.username = uname;
  if (section === "jobs" && link) base.usernameLink = link;
  return base;
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}
