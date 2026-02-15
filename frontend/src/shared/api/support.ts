const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");

export type SubmitSupportPayload = {
  telegramId: string | number;
  username?: string | null;
  message: string;
};

export async function submitSupportRequest(payload: SubmitSupportPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/support/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to submit support request: ${res.status}`);
  }
}
