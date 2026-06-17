// Self-destroying service worker.
//
// The previous setup caused a production reload loop: the app re-registered this SW on every load,
// it activated, force-navigated the page (reload), which re-registered it again — looping forever and
// spiking Edge Function requests. The app no longer registers any SW (see src/main.tsx). This file is
// kept ONLY to clean up browsers that still have the old worker: on activation it clears all caches and
// unregisters itself. It does NOT navigate/reload, so it cannot drive a loop.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (_e) {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch (_e) {
        /* ignore */
      }
    })(),
  );
});
