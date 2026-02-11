const CONTENT_API_BASE =
  (process.env.NEXT_PUBLIC_CONTENT_API_URL || "http://localhost:5000/api").replace(
    /\/$/,
    ""
  );

export async function fetchDatasetOrFallback<T>(
  datasetName: string,
  fallbackLoader: () => Promise<T>
): Promise<T> {
  try {
    const res = await fetch(`${CONTENT_API_BASE}/datasets/${datasetName}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Dataset request failed: ${res.status}`);
    }

    const json = (await res.json()) as { payload?: unknown };
    if (!json || json.payload == null) {
      throw new Error("Dataset payload is missing");
    }

    return json.payload as T;
  } catch {
    return fallbackLoader();
  }
}
