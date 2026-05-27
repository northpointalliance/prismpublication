// Self-unregistering service worker — clears caches and removes itself.
// This file is intentionally a no-op SW that nukes any prior cached state on
// the client. Once browsers fetch this new copy, the old SW (which intercepted
// JS/CSS chunk requests) is replaced, all caches are cleared, and the SW
// unregisters itself so future page loads go straight to the network.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clients.forEach((client) => client.navigate(client.url).catch(() => undefined));
      const registration = self.registration;
      if (registration) {
        await registration.unregister().catch(() => undefined);
      }
    })(),
  );
});
