import { normalizeAppRole, normalizeRole } from "src/constants/roles";
import { User } from "src/types/user";
import { writeClientDebugEvent } from "src/utils/clientDebugLog";
import { buildApiUrl } from "src/api/client";

const ACCESS_TOKEN_KEY = "authAccessToken";
const REFRESH_TOKEN_KEY = "authRefreshToken";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "authAccessTokenExpiresAt";
const AUTH_REQUEST_TIMEOUT_MS = 15_000;
let refreshPromise: Promise<User | null> | null = null;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: AuthUserDto;
}

export interface RegisterAuthRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  jerseyNumber?: number | null;
}

export interface ChangeEmailRequest {
  newEmail: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

type AuthUserDto = Partial<User> & {
  id: string;
  role?: number | string | null;
  appRole?: number | string | null;
  email?: string | null;
  emailConfirmed?: boolean;
};

const mapAuthUser = (user: AuthUserDto): User => ({
  id: user.id,
  firstName: user.firstName ?? null,
  lastName: user.lastName ?? null,
  jerseyNumber: user.jerseyNumber ?? null,
  fullName: user.fullName ?? `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim(),
  role: normalizeRole(user.role),
  appRole: normalizeAppRole(user.appRole),
  photoUrl: user.photoUrl ?? null,
  spbhlPlayerId: user.spbhlPlayerId ?? null,
  primaryPosition: user.primaryPosition ?? null,
  birthDate: user.birthDate ?? null,
  email: user.email ?? null,
  emailConfirmed: Boolean(user.emailConfirmed),
});

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    writeClientDebugEvent("auth.storage.get.failed", { key, error });
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    writeClientDebugEvent("auth.storage.set.failed", { key, error });
    throw error;
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    writeClientDebugEvent("auth.storage.remove.failed", { key, error });
  }
};

export const getAccessToken = (): string | null => safeGetItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => safeGetItem(REFRESH_TOKEN_KEY);

export const setAuthTokens = (response: AuthResponse): User => {
  if (!response?.accessToken || !response.refreshToken || !response.accessTokenExpiresAt || !response.user?.id) {
    writeClientDebugEvent("auth.setAuthTokens.invalidResponse", {
      hasAccessToken: Boolean(response?.accessToken),
      hasRefreshToken: Boolean(response?.refreshToken),
      hasExpiresAt: Boolean(response?.accessTokenExpiresAt),
      hasUser: Boolean(response?.user?.id),
    });
    throw new Error("Invalid authentication response.");
  }

  safeSetItem(ACCESS_TOKEN_KEY, response.accessToken);
  safeSetItem(REFRESH_TOKEN_KEY, response.refreshToken);
  safeSetItem(ACCESS_TOKEN_EXPIRES_AT_KEY, response.accessTokenExpiresAt);
  return mapAuthUser(response.user);
};

export const clearAuthTokens = (): void => {
  safeRemoveItem(ACCESS_TOKEN_KEY);
  safeRemoveItem(REFRESH_TOKEN_KEY);
  safeRemoveItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text();
  if (!text) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const data = JSON.parse(text) as { message?: string };
    return data.message ?? text;
  } catch {
    return text;
  }
};

const createNetworkError = (): Error =>
  new Error("Сервер временно недоступен. Проверьте интернет и попробуйте ещё раз.");

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  if (typeof AbortController === "undefined") {
    writeClientDebugEvent("auth.fetch.noAbortController", { input: String(input) });
    return Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        window.setTimeout(() => reject(createNetworkError()), AUTH_REQUEST_TIMEOUT_MS);
      }),
    ]);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

  try {
    writeClientDebugEvent("auth.fetch.start", { input: String(input), method: init.method ?? "GET" });
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    writeClientDebugEvent("auth.fetch.failed", { input: String(input), error });
    throw createNetworkError();
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const requestJson = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetchWithTimeout(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
};

export async function loginAuth(email: string, password: string): Promise<User> {
  writeClientDebugEvent("auth.login.start");
  const response = await requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const user = setAuthTokens(response);
  writeClientDebugEvent("auth.login.success", { hasUser: Boolean(user.id) });
  return user;
}

export async function registerAuth(request: RegisterAuthRequest): Promise<User> {
  const response = await requestJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return setAuthTokens(response);
}

export async function changeEmailAuth(request: ChangeEmailRequest): Promise<User> {
  const response = await authFetch("/api/auth/change-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return setAuthTokens((await response.json()) as AuthResponse);
}

export async function changePasswordAuth(request: ChangePasswordRequest): Promise<User> {
  const response = await authFetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return setAuthTokens((await response.json()) as AuthResponse);
}

export async function resendEmailConfirmationAuth(): Promise<void> {
  const response = await authFetch("/api/auth/resend-email-confirmation", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function refreshAuth(): Promise<User | null> {
  if (refreshPromise) {
    writeClientDebugEvent("auth.refresh.joinExisting");
    return refreshPromise;
  }

  refreshPromise = refreshAuthInternal().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function refreshAuthInternal(): Promise<User | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthTokens();
    return null;
  }

  writeClientDebugEvent("auth.refresh.start");
  const response = await fetchWithTimeout(buildApiUrl("/api/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      clearAuthTokens();
    }

    throw new Error(await readErrorMessage(response));
  }

  const user = setAuthTokens((await response.json()) as AuthResponse);
  writeClientDebugEvent("auth.refresh.success", { hasUser: Boolean(user.id) });
  return user;
}

export async function authFetch(input: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const accessToken = getAccessToken();
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetchWithTimeout(buildApiUrl(input), {
    ...init,
    headers,
  });

  if (response.status !== 401 || !retry || !getRefreshToken()) {
    return response;
  }

  const refreshedUser = await refreshAuth();
  if (!refreshedUser) {
    return response;
  }
  return authFetch(input, init, false);
}

export async function logoutAuth(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      const response = await authFetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok && response.status !== 401) {
        throw new Error(await readErrorMessage(response));
      }
    }
  } finally {
    clearAuthTokens();
  }
}

export async function getCurrentAuthUser(): Promise<User | null> {
  if (!getAccessToken() && !getRefreshToken()) {
    return null;
  }

  const response = await authFetch("/api/auth/me", { method: "GET" });

  if (response.status === 401) {
    clearAuthTokens();
    return null;
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as AuthUserDto;
  return mapAuthUser(data);
}

export async function forgotPasswordAuth(email: string): Promise<void> {
  await requestJson<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordAuth(token: string, newPassword: string): Promise<void> {
  await requestJson<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function confirmEmailAuth(token: string): Promise<void> {
  await requestJson<{ message: string }>("/api/auth/confirm-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
