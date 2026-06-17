import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Service worker intentionally REMOVED — the previous SW caused a production reload loop
// (build-id mismatch → PRISM_SW_REFRESH → location.reload()). We now actively unregister any
// existing worker and clear its caches so returning visitors are freed immediately. A
// self-destroying /service-worker.js (in public/) handles browsers that update the SW before
// this script runs. Re-introduce a proper PWA (e.g. vite-plugin-pwa) later if offline is needed.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => registration.unregister().catch(() => undefined));
    })
    .catch(() => undefined);

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => keys.forEach((key) => caches.delete(key).catch(() => undefined)))
      .catch(() => undefined);
  }
}
