const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");

export type ModerationSection =
  | "buy-ads"
  | "sell-ads"
  | "jobs"
  | "designers"
  | "sell-channel"
  | "buy-channel"
  | "other";

type SubmitModerationPayload = {
  telegramId: string | number;
  section: ModerationSection;
  formData: Record<string, string>;
};

export async function submitModerationRequest(payload: SubmitModerationPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/moderation/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit moderation request: ${res.status} ${res.statusText}`);
  }
}
