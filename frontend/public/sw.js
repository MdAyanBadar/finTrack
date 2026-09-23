/* FinTrack service worker
   - push notifications
   - enough caching that the app opens without a connection
   API responses are NOT cached here; the app keeps its own copy of your data
   (see api/persist.js), so it can show the last known numbers offline. */

const CACHE = "fintrack-v2";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/apple-touch-icon.png", "/favicon.png"];

// Store the page and every build file it references, so a cold offline start works
const cachePage = async (html, response) => {
  const cache = await caches.open(CACHE);
  await cache.put("/", new Response(html, { headers: response.headers }));
  const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  await Promise.all(urls.map((u) => cache.add(u).catch(() => {})));
};

const precache = async () => {
  const cache = await caches.open(CACHE);
  await Promise.all(SHELL.map((u) => cache.add(u).catch(() => {})));
  const res = await fetch("/", { cache: "reload" });
  await cachePage(await res.clone().text(), res);
};

self.addEventListener("install", (event) => {
  event.waitUntil(precache().catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

const isAsset = (url) => url.pathname.startsWith("/assets/") || /\.(png|svg|webmanifest|woff2?)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // API and fonts: straight to the network

  // Pages: fresh when online, last copy when not
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Keep the offline copy (and its build files) up to date
          res.clone().text().then((html) => cachePage(html, res)).catch(() => {});
          return res;
        })
        .catch(async () => (await caches.match("/", { ignoreVary: true })) || (await caches.match(request, { ignoreVary: true })))
    );
    return;
  }

  // Build files have hashed names, so a cached one is never stale.
  // ignoreVary: the stored copy may carry a Vary header from the server.
  if (isAsset(url)) {
    event.respondWith(
      (async () => {
        const hit =
          (await caches.match(request, { ignoreVary: true })) ||
          (await caches.match(url.pathname, { ignoreVary: true }));
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })()
    );
  }
});

/* =========================
   PUSH NOTIFICATIONS
========================= */
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
