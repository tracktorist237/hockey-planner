import { authFetch } from "src/api/auth";
import {
  broadcastPush,
  getPushPublicKey,
  PushSubscriptionPayload,
  subscribePush,
  unsubscribePush,
} from "src/api/push";

jest.mock("src/api/auth", () => ({
  authFetch: jest.fn(),
}));

const mockedAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;
const mockedFetch = jest.fn();

const createResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  }) as unknown as Response;

const subscription: PushSubscriptionPayload = {
  endpoint: "https://push.test/subscription",
  keys: {
    p256dh: "p256dh-key",
    auth: "auth-key",
  },
  userAgent: "Test browser",
  platform: "test",
  deviceName: "Test device",
};

beforeEach(() => {
  mockedAuthFetch.mockReset();
  mockedFetch.mockReset();
  global.fetch = mockedFetch as unknown as typeof fetch;
});

test("getPushPublicKey remains an anonymous fetch", async () => {
  mockedFetch.mockResolvedValue(createResponse({ publicKey: "vapid-public-key" }));

  await expect(getPushPublicKey()).resolves.toBe("vapid-public-key");

  expect(mockedFetch).toHaveBeenCalledWith("/api/push/public-key");
  expect(mockedAuthFetch).not.toHaveBeenCalled();
});

test("subscribePush uses authFetch and sends no client-controlled userId", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse({ success: true }));

  await subscribePush(subscription);

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  expect(JSON.parse(mockedAuthFetch.mock.calls[0][1]?.body as string)).not.toHaveProperty("userId");
});

test("unsubscribePush uses authFetch and preserves endpoint payload", async () => {
  mockedAuthFetch.mockResolvedValue(createResponse({ success: true }));

  await unsubscribePush(subscription.endpoint);

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
});

test("broadcastPush keeps its existing authFetch transport", async () => {
  const payload = { title: "Update", body: "Available", url: "/events" };
  const result = { success: true, total: 1, sent: 1, removed: 0 };
  mockedAuthFetch.mockResolvedValue(createResponse(result));

  await expect(broadcastPush(payload)).resolves.toEqual(result);

  expect(mockedAuthFetch).toHaveBeenCalledWith("/api/push/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
});
