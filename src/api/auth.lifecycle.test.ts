import {
  AuthResponse,
  getAccessToken,
  getRefreshToken,
  logoutAuth,
  refreshAuth,
  setAuthTokens,
} from "src/api/auth";
import { AppRole, UserRole } from "src/constants/roles";

const createAuthResponse = (suffix: string): AuthResponse => ({
  accessToken: `access-${suffix}`,
  refreshToken: `refresh-${suffix}`,
  accessTokenExpiresAt: "2026-08-16T12:30:00.000Z",
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

beforeEach(() => {
  localStorage.clear();
  mockedFetch.mockReset();
  global.fetch = mockedFetch;
});

test("definitive refresh failure clears stored credentials", async () => {
  setAuthTokens(createAuthResponse("1"));
  mockedFetch.mockResolvedValue(createResponse(401, { message: "Session expired." }));

  await expect(refreshAuth()).rejects.toThrow("Session expired.");

  expect(getAccessToken()).toBeNull();
  expect(getRefreshToken()).toBeNull();
});

test("logout clears stored credentials even when the logout request fails", async () => {
  setAuthTokens(createAuthResponse("2"));
  mockedFetch.mockRejectedValue(new Error("network down"));

  await expect(logoutAuth()).rejects.toThrow();

  expect(getAccessToken()).toBeNull();
  expect(getRefreshToken()).toBeNull();
});

test.skip("M4.5: a stale tab refresh failure cannot erase a newer rotated session", async () => {
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
  await expect(staleRefresh).rejects.toThrow("Old token was consumed.");

  expect(staleTab.getAccessToken()).toBe("access-4");
  expect(staleTab.getRefreshToken()).toBe("refresh-4");
});
