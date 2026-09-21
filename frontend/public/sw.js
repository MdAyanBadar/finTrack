/* FinTrack service worker: push notifications only (no offline caching,
   so a new deploy is always picked up straight away). */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "FinTrack", body: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "FinTrack", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    })
  );
});

// Open (or focus) the app on the right page when a notification is tapped
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const win = wins.find((w) => w.url.startsWith(self.location.origin));
      if (win) {
        win.navigate(url);
        return win.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
