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

export type FetchDatasetPaginatedParams = {
  cursor?: string | null;
  limit?: number;
  [key: string]: string | number | undefined | null;
};

export type FetchDatasetPaginatedResponse<T> = {
  payload: T;
  nextCursor: string | null;
};

export async function fetchDatasetPaginated<T>(
  datasetName: string,
  params: FetchDatasetPaginatedParams = {}
): Promise<FetchDatasetPaginatedResponse<T> | null> {
  if (!CONTENT_API_BASE) {
    if (!hasLoggedMissingContentApiUrl) {
      hasLoggedMissingContentApiUrl = true;
      console.error('[content-api] NEXT_PUBLIC_CONTENT_API_URL is not configured.');
    }
    return null;
  }

  const search = new URLSearchParams();
  if (params.cursor != null && params.cursor !== "") search.set("cursor", String(params.cursor));
  if (params.limit != null) search.set("limit", String(params.limit));
  Object.keys(params).forEach((k) => {
    if (k === "cursor" || k === "limit") return;
    const v = params[k];
    if (v != null && v !== "") search.set(k, String(v));
  });

  try {
    const url = `${CONTENT_API_BASE}/datasets/${datasetName}?${search.toString()}`;
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) {
      console.error(`[content-api] Dataset "${datasetName}" paginated request failed: ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { payload?: T; nextCursor?: string | null };
    if (!json || json.payload == null) return null;
    return {
      payload: json.payload as T,
      nextCursor: json.nextCursor ?? null,
    };
  } catch (error) {
    console.error(`[content-api] Dataset "${datasetName}" paginated request error`, error);
    return null;
  }
}

export async function fetchDatasetItem<T = Record<string, unknown>>(
  datasetName: string,
  itemId: string
): Promise<{ item: T; name: string } | null> {
  if (!CONTENT_API_BASE) {
    if (!hasLoggedMissingContentApiUrl) {
      hasLoggedMissingContentApiUrl = true;
      console.error('[content-api] NEXT_PUBLIC_CONTENT_API_URL is not configured.');
    }
    return null;
  }
  const id = String(itemId ?? "").trim();
  if (!id) return null;
  try {
    const res = await fetch(
      `${CONTENT_API_BASE}/datasets/${encodeURIComponent(datasetName)}/items/${encodeURIComponent(id)}`,
      { method: "GET", cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { item?: T; name?: string };
    if (!json || json.item == null) return null;
    return { item: json.item as T, name: json.name ?? datasetName };
  } catch (error) {
    console.error(`[content-api] Dataset item "${datasetName}/${id}" request error`, error);
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
