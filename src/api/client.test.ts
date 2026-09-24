import { apiGet } from "src/api/client";
import { getTeam, TeamsApiError } from "src/api/teams";

const response = (status: number, body: unknown) => ({
  status, ok: status < 400, json: jest.fn().mockResolvedValue(body),
}) as unknown as Response;

test("public apiGet rejects HTTP errors instead of treating them as success data", async () => {
  global.fetch = jest.fn().mockResolvedValue(response(404, { detail: "Страница не найдена.", traceId: "public-123" }));
  await expect(apiGet("/api/missing")).rejects.toMatchObject({ status: 404, message: "Страница не найдена.", traceId: "public-123" });
});

test("team access errors keep the specialized status used by team screens", async () => {
  global.fetch = jest.fn().mockResolvedValue(response(403, { detail: "Нет доступа к команде." }));
  await expect(getTeam("team")).rejects.toBeInstanceOf(TeamsApiError);
  await expect(getTeam("team")).rejects.toMatchObject({ status: 403, message: "Нет доступа к команде." });
});

test("successful public JSON is unchanged", async () => {
  global.fetch = jest.fn().mockResolvedValue(response(200, { name: "Team" }));
  await expect(apiGet("/api/public")).resolves.toEqual({ name: "Team" });
});
