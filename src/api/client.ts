const API_BASE = "https://localhost:44390"; // прямой путь к бэкенду

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: "include", // если нужен auth
  });

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("API returned not JSON:", text);
    throw err;
  }
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST error ${res.status}`);
  return res.json();
}
