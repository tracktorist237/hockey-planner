import { normalizeAppRole, normalizeRole } from "src/constants/roles";
import { User } from "src/types/user";
import { writeClientDebugEvent } from "src/utils/clientDebugLog";
import { buildApiUrl } from "src/api/client";

const ACCESS_TOKEN_KEY = "authAccessToken";
const REFRESH_TOKEN_KEY = "authRefreshToken";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "authAccessTokenExpiresAt";
const AUTH_SESSION_KEY = "authSession";
const CURRENT_USER_KEY = "currentUser";
const AUTH_SESSION_CHANGED_EVENT = "hockeyplanner:auth-session-changed";
const AUTH_REQUEST_TIMEOUT_MS = 15_000;
let refreshPromise: Promise<User | null> | null = null;

interface AuthSessionSnapshot {
  version: string;
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
}

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

const newSessionVersion = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const readAuthSession = (): AuthSessionSnapshot => {
  const storedSession = safeGetItem(AUTH_SESSION_KEY);
  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession) as Partial<AuthSessionSnapshot>;
      if (typeof parsed.version === "string") {
        return {
          version: parsed.version,
          userId: typeof parsed.userId === "string" ? parsed.userId : null,
          accessToken: typeof parsed.accessToken === "string" ? parsed.accessToken : null,
          refreshToken: typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
          accessTokenExpiresAt:
            typeof parsed.accessTokenExpiresAt === "string" ? parsed.accessTokenExpiresAt : null,
        };
      }
    } catch (error) {
      writeClientDebugEvent("auth.session.parse.failed", { error });
    }
  }

  return {
    version: "legacy",
    userId: null,
    accessToken: safeGetItem(ACCESS_TOKEN_KEY),
    refreshToken: safeGetItem(REFRESH_TOKEN_KEY),
    accessTokenExpiresAt: safeGetItem(ACCESS_TOKEN_EXPIRES_AT_KEY),
  };
};

const isSameSession = (left: AuthSessionSnapshot, right: AuthSessionSnapshot): boolean =>
  left.version === right.version &&
  left.userId === right.userId &&
  left.accessToken === right.accessToken &&
  left.refreshToken === right.refreshToken &&
  left.accessTokenExpiresAt === right.accessTokenExpiresAt;

const dispatchSessionChanged = (): void => {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
};

const writeAuthSession = (session: AuthSessionSnapshot): void => {
  safeSetItem(AUTH_SESSION_KEY, JSON.stringify(session));
  if (session.accessToken && session.refreshToken && session.accessTokenExpiresAt) {
    safeSetItem(ACCESS_TOKEN_KEY, session.accessToken);
    safeSetItem(REFRESH_TOKEN_KEY, session.refreshToken);
    safeSetItem(ACCESS_TOKEN_EXPIRES_AT_KEY, session.accessTokenExpiresAt);
  } else {
    safeRemoveItem(ACCESS_TOKEN_KEY);
    safeRemoveItem(REFRESH_TOKEN_KEY);
    safeRemoveItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  }
  dispatchSessionChanged();
};

const clearSession = (expected?: AuthSessionSnapshot): boolean => {
  if (expected && !isSameSession(readAuthSession(), expected)) {
    writeClientDebugEvent("auth.session.clear.skippedNewerSession");
    return false;
  }

  writeAuthSession({
    version: newSessionVersion(),
    userId: null,
    accessToken: null,
    refreshToken: null,
    accessTokenExpiresAt: null,
  });
  safeRemoveItem(CURRENT_USER_KEY);
  return true;
};

const replaceSession = (expected: AuthSessionSnapshot, response: AuthResponse): boolean => {
  if (!isSameSession(readAuthSession(), expected)) {
    writeClientDebugEvent("auth.session.replace.skippedNewerSession");
    return false;
  }

  writeAuthSession({
    version: newSessionVersion(),
    userId: response.user.id,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
  });
  return true;
};

export const getAccessToken = (): string | null => readAuthSession().accessToken;
export const getRefreshToken = (): string | null => readAuthSession().refreshToken;
export const getAuthSessionUserId = (): string | null => readAuthSession().userId;

export const subscribeToAuthSession = (listener: (source: "local" | "storage") => void): (() => void) => {
  const handleLocalChange = () => listener("local");
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === null || event.key === AUTH_SESSION_KEY) {
      listener("storage");
      return;
    }

    const isLegacyTokenKey =
      event.key === ACCESS_TOKEN_KEY ||
      event.key === REFRESH_TOKEN_KEY ||
      event.key === ACCESS_TOKEN_EXPIRES_AT_KEY;
    if (isLegacyTokenKey && !safeGetItem(AUTH_SESSION_KEY)) {
      listener("storage");
    }
  };

  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleLocalChange);
  window.addEventListener("storage", handleStorageChange);
  return () => {
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleStorageChange);
  };
};

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

  writeAuthSession({
    version: newSessionVersion(),
    userId: response.user.id,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
  });
  return mapAuthUser(response.user);
};

export const clearAuthTokens = (): void => {
  clearSession();
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

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = AUTH_REQUEST_TIMEOUT_MS,
): Promise<Response> => {
  if (typeof AbortController === "undefined") {
    writeClientDebugEvent("auth.fetch.noAbortController", { input: String(input) });
    return Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        window.setTimeout(() => reject(createNetworkError()), timeoutMs);
      }),
    ]);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

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
  const sessionAtStart = readAuthSession();
  const refreshToken = sessionAtStart.refreshToken;
  if (!refreshToken) {
    clearSession(sessionAtStart);
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
    const errorMessage = await readErrorMessage(response);
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      if (!isSameSession(readAuthSession(), sessionAtStart)) {
        writeClientDebugEvent("auth.refresh.rejectedSupersededSession");
        if (getAccessToken() || getRefreshToken()) {
          return null;
        }
      } else {
        clearSession(sessionAtStart);
      }
    }

    throw new Error(errorMessage);
  }

  const authResponse = (await response.json()) as AuthResponse;
  const user = mapAuthUser(authResponse.user);
  if (!replaceSession(sessionAtStart, authResponse)) {
    return null;
  }
  writeClientDebugEvent("auth.refresh.success", { hasUser: Boolean(user.id) });
  return user;
}

export async function authFetch(
  input: string,
  init: RequestInit = {},
  retry = true,
  timeoutMs = AUTH_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const sessionAtStart = readAuthSession();
  const accessToken = sessionAtStart.accessToken;
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetchWithTimeout(buildApiUrl(input), {
    ...init,
    headers,
  }, timeoutMs);

  if (response.status !== 401) {
    return response;
  }

  if (!retry) {
    clearSession(sessionAtStart);
    return response;
  }

  const currentSession = readAuthSession();
  if (!isSameSession(currentSession, sessionAtStart) && currentSession.accessToken) {
    return authFetch(input, init, false, timeoutMs);
  }

  if (!currentSession.refreshToken) {
    clearSession(currentSession);
    return response;
  }

  await refreshAuth();
  if (!getAccessToken()) {
    return response;
  }
  return authFetch(input, init, false, timeoutMs);
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

  if (response.status === 400 || response.status === 401 || response.status === 403) {
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
