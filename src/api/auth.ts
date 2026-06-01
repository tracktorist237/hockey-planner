import { normalizeAppRole, normalizeRole } from "src/constants/roles";
import { User } from "src/types/user";

const API_BASE = process.env.REACT_APP_API_BASE || "";
const ACCESS_TOKEN_KEY = "authAccessToken";
const REFRESH_TOKEN_KEY = "authRefreshToken";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "authAccessTokenExpiresAt";

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

export interface LinkPlayerRequest {
  userId: string;
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

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setAuthTokens = (response: AuthResponse): User => {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, response.accessTokenExpiresAt);
  return mapAuthUser(response.user);
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
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

const requestJson = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
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
  const response = await requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return setAuthTokens(response);
}

export async function registerAuth(request: RegisterAuthRequest): Promise<User> {
  const response = await requestJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return setAuthTokens(response);
}

export async function linkPlayerAuth(request: LinkPlayerRequest): Promise<User> {
  const response = await authFetch("/api/auth/link-player", {
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
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthTokens();
    return null;
  }

  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
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

  return setAuthTokens((await response.json()) as AuthResponse);
}

export async function authFetch(input: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const accessToken = getAccessToken();
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE}${input}`, {
    ...init,
    headers,
  });

  if (response.status !== 401 || !retry || !getRefreshToken()) {
    return response;
  }

  await refreshAuth();
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
