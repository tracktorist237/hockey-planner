const API_BASE = process.env.REACT_APP_API_BASE || "";
const API_REQUEST_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
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
  const res = await fetchWithTimeout(`${API_BASE}${url}`, {
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
