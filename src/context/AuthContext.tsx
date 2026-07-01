import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ChangeEmailRequest,
  changeEmailAuth,
  ChangePasswordRequest,
  changePasswordAuth,
  clearAuthTokens,
  confirmEmailAuth,
  getAccessToken,
  forgotPasswordAuth,
  getCurrentAuthUser,
  getRefreshToken,
  loginAuth,
  logoutAuth,
  registerAuth,
  RegisterAuthRequest,
  resendEmailConfirmationAuth,
  resetPasswordAuth,
} from "src/api/auth";
import { normalizeAppRole, normalizeRole } from "src/constants/roles";
import { User } from "src/types/user";
import { writeClientDebugEvent } from "src/utils/clientDebugLog";

const AUTH_STORAGE_KEY = "currentUser";

type StoredUser = Partial<User> & {
  role?: number | string | null;
  appRole?: number | string | null;
};

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (user: User) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (request: RegisterAuthRequest) => Promise<User>;
  changeEmail: (request: ChangeEmailRequest) => Promise<User>;
  changePassword: (request: ChangePasswordRequest) => Promise<User>;
  resendEmailConfirmation: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  confirmEmail: (token: string) => Promise<User | null>;
  logout: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapStoredUser = (raw: StoredUser): User | null => {
  if (!raw?.id) {
    return null;
  }

  return {
    id: raw.id,
    firstName: raw.firstName ?? null,
    lastName: raw.lastName ?? null,
    jerseyNumber: raw.jerseyNumber ?? null,
    fullName: raw.fullName,
    photoUrl: raw.photoUrl ?? null,
    spbhlPlayerId: raw.spbhlPlayerId ?? null,
    primaryPosition: raw.primaryPosition ?? null,
    birthDate: raw.birthDate ?? null,
    phone: raw.phone ?? null,
    email: raw.email ?? null,
    emailConfirmed: Boolean(raw.emailConfirmed),
    role: normalizeRole(raw.role),
    appRole: normalizeAppRole(raw.appRole),
  };
};

const readStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? mapStoredUser(JSON.parse(raw) as StoredUser) : null;
  } catch (error) {
    writeClientDebugEvent("auth.readStoredUser.failed", { error });
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (removeError) {
      writeClientDebugEvent("auth.readStoredUser.removeFailed", { error: removeError });
    }
    return null;
  }
};

const persistCurrentUser = (user: User | null): void => {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    writeClientDebugEvent("auth.persistCurrentUser.failed", { error, hasUser: Boolean(user?.id) });
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => readStoredUser());
  const [authLoading, setAuthLoading] = useState(true);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    persistCurrentUser(user);
  }, []);

  // Legacy player selection is kept temporarily so the old player-search flow does not break mid-refactor.
  const login = useCallback(
    async (user: User) => {
      const fallbackUser = mapStoredUser(user) ?? user;
      clearAuthTokens();
      setCurrentUser(fallbackUser);
    },
    [setCurrentUser],
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const user = await loginAuth(email, password);
      setCurrentUser(user);
    },
    [setCurrentUser],
  );

  const registerWithPassword = useCallback(
    async (request: RegisterAuthRequest) => {
      const user = await registerAuth(request);
      setCurrentUser(user);
      return user;
    },
    [setCurrentUser],
  );

  const changeEmail = useCallback(
    async (request: ChangeEmailRequest) => {
      const user = await changeEmailAuth(request);
      setCurrentUser(user);
      return user;
    },
    [setCurrentUser],
  );

  const changePassword = useCallback(
    async (request: ChangePasswordRequest) => {
      const user = await changePasswordAuth(request);
      setCurrentUser(user);
      return user;
    },
    [setCurrentUser],
  );

  const resendEmailConfirmation = useCallback(async () => {
    await resendEmailConfirmationAuth();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await forgotPasswordAuth(email);
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await resetPasswordAuth(token, newPassword);
  }, []);

  const confirmEmail = useCallback(async (token: string) => {
    await confirmEmailAuth(token);
    const serverUser = await getCurrentAuthUser();
    setCurrentUser(serverUser);
    return serverUser;
  }, [setCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await logoutAuth();
    } catch (error) {
      console.warn("Auth logout API failed, local logout will be applied:", error);
    } finally {
      setCurrentUser(null);
    }
  }, [setCurrentUser]);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      if (isMounted) {
        writeClientDebugEvent("auth.syncSession.timeout");
        setAuthLoading(false);
      }
    }, 20000);

    const syncSession = async () => {
      try {
        writeClientDebugEvent("auth.syncSession.start");
        const serverUser = await getCurrentAuthUser();
        if (isMounted) {
          setCurrentUser(serverUser);
          writeClientDebugEvent("auth.syncSession.success", { hasUser: Boolean(serverUser?.id) });
        }
      } catch (error) {
        if (isMounted) {
          console.warn("Unable to sync auth session from API:", error);
          writeClientDebugEvent("auth.syncSession.failed", { error });
        }
      } finally {
        if (isMounted) {
          window.clearTimeout(timeoutId);
          setAuthLoading(false);
        }
      }
    };

    void syncSession();

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [setCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser?.id && (getAccessToken() || getRefreshToken())),
      authLoading,
      login,
      loginWithPassword,
      registerWithPassword,
      changeEmail,
      changePassword,
      resendEmailConfirmation,
      forgotPassword,
      resetPassword,
      confirmEmail,
      logout,
      setCurrentUser,
    }),
    [
      currentUser,
      authLoading,
      login,
      loginWithPassword,
      registerWithPassword,
      changeEmail,
      changePassword,
      resendEmailConfirmation,
      forgotPassword,
      resetPassword,
      confirmEmail,
      logout,
      setCurrentUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}
