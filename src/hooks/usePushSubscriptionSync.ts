import { useEffect } from "react";
import { getPushPublicKey, subscribePush } from "src/api/push";
import { SW_KILL_SWITCH_APPLIED_KEY } from "src/serviceWorkerRegistration";

const base64UrlToUint8Array = (value: string): Uint8Array => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
};

const buildDeviceName = () => (navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop");

export function usePushSubscriptionSync(currentUserId?: string | null) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !currentUserId || typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      if (window.localStorage.getItem(SW_KILL_SWITCH_APPLIED_KEY) === "true") {
        return;
      }
    } catch {
      return;
    }

    let isCancelled = false;

    const syncPushSubscription = async () => {
      try {
        const vapidPublicKey = await getPushPublicKey();
        if (isCancelled) return;

        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/service-worker.js`);
        }
        if (isCancelled) return;

        const subscription =
          (await registration.pushManager.getSubscription()) ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
          }));
        if (isCancelled) return;

        const subscriptionJson = subscription.toJSON();
        const p256dh = subscriptionJson.keys?.p256dh;
        const auth = subscriptionJson.keys?.auth;

        if (!p256dh || !auth) {
          return;
        }

        await subscribePush({
          endpoint: subscription.endpoint,
          keys: { p256dh, auth },
          userId: currentUserId,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          deviceName: buildDeviceName(),
        });
      } catch (error) {
        console.warn("Push subscription sync failed:", error);
      }
    };

    void syncPushSubscription();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId]);
}
