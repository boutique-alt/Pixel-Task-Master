import { supabase } from "./supabase";

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLqv0Sr2PPyu7ZJRq35gkqE0ba6XXnVvyRUH2UmnTcffwQITvz5SSCuHyHUTyqK9DdoQbl2B89eu1XrJjAF_H3A";

/**
 * Utility to convert base64 url-safe string to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if Push Notifications and Service Workers are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get current system notification permission
 */
export function getNotificationPermissionStatus(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Subscribe device to Web Push notifications so alerts arrive even when app is closed
 */
export async function subscribeToPushNotifications(user?: {
  name?: string;
  phone?: string;
  role?: string;
}): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: "Push notifications are not supported on this browser/device." };
  }

  try {
    // 1. Request native permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission was not granted." };
    }

    // 2. Ensure Service Worker is registered
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    // 3. Subscribe or get existing push subscription
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    if (!subscription) {
      return { success: false, error: "Could not create push subscription." };
    }

    // 4. Save subscription to Cloud (office_rules with category 'Push_Subscription')
    const subJson = subscription.toJSON();
    const endpointHash = btoa(subscription.endpoint.slice(-32))
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 32);
    const subRecordId = `psub_${endpointHash}`;

    const subPayload = {
      endpoint: subscription.endpoint,
      keys: subJson.keys,
      memberName: user?.name || "Team Member",
      phone: user?.phone || "",
      role: user?.role || "member",
      updatedAt: new Date().toISOString(),
    };

    // Save directly to Supabase
    try {
      await supabase.from("office_rules").upsert({
        id: subRecordId,
        category: "Push_Subscription",
        title: user?.name || "Push Subscriber",
        description: JSON.stringify(subPayload),
      });
    } catch (e) {
      console.warn("Direct push subscription DB save fallback:", e);
    }

    // Also call server API endpoint
    try {
      await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subRecordId,
          ...subPayload,
        }),
      });
    } catch (apiErr) {
      // non-fatal
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("ptm_push_registered", "true");
    }

    return { success: true, subscription };
  } catch (err: any) {
    console.error("Push registration error:", err);
    return { success: false, error: err?.message || "Failed to enable background notifications." };
  }
}
