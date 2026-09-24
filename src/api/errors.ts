/** Safe, transport-independent interpretation of ProblemDetails and legacy API errors. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly traceId?: string,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

const defaultMessages: Record<number, string> = {
  400: "Проверьте введённые данные.",
  401: "Необходимо войти в аккаунт.",
  403: "Недостаточно прав для этого действия.",
  404: "Запрошенные данные не найдены.",
  409: "Данные изменились. Обновите страницу и повторите действие.",
  422: "Проверьте введённые данные.",
  429: "Слишком много запросов. Попробуйте немного позже.",
  502: "Внешний сервис временно недоступен. Попробуйте позже.",
  503: "Сервис временно недоступен. Попробуйте позже.",
};

const safeMessage = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!text || text.length > 1000 || /[<>{}[\]]|\bat\s+\S+\(|stack\s?trace|exception|bearer\s|password|authorization|refresh.?token|access.?token/i.test(text)) return undefined;
  return text;
};

export function apiErrorFromPayload(status: number, payload: unknown, fallback?: string): ApiError {
  const data = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown> : {};
  const errors: Record<string, string[]> = Object.fromEntries(
    status < 500 && data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)
      ? Object.entries(data.errors).slice(0, 50).map(([field, values]) => [field,
        Array.isArray(values) ? values.map(safeMessage).filter((value): value is string => Boolean(value)) : [],
      ]) : [],
  );
  // Unexpected server/proxy failures must never expose upstream diagnostics.
  const detail = status < 500
    ? [data.detail, data.message, data.error, ...Object.values(errors).flat(), data.title]
      .map(safeMessage).find(Boolean)
    : undefined;
  const traceId = typeof data.traceId === "string" && /^[\w.:-]{1,128}$/.test(data.traceId) ? data.traceId : undefined;
  return new ApiError(detail || fallback || defaultMessages[status] || "Не удалось выполнить запрос. Попробуйте позже.", status, traceId, errors);
}

export async function parseApiError(response: Response, fallback?: string): Promise<ApiError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return apiErrorFromPayload(response.status, payload, fallback);
}

export async function readApiErrorMessage(response: Response, fallback?: string): Promise<string> {
  return (await parseApiError(response, fallback)).message;
}
