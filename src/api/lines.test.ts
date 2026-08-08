import { authFetch } from "src/api/auth";
import { createLineRoster, deleteLineRoster, updateLineRoster } from "src/api/lines";
import { CreateUpdateRosterRequest, PlayerRole } from "src/types/lines";

jest.mock("src/api/auth", () => ({
  authFetch: jest.fn(),
}));

const mockedAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

const createResponse = (status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(null),
  }) as unknown as Response;

const eventId = "11111111-1111-1111-1111-111111111111";
const currentUserId = "22222222-2222-2222-2222-222222222222";

const rosterRequest: CreateUpdateRosterRequest = {
  eventId,
  lines: [
    {
      name: "First line",
      order: 1,
      uniformColorId: null,
      players: [
        {
          userId: currentUserId,
          role: PlayerRole.Center,
        },
      ],
    },
  ],
};

beforeEach(() => {
  mockedAuthFetch.mockReset();
});

test("createLineRoster uses authFetch and preserves its transport contract", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse(201));

  await createLineRoster(rosterRequest, currentUserId);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/lines?currentUserId=${currentUserId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rosterRequest),
    },
  );
});

test("updateLineRoster uses authFetch and preserves its transport contract", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse(201));

  await updateLineRoster(rosterRequest, currentUserId);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/lines?currentUserId=${currentUserId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rosterRequest),
    },
  );
});

test("deleteLineRoster uses authFetch and preserves its transport contract", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse(201));

  await deleteLineRoster(eventId, currentUserId);

  expect(mockedAuthFetch).toHaveBeenCalledWith(
    `/api/lines?eventId=${eventId}&currentUserId=${currentUserId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
});
