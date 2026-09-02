import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ChangeEmailRequest,
  changeEmailAuth,
  ChangePasswordRequest,
  changePasswordAuth,
  confirmEmailAuth,
  getAuthSessionUserId,
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
  subscribeToAuthSession,
} from "src/api/auth";
import { User } from "src/types/user";
import { writeClientDebugEvent } from "src/utils/clientDebugLog";

const AUTH_STORAGE_KEY = "currentUser";

const readCachedCurrentUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedUser) {
      return null;
    }

    const parsedUser = JSON.parse(storedUser) as Partial<User>;
    return typeof parsedUser.id === "string" ? (parsedUser as User) : null;
  } catch (error) {
    writeClientDebugEvent("auth.readCachedCurrentUser.failed", { error });
    return null;
  }
};

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
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
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const setCurrentUser = useCallback((user: User | null) => {
    currentUserIdRef.current = user?.id ?? null;
    setCurrentUserState(user);
    persistCurrentUser(user);
  }, []);

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
    let syncGeneration = 0;
    const timeoutId = window.setTimeout(() => {
      if (isMounted) {
        writeClientDebugEvent("auth.syncSession.timeout");
        setAuthLoading(false);
      }
    }, 20000);

    const syncSession = async () => {
      const generation = ++syncGeneration;
      try {
        writeClientDebugEvent("auth.syncSession.start");
        const serverUser = await getCurrentAuthUser();
        if (isMounted && generation === syncGeneration) {
          setCurrentUser(serverUser);
          writeClientDebugEvent("auth.syncSession.success", { hasUser: Boolean(serverUser?.id) });
        }
      } catch (error) {
        if (isMounted && generation === syncGeneration) {
          const sessionUserId = getAuthSessionUserId();
          const cachedUser = readCachedCurrentUser();
          if (
            (getAccessToken() || getRefreshToken()) &&
            sessionUserId &&
            cachedUser?.id === sessionUserId
          ) {
            setCurrentUser(cachedUser);
          }
          console.warn("Unable to sync auth session from API:", error);
          writeClientDebugEvent("auth.syncSession.failed", { error });
        }
      } finally {
        if (isMounted && generation === syncGeneration) {
          window.clearTimeout(timeoutId);
          setAuthLoading(false);
        }
      }
    };

    const unsubscribe = subscribeToAuthSession((source) => {
      if (!getAccessToken() && !getRefreshToken()) {
        syncGeneration += 1;
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      if (source === "storage") {
        const sessionUserId = getAuthSessionUserId();
        if (!sessionUserId || sessionUserId !== currentUserIdRef.current) {
          setCurrentUser(null);
          setAuthLoading(true);
        }
        void syncSession();
      }
    });

    void syncSession();

    return () => {
      isMounted = false;
      unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, [setCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser?.id && (getAccessToken() || getRefreshToken())),
      authLoading,
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
