const CONTENT_API_BASE =
  (process.env.NEXT_PUBLIC_CONTENT_API_URL || "http://localhost:5000/api").replace(
    /\/$/,
    ""
  );

export async function fetchDatasetFromApi<T>(
  datasetName: string
): Promise<T | null> {
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
