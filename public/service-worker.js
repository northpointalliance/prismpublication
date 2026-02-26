(() => {
  const url = new URL(self.location.href);
  const buildId = url.searchParams.get("build") || "dev";
  const runtimeCacheName = `botgrid-runtime-${buildId}`;

  self.addEventListener("install", () => {
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key !== runtimeCacheName)
            .map((key) => caches.delete(key)),
        );

        await self.clients.claim();

        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        clients.forEach((client) => {
          client.postMessage({
            type: "BOTGRID_SW_REFRESH",
            buildId,
          });
        });
      })(),
    );
  });

  self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== self.location.origin) return;
    if (requestUrl.pathname.startsWith("/api/")) return;
    if (request.headers.has("authorization")) return;

    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request, { cache: "no-store" });
          const cache = await caches.open(runtimeCacheName);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (_err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          throw _err;
        }
      })(),
    );
  });
})();
