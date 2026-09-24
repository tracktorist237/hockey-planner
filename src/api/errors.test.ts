import { apiErrorFromPayload, parseApiError } from "src/api/errors";

test("ProblemDetails retains status, trace and field validation without exposing the payload", async () => {
  const json = jest.fn().mockResolvedValue({
    detail: "Проверьте название.", status: 500, traceId: "request-123",
    errors: { title: ["Название обязательно."] }, extra: "PRIVATE",
  });
  const error = await parseApiError({ status: 400, json } as unknown as Response);
  expect(error).toMatchObject({ name: "ApiError", status: 400, message: "Проверьте название.", traceId: "request-123", errors: { title: ["Название обязательно."] } });
  expect(error.message).not.toContain("PRIVATE");
  expect(json).toHaveBeenCalledTimes(1);
});

test.each(["message", "error", "detail", "title"])("supports legacy %s messages", (key) => {
  expect(apiErrorFromPayload(409, { [key]: "Состав уже изменён." }).message).toBe("Состав уже изменён.");
});

test.each([400, 401, 403, 404, 409, 422, 429, 500, 502, 503])("empty status %i has a useful fallback", (status) => {
  const error = apiErrorFromPayload(status, null);
  expect(error.status).toBe(status);
  expect(error.message).toMatch(/[А-Яа-я]/);
  expect(error.message).not.toMatch(/undefined|HTTP|JSON/);
});

test.each([null, [], "<html>PRIVATE</html>", { message: "<html>PRIVATE</html>" }, { detail: "System.Exception: PRIVATE" }, { error: { message: "PRIVATE" } }])("malformed and diagnostic bodies use the fallback", (payload) => {
  expect(apiErrorFromPayload(400, payload, "Безопасный текст").message).toBe("Безопасный текст");
});

test("server failures never render upstream diagnostics or validation payloads", () => {
  expect(apiErrorFromPayload(500, { detail: "PRIVATE", errors: { field: ["PRIVATE"] }, traceId: "<script>" }))
    .toMatchObject({ errors: {}, traceId: undefined, message: "Не удалось выполнить запрос. Попробуйте позже." });
});

test("non-JSON proxy response does not escape as a parsing error", async () => {
  const response = { status: 502, json: jest.fn().mockRejectedValue(new SyntaxError("PRIVATE")) } as unknown as Response;
  await expect(parseApiError(response)).resolves.toMatchObject({ status: 502, message: "Внешний сервис временно недоступен. Попробуйте позже." });
});

test("validation-only errors provide a useful message", () => {
  expect(apiErrorFromPayload(400, { errors: { name: ["Укажите название."] } }).message).toBe("Укажите название.");
});
