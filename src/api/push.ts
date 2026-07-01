import { authFetch } from "src/api/auth";
import { buildApiUrl } from "src/api/client";

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string | null;
  userAgent?: string;
  platform?: string;
  deviceName?: string;
}

export interface PushBroadcastPayload {
  title: string;
  body: string;
  url?: string;
}

export interface PushBroadcastResult {
  success: boolean;
  total: number;
  sent: number;
  removed: number;
}

export const getPushPublicKey = async (): Promise<string> => {
  const response = await fetch(buildApiUrl("/api/push/public-key"));
  if (!response.ok) {
    throw new Error(`Не удалось получить VAPID ключ: ${response.status}`);
  }

  const data = (await response.json()) as { publicKey?: string };
  if (!data.publicKey) {
    throw new Error("Пустой VAPID public key");
  }

  return data.publicKey;
};

export const subscribePush = async (payload: PushSubscriptionPayload): Promise<void> => {
  const response = await fetch(buildApiUrl("/api/push/subscribe"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Ошибка подписки на push-уведомления");
  }
};

export const unsubscribePush = async (endpoint: string): Promise<void> => {
  const response = await fetch(buildApiUrl("/api/push/unsubscribe"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Ошибка отписки от push-уведомлений");
  }
};

export const broadcastPush = async (
  payload: PushBroadcastPayload,
): Promise<PushBroadcastResult> => {
  const response = await authFetch("/api/push/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Ошибка отправки push-уведомления");
  }

  return (await response.json()) as PushBroadcastResult;
};
