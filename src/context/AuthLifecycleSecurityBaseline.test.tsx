import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  getAccessToken,
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
  getRefreshToken: jest.fn(),
  getCurrentAuthUser: jest.fn(),
  logoutAuth: jest.fn(),
}));

const mockedGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
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

  expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
  expect(screen.getByTestId("user-id")).toHaveTextContent("none");
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

test.skip("M4.5: definitive refresh failure clears cached authenticated user state", async () => {
  localStorage.setItem("currentUser", JSON.stringify(cachedUser));
  mockedGetAccessToken.mockReturnValue("expired-access-token");
  mockedGetRefreshToken.mockReturnValue("rejected-refresh-token");
  mockedGetCurrentAuthUser.mockImplementation(async () => {
    mockedGetAccessToken.mockReturnValue(null);
    mockedGetRefreshToken.mockReturnValue(null);
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
