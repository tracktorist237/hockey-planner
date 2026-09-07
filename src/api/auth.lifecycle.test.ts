import {
  authFetch,
  AuthResponse,
  getAccessToken,
  getCurrentAuthUser,
  getRefreshToken,
  loginAuth,
  logoutAuth,
  refreshAuth,
  setAuthTokens,
} from "src/api/auth";
import { AppRole, UserRole } from "src/constants/roles";

const createAuthResponse = (suffix: string): AuthResponse => ({
  accessToken: `access-${suffix}`,
  refreshToken: `refresh-${suffix}`,
  accessTokenExpiresAt: "2099-08-16T12:30:00.000Z",
  user: {
    id: `11111111-1111-1111-1111-${suffix.padStart(12, "0")}`,
    firstName: "Auth",
    lastName: "Baseline",
    role: UserRole.Player,
    appRole: AppRole.User,
  },
});

const createResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  }) as unknown as Response;

const mockedFetch = jest.fn();

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

beforeEach(() => {
  localStorage.clear();
  mockedFetch.mockReset();
  global.fetch = mockedFetch;
});

test("definitive refresh failure clears stored credentials", async () => {
  setAuthTokens(createAuthResponse("1"));
  localStorage.setItem("currentUser", JSON.stringify(createAuthResponse("1").user));
  mockedFetch.mockResolvedValue(createResponse(401, { message: "Session expired." }));

  await expect(refreshAuth()).rejects.toThrow("Session expired.");

  expect(getAccessToken()).toBeNull();
  expect(getRefreshToken()).toBeNull();
  expect(localStorage.getItem("currentUser")).toBeNull();
});

test("definitive current-user rejection clears stored credentials", async () => {
  setAuthTokens(createAuthResponse("12"));
  localStorage.setItem("currentUser", JSON.stringify(createAuthResponse("12").user));
  mockedFetch.mockResolvedValue(createResponse(403, { message: "Forbidden." }));

  await expect(getCurrentAuthUser()).resolves.toBeNull();

  expect(getAccessToken()).toBeNull();
  expect(getRefreshToken()).toBeNull();
  expect(localStorage.getItem("currentUser")).toBeNull();
});

test("logout clears stored credentials even when the logout request fails", async () => {
  setAuthTokens(createAuthResponse("2"));
  localStorage.setItem("currentUser", JSON.stringify(createAuthResponse("2").user));
  mockedFetch.mockRejectedValue(new Error("network down"));

  await expect(logoutAuth()).rejects.toThrow();

  expect(getAccessToken()).toBeNull();
  expect(getRefreshToken()).toBeNull();
  expect(localStorage.getItem("currentUser")).toBeNull();
});

test("a transient refresh failure preserves the current session for retry", async () => {
  setAuthTokens(createAuthResponse("20"));
  mockedFetch.mockRejectedValue(new Error("network down"));

  await expect(refreshAuth()).rejects.toThrow();

  expect(getAccessToken()).toBe("access-20");
  expect(getRefreshToken()).toBe("refresh-20");
});

test("successful login and logout retain their existing transport behavior", async () => {
  mockedFetch
    .mockResolvedValueOnce(createResponse(200, createAuthResponse("21")))
    .mockResolvedValueOnce(createResponse(200, {}));

  const user = await loginAuth("player@example.com", "password");
  expect(user.id).toBe(createAuthResponse("21").user.id);
  expect(getRefreshToken()).toBe("refresh-21");

  await logoutAuth();
  expect(getAccessToken()).toBeNull();
  expect(getRefreshToken()).toBeNull();
  expect(mockedFetch).toHaveBeenCalledTimes(2);
});

test("a stale tab refresh failure cannot erase a newer rotated session", async () => {
  type AuthModule = typeof import("src/api/auth");
  let staleTab!: AuthModule;
  let currentTab!: AuthModule;
  jest.isolateModules(() => {
    staleTab = require("src/api/auth") as AuthModule;
  });
  jest.isolateModules(() => {
    currentTab = require("src/api/auth") as AuthModule;
  });

  staleTab.setAuthTokens(createAuthResponse("3"));
  let completeStaleRefresh!: (response: Response) => void;
  mockedFetch
    .mockImplementationOnce(
      () => new Promise<Response>((resolve) => {
        completeStaleRefresh = resolve;
      }),
    )
    .mockResolvedValueOnce(createResponse(200, createAuthResponse("4")));

  const staleRefresh = staleTab.refreshAuth();
  await Promise.resolve();
  await currentTab.refreshAuth();
  completeStaleRefresh(createResponse(401, { message: "Old token was consumed." }));
  await expect(staleRefresh).resolves.toBeNull();

  expect(staleTab.getAccessToken()).toBe("access-4");
  expect(staleTab.getRefreshToken()).toBe("refresh-4");
});

test("a delayed stale refresh success cannot overwrite a newer session", async () => {
  type AuthModule = typeof import("src/api/auth");
  let staleTab!: AuthModule;
  let currentTab!: AuthModule;
  jest.isolateModules(() => {
    staleTab = require("src/api/auth") as AuthModule;
  });
  jest.isolateModules(() => {
    currentTab = require("src/api/auth") as AuthModule;
  });

  staleTab.setAuthTokens(createAuthResponse("5"));
  const staleResponse = createDeferred<Response>();
  mockedFetch.mockReturnValueOnce(staleResponse.promise);

  const staleRefresh = staleTab.refreshAuth();
  currentTab.setAuthTokens(createAuthResponse("6"));
  staleResponse.resolve(createResponse(200, createAuthResponse("7")));
  await expect(staleRefresh).resolves.toBeNull();

  expect(getAccessToken()).toBe("access-6");
  expect(getRefreshToken()).toBe("refresh-6");
});

test("authFetch refreshes once and retries the protected request exactly once", async () => {
  setAuthTokens(createAuthResponse("8"));
  mockedFetch
    .mockResolvedValueOnce(createResponse(401, "expired"))
    .mockResolvedValueOnce(createResponse(200, createAuthResponse("9")))
    .mockResolvedValueOnce(createResponse(401, "still unauthorized"));

  const response = await authFetch("/api/protected");

  expect(response.status).toBe(401);
  expect(mockedFetch).toHaveBeenCalledTimes(3);
  expect(mockedFetch.mock.calls.filter(([url]) => String(url).includes("/api/auth/refresh"))).toHaveLength(1);
  expect(getAccessToken()).toBeNull();
  expect(getRefreshToken()).toBeNull();
});

test("authFetch refreshes an expired session before an AllowAnonymous request", async () => {
  const expired = { ...createAuthResponse("expired"), accessTokenExpiresAt: "2000-01-01T00:00:00.000Z" };
  const refreshed = createAuthResponse("fresh");
  setAuthTokens(expired);
  mockedFetch
    .mockResolvedValueOnce(createResponse(200, refreshed))
    .mockResolvedValueOnce(createResponse(200, { events: ["authenticated"] }));

  const response = await authFetch("/api/events?currentUserId=user");

  expect(response.status).toBe(200);
  expect(mockedFetch).toHaveBeenCalledTimes(2);
  expect(String(mockedFetch.mock.calls[0][0])).toContain("/api/auth/refresh");
  expect(String(mockedFetch.mock.calls[1][0])).toContain("/api/events?currentUserId=user");
  const endpointHeaders = new Headers(mockedFetch.mock.calls[1][1]?.headers);
  expect(endpointHeaders.get("Authorization")).toBe("Bearer access-fresh");
});

test("authFetch proactively refreshes within sixty seconds of expiry", async () => {
  const expiring = {
    ...createAuthResponse("expiring"),
    accessTokenExpiresAt: new Date(Date.now() + 30_000).toISOString(),
  };
  setAuthTokens(expiring);
  mockedFetch
    .mockResolvedValueOnce(createResponse(200, createAuthResponse("renewed")))
    .mockResolvedValueOnce(createResponse(200, {}));

  await authFetch("/api/events");

  expect(String(mockedFetch.mock.calls[0][0])).toContain("/api/auth/refresh");
  expect(new Headers(mockedFetch.mock.calls[1][1]?.headers).get("Authorization")).toBe("Bearer access-renewed");
});

test("authFetch keeps genuine anonymous AllowAnonymous requests anonymous", async () => {
  mockedFetch.mockResolvedValue(createResponse(200, { events: ["public"] }));

  const response = await authFetch("/api/events");

  expect(response.status).toBe(200);
  expect(mockedFetch).toHaveBeenCalledTimes(1);
  expect(String(mockedFetch.mock.calls[0][0])).toContain("/api/events");
  expect(new Headers(mockedFetch.mock.calls[0][1]?.headers).has("Authorization")).toBe(false);
});

test("concurrent proactive requests share one refresh rotation", async () => {
  const expired = { ...createAuthResponse("proactive"), accessTokenExpiresAt: "2000-01-01T00:00:00.000Z" };
  const refreshResponse = createDeferred<Response>();
  setAuthTokens(expired);
  let refreshCalls = 0;
  let endpointCalls = 0;
  mockedFetch.mockImplementation((url: RequestInfo | URL) => {
    if (String(url).includes("/api/auth/refresh")) {
      refreshCalls += 1;
      return refreshResponse.promise;
    }
    endpointCalls += 1;
    return Promise.resolve(createResponse(200, {}));
  });

  const firstRequest = authFetch("/api/events");
  const secondRequest = authFetch("/api/releases");
  await Promise.resolve();
  refreshResponse.resolve(createResponse(200, createAuthResponse("shared")));
  await Promise.all([firstRequest, secondRequest]);

  expect(refreshCalls).toBe(1);
  expect(endpointCalls).toBe(2);
  const endpointRequests = mockedFetch.mock.calls.filter(([url]) => !String(url).includes("/api/auth/refresh"));
  expect(endpointRequests.every(([, init]) => new Headers(init?.headers).get("Authorization") === "Bearer access-shared")).toBe(true);
});

test("concurrent protected requests share one refresh rotation", async () => {
  setAuthTokens(createAuthResponse("10"));
  const refreshResponse = createDeferred<Response>();
  const refreshStarted = createDeferred<void>();
  let protectedCalls = 0;
  let refreshCalls = 0;

  mockedFetch.mockImplementation((url: RequestInfo | URL) => {
    if (String(url).includes("/api/auth/refresh")) {
      refreshCalls += 1;
      refreshStarted.resolve();
      return refreshResponse.promise;
    }

    protectedCalls += 1;
    return Promise.resolve(createResponse(protectedCalls <= 2 ? 401 : 200, {}));
  });

  const firstRequest = authFetch("/api/protected/one");
  const secondRequest = authFetch("/api/protected/two");
  await refreshStarted.promise;
  refreshResponse.resolve(createResponse(200, createAuthResponse("11")));

  const responses = await Promise.all([firstRequest, secondRequest]);
  expect(responses.map((response) => response.status)).toEqual([200, 200]);
  expect(refreshCalls).toBe(1);
  expect(protectedCalls).toBe(4);
  expect(getRefreshToken()).toBe("refresh-11");
});
