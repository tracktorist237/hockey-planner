const API_BASE = process.env.REACT_APP_API_BASE || "";
const API_REQUEST_TIMEOUT_MS = 10_000;

export function buildApiUrl(path: string): string {
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = API_BASE.replace(/\/+$/, "");

  if (!normalizedBase) {
    return normalizedPath;
  }

  if (normalizedBase === "/api" && normalizedPath.startsWith("/api/")) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  if (typeof AbortController === "undefined") {
    return Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        window.setTimeout(() => reject(new Error("Request timed out")), API_REQUEST_TIMEOUT_MS);
      }),
    ]);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetchWithTimeout(buildApiUrl(url), {
    credentials: "include",
  });

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("API returned not JSON:", text);
    throw err;
  }
}
