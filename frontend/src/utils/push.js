import api from "../api/api";

/* =========================
   PUSH NOTIFICATION SETUP (browser side)
   iPhone: works only in the Home Screen app (iOS 16.4+), not in a Safari tab.
========================= */
export const pushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const toUint8 = (base64) => {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const registration = () => navigator.serviceWorker.register("/sw.js");

// "on" | "off" | "blocked" | "unsupported"
export const pushState = async () => {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
};

// Must be called from a tap (browsers only allow the permission prompt then)
export const enablePush = async () => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "blocked" : "dismissed");

  const { data } = await api.get("/push/key");
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8(data.key) }));

  await api.post("/push/subscribe", {
    subscription: sub.toJSON(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

export const disablePush = async () => {
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await api.delete("/push/subscribe", { data: { endpoint: sub.endpoint } }).catch(() => {});
    await sub.unsubscribe();
  }
};
