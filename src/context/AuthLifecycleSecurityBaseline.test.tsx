import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  clearAuthTokens,
  getAccessToken,
  getAuthSessionUserId,
  getCurrentAuthUser,
  getRefreshToken,
  logoutAuth,
} from "src/api/auth";
import { AppRole, UserRole } from "src/constants/roles";
import { AuthProvider, useAuthContext } from "src/context/AuthContext";
import { User } from "src/types/user";

jest.mock("src/api/auth", () => ({
  ...jest.requireActual("src/api/auth"),
  getAccessToken: jest.fn(),
  getAuthSessionUserId: jest.fn(),
  getRefreshToken: jest.fn(),
  getCurrentAuthUser: jest.fn(),
  logoutAuth: jest.fn(),
}));

const mockedGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const mockedGetAuthSessionUserId = getAuthSessionUserId as jest.MockedFunction<typeof getAuthSessionUserId>;
const mockedGetRefreshToken = getRefreshToken as jest.MockedFunction<typeof getRefreshToken>;
const mockedGetCurrentAuthUser = getCurrentAuthUser as jest.MockedFunction<typeof getCurrentAuthUser>;
const mockedLogoutAuth = logoutAuth as jest.MockedFunction<typeof logoutAuth>;

const cachedUser: User = {
  id: "11111111-1111-1111-1111-111111111111",
  firstName: "Cached",
  lastName: "User",
  jerseyNumber: null,
  role: UserRole.Player,
  appRole: AppRole.User,
};

const newerUser: User = {
  ...cachedUser,
  id: "22222222-2222-2222-2222-222222222222",
  firstName: "Newer",
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

function AuthProbe() {
  const { currentUser, isAuthenticated, authLoading, logout } = useAuthContext();
  return (
    <>
      <div data-testid="user-id">{currentUser?.id ?? "none"}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="loading">{String(authLoading)}</div>
      <button type="button" onClick={() => void logout()}>
        Logout
      </button>
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  mockedGetAccessToken.mockReset();
  mockedGetAuthSessionUserId.mockReset();
  mockedGetRefreshToken.mockReset();
  mockedGetCurrentAuthUser.mockReset();
  mockedLogoutAuth.mockReset();
});

test("cached currentUser alone does not establish an authenticated session", async () => {
  localStorage.setItem("currentUser", JSON.stringify(cachedUser));
  mockedGetAccessToken.mockReturnValue(null);
  mockedGetRefreshToken.mockReturnValue(null);
  mockedGetCurrentAuthUser.mockResolvedValue(null);

  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

  expect(screen.getByTestId("user-id")).toHaveTextContent("none");
  expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
  expect(screen.getByTestId("user-id")).toHaveTextContent("none");
});

test("matching cached user survives a transient startup failure with persisted credentials", async () => {
  const warning = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  const persistedSession = JSON.stringify({
    version: "persisted-session",
    userId: cachedUser.id,
    accessToken: "access-token",
    refreshToken: "refresh-token",
    accessTokenExpiresAt: "2099-01-01T00:00:00Z",
  });
  localStorage.setItem("authSession", persistedSession);
  localStorage.setItem("currentUser", JSON.stringify(cachedUser));
  mockedGetAccessToken.mockReturnValue("access-token");
  mockedGetRefreshToken.mockReturnValue("refresh-token");
  mockedGetAuthSessionUserId.mockReturnValue(cachedUser.id);
  mockedGetCurrentAuthUser.mockRejectedValue(new TypeError("Failed to fetch"));

  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
  expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
  expect(screen.getByTestId("user-id")).toHaveTextContent(cachedUser.id);
  expect(localStorage.getItem("authSession")).toBe(persistedSession);
  expect(localStorage.getItem("currentUser")).toBe(JSON.stringify(cachedUser));
  warning.mockRestore();
});

test("cached user from a different account is not trusted after a transient startup failure", async () => {
  const warning = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  localStorage.setItem("currentUser", JSON.stringify(cachedUser));
  mockedGetAccessToken.mockReturnValue("access-token");
  mockedGetRefreshToken.mockReturnValue("refresh-token");
  mockedGetAuthSessionUserId.mockReturnValue(newerUser.id);
  mockedGetCurrentAuthUser.mockRejectedValue(new TypeError("Failed to fetch"));

  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
  expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  expect(screen.getByTestId("user-id")).toHaveTextContent("none");
  warning.mockRestore();
});

test("logout clears authenticated user state when the API call fails", async () => {
  const warning = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  mockedGetAccessToken.mockReturnValue("access-token");
  mockedGetRefreshToken.mockReturnValue("refresh-token");
  mockedGetCurrentAuthUser.mockResolvedValue(cachedUser);
  mockedLogoutAuth.mockRejectedValue(new Error("logout unavailable"));

  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(screen.getByTestId("user-id")).toHaveTextContent(cachedUser.id));
  fireEvent.click(screen.getByRole("button", { name: "Logout" }));
  await waitFor(() => expect(screen.getByTestId("user-id")).toHaveTextContent("none"));
  expect(localStorage.getItem("currentUser")).toBeNull();
  warning.mockRestore();
});

test("definitive refresh failure clears cached authenticated user state", async () => {
  localStorage.setItem("currentUser", JSON.stringify(cachedUser));
  mockedGetAccessToken.mockReturnValue("expired-access-token");
  mockedGetRefreshToken.mockReturnValue("rejected-refresh-token");
  mockedGetCurrentAuthUser.mockImplementation(async () => {
    mockedGetAccessToken.mockReturnValue(null);
    mockedGetRefreshToken.mockReturnValue(null);
    clearAuthTokens();
    throw new Error("Definitive refresh failure");
  });

  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
  expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  expect(screen.getByTestId("user-id")).toHaveTextContent("none");
  expect(localStorage.getItem("currentUser")).toBeNull();
});

test("a storage event from another tab clears authenticated state after logout", async () => {
  mockedGetAccessToken.mockReturnValue("access-token");
  mockedGetRefreshToken.mockReturnValue("refresh-token");
  mockedGetCurrentAuthUser.mockResolvedValue(cachedUser);

  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(screen.getByTestId("user-id")).toHaveTextContent(cachedUser.id));
  mockedGetAccessToken.mockReturnValue(null);
  mockedGetRefreshToken.mockReturnValue(null);
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: "authSession" }));
  });

  await waitFor(() => expect(screen.getByTestId("user-id")).toHaveTextContent("none"));
  expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  expect(localStorage.getItem("currentUser")).toBeNull();
});

test("a newer cross-tab session sync wins over delayed stale completion", async () => {
  mockedGetAccessToken.mockReturnValue("access-token");
  mockedGetRefreshToken.mockReturnValue("refresh-token");
  mockedGetAuthSessionUserId.mockReturnValue(newerUser.id);
  const staleSync = createDeferred<User | null>();
  const newerSync = createDeferred<User | null>();
  mockedGetCurrentAuthUser
    .mockReturnValueOnce(staleSync.promise)
    .mockReturnValueOnce(newerSync.promise);

  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(mockedGetCurrentAuthUser).toHaveBeenCalledTimes(1));
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: "authSession" }));
  });
  await waitFor(() => expect(mockedGetCurrentAuthUser).toHaveBeenCalledTimes(2));

  await act(async () => {
    newerSync.resolve(newerUser);
    await Promise.resolve();
  });
  await waitFor(() => expect(screen.getByTestId("user-id")).toHaveTextContent(newerUser.id));
  await act(async () => {
    staleSync.resolve(cachedUser);
    await Promise.resolve();
  });
  await waitFor(() => expect(screen.getByTestId("user-id")).toHaveTextContent(newerUser.id));
});

test("cross-tab account replacement hides the old user until the new session is validated", async () => {
  mockedGetAccessToken.mockReturnValue("access-token");
  mockedGetRefreshToken.mockReturnValue("refresh-token");
  mockedGetAuthSessionUserId.mockReturnValue(cachedUser.id);
  const replacementSync = createDeferred<User | null>();
  mockedGetCurrentAuthUser
    .mockResolvedValueOnce(cachedUser)
    .mockReturnValueOnce(replacementSync.promise);

  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(screen.getByTestId("user-id")).toHaveTextContent(cachedUser.id));
  mockedGetAuthSessionUserId.mockReturnValue(newerUser.id);
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: "authSession" }));
  });

  expect(screen.getByTestId("user-id")).toHaveTextContent("none");
  expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  await act(async () => {
    replacementSync.resolve(newerUser);
    await Promise.resolve();
  });
  await waitFor(() => expect(screen.getByTestId("user-id")).toHaveTextContent(newerUser.id));
});
