import { CreateUpdateRosterRequest } from "../types/lines";
import { authFetch } from "src/api/auth";

const getRosterErrorDescription = (status: number): string => {
  if (status === 0) return "нет соединения с сервером или запрос был прерван";
  if (status === 400) return "сервер отклонил данные состава";
  if (status === 401) return "нужно войти в аккаунт заново";
  if (status === 403) return "нет прав на изменение состава";
  if (status === 404) return "событие или связанные данные не найдены";
  if (status === 409) return "данные были изменены параллельно";
  if (status === 422) return "часть данных состава не прошла проверку";
  if (status >= 500) return "ошибка на сервере";
  return "не удалось выполнить запрос";
};

const readErrorMessage = async (response: Response): Promise<string | null> => {
  const payload = await response.json().catch(() => null);
  return payload?.message || payload?.error || null;
};

const throwRosterError = async (response: Response, fallback: string): Promise<never> => {
  const serverMessage = await readErrorMessage(response);
  throw new Error(`Код ${response.status}: ${getRosterErrorDescription(response.status)}. ${serverMessage || fallback}`);
};

export async function createLineRoster(
  request: CreateUpdateRosterRequest,
  currentUserId: string,
): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(`/api/lines?currentUserId=${currentUserId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(`Код 0: ${getRosterErrorDescription(0)}. Состав остался на устройстве, попробуйте сохранить позже.`);
  }

  if (!response.ok) {
    await throwRosterError(response, "Ошибка при создании звена");
  }
}

export async function updateLineRoster(
  request: CreateUpdateRosterRequest,
  currentUserId: string,
): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(`/api/lines?currentUserId=${currentUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(`Код 0: ${getRosterErrorDescription(0)}. Состав остался на устройстве, попробуйте сохранить позже.`);
  }

  if (!response.ok) {
    await throwRosterError(response, "Ошибка при обновлении состава");
  }
}

export async function deleteLineRoster(
  eventId: string,
  currentUserId: string,
): Promise<void> {
  let response: Response;
  try {
    response = await authFetch(`/api/lines?eventId=${eventId}&currentUserId=${currentUserId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new Error(`Код 0: ${getRosterErrorDescription(0)}. Попробуйте повторить действие позже.`);
  }

  if (!response.ok) {
    await throwRosterError(response, "Ошибка при удалении звена");
  }
}
