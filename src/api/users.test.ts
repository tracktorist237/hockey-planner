import { authFetch } from "src/api/auth";
import {
  getUserById,
  getUserPrivacySettings,
  getUsers,
  updateUserPrivacySettings,
  UserDataVisibility,
  UserPrivacySettings,
} from "src/api/users";

jest.mock("src/api/auth", () => ({
  authFetch: jest.fn(),
}));

const mockedAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

const createResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as Response;

const userId = "11111111-1111-1111-1111-111111111111";
const viewerUserId = "22222222-2222-2222-2222-222222222222";
const teamId = "33333333-3333-3333-3333-333333333333";

const privacySettings: UserPrivacySettings = {
  userId,
  emailVisibility: UserDataVisibility.Teammates,
  phoneVisibility: UserDataVisibility.TeamAdmins,
  birthDateVisibility: UserDataVisibility.Teammates,
  physicalVisibility: UserDataVisibility.Teammates,
  hockeyProfileVisibility: UserDataVisibility.Teammates,
  spbhlProfileVisibility: UserDataVisibility.Teammates,
};

beforeEach(() => {
  mockedAuthFetch.mockReset();
});

test("getUsers uses authFetch with the relative directory URL", async () => {
  const body = [{ id: userId, photoUrl: null, primaryPosition: 1 }];
  mockedAuthFetch.mockResolvedValue(createResponse(body));

  await expect(getUsers()).resolves.toEqual(body);

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/Users");
});

test("getUserById uses optional authFetch and preserves profile context", async () => {
  const body = { id: userId, firstName: "Test", lastName: "User" };
  mockedAuthFetch.mockResolvedValue(createResponse(body));

  await expect(
    getUserById(userId, { currentUserId: viewerUserId, teamId }),
  ).resolves.toEqual(body);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/Users/${userId}?currentUserId=${viewerUserId}&teamId=${teamId}`,
  );
});

test("getUserPrivacySettings uses authFetch and preserves currentUserId", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse(privacySettings));

  await expect(getUserPrivacySettings(userId, viewerUserId)).resolves.toEqual(privacySettings);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/Users/${userId}/privacy-settings?currentUserId=${viewerUserId}`,
  );
});

test("updateUserPrivacySettings preserves authFetch URL, method, headers and body", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse(privacySettings));

  await expect(
    updateUserPrivacySettings(userId, viewerUserId, privacySettings),
  ).resolves.toEqual(privacySettings);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/Users/${userId}/privacy-settings?currentUserId=${viewerUserId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(privacySettings),
    },
  );
});
