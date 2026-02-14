const RAW_CONTENT_API_BASE = process.env.NEXT_PUBLIC_CONTENT_API_URL?.trim() || "";
const CONTENT_API_BASE = RAW_CONTENT_API_BASE
  ? RAW_CONTENT_API_BASE.replace(/\/$/, "")
  : null;
let hasLoggedMissingContentApiUrl = false;

export async function fetchDatasetFromApi<T>(
  datasetName: string
): Promise<T | null> {
  if (!CONTENT_API_BASE) {
    if (!hasLoggedMissingContentApiUrl) {
      hasLoggedMissingContentApiUrl = true;
      console.error(
        '[content-api] NEXT_PUBLIC_CONTENT_API_URL is not configured. ' +
          "Set it in frontend env and rebuild frontend."
      );
    }
    return null;
  }

  try {
    const res = await fetch(`${CONTENT_API_BASE}/datasets/${datasetName}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        `[content-api] Dataset "${datasetName}" request failed: ${res.status}`
      );
      return null;
    }

    const json = (await res.json()) as { payload?: unknown };
    if (!json || json.payload == null) {
      console.error(`[content-api] Dataset "${datasetName}" payload is missing`);
      return null;
    }

    return json.payload as T;
  } catch (error) {
    console.error(`[content-api] Dataset "${datasetName}" request error`, error);
    return null;
  }
}

export async function fetchDatasetOrFallback<T>(
  datasetName: string,
  fallbackLoader: () => Promise<T>
): Promise<T> {
  const payload = await fetchDatasetFromApi<T>(datasetName);
  if (payload != null) {
    return payload;
  }
  try {
    return fallbackLoader();
  } catch (error) {
    console.error(
      `[content-api] Fallback failed for dataset "${datasetName}"`,
      error
    );
    throw error;
  }
}
