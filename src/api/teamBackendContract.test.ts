import contract from "./__fixtures__/api-contract.generated.json";
import { getTeam, getTeamMembers, getTeamNews, updateTeam, createTeam, TeamsApiError } from "./teams";

const originalFetch = global.fetch;
const fetchMock = jest.fn();
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset(); });
afterEach(() => { global.fetch = originalFetch; });
const reply = ({ status, body }: { status: number; body: unknown }) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

test("real TeamDto and TeamMemberDto preserve numeric roles, nullable fields and arrays", async () => {
  fetchMock.mockResolvedValueOnce(reply(contract.team)).mockResolvedValueOnce(reply(contract.teamMembers));
  const team = await getTeam("team", "actor");
  expect(team).toEqual(contract.team.body);
  expect(team).toMatchObject({ visibility: 2, myRole: 1, myBadgeTitle: null, myTeamJerseyNumber: null,
    phones: [], links: [], addresses: [], blockedJerseyNumbers: [], inviteCode: "CONTRACT", membersCount: 1 });
  const members = await getTeamMembers(team.id);
  expect(members).toEqual(contract.teamMembers.body);
  expect(members[0]).toMatchObject({ userId: team.createdByUserId, role: 1, badgeTitle: null, teamJerseyNumber: null });
});

test("real TeamNewsDto preserves ownership, management flag and serialized dates", async () => {
  fetchMock.mockResolvedValue(reply(contract.teamNews));
  const news = await getTeamNews("team", "actor");
  expect(news).toEqual(contract.teamNews.body);
  expect(news[0]).toMatchObject({ title: "Contract news", canManage: true, imageUrl: null,
    teamId: contract.team.body.id, authorUserId: contract.team.body.createdByUserId });
  expect(new Date(news[0].createdAt).toISOString()).toBe("2030-01-15T18:00:00.000Z");
});

test.each(["teamBadRequest", "unauthorized", "teamForbidden", "teamNotFound", "teamConflict"] as const)(
  "real %s retains TeamsApiError status and human detail", async name => {
    const entry = contract[name];
    fetchMock.mockResolvedValue(reply(entry));
    // 401 is the existing authentication HTTP contract: legacy team actions do not issue it.
    const pending = name === "teamConflict" ? createTeam({ name: "Contract team", visibility: 2 }, "actor")
      : name === "teamForbidden" ? updateTeam("team", { name: "Contract team", visibility: 2, allowDuplicateJerseyNumbers: true, blockedJerseyNumbers: [] }, "actor")
        : getTeam("team", "actor");
    const error = await pending.catch(value => value);
    expect(error).toBeInstanceOf(TeamsApiError);
    expect(error).toMatchObject({ status: entry.status, message: entry.body.detail });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  },
);
