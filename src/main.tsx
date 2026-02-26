import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const buildId = __APP_BUILD_ID__;
  const buildStorageKey = "botgrid_sw_build_id";
  const swUrl = `/service-worker.js?build=${encodeURIComponent(buildId)}`;

  // Persist current build ID so we can detect and refresh on newer SW activations.
  localStorage.setItem(buildStorageKey, buildId);

  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.update().catch(() => undefined);
    })
    .catch(() => undefined);

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (!event.data || event.data.type !== "BOTGRID_SW_REFRESH") return;

    const incomingBuild = String(event.data.buildId || "");
    if (!incomingBuild) return;

    const previousBuild = localStorage.getItem(buildStorageKey);
    if (previousBuild !== incomingBuild) {
      localStorage.setItem(buildStorageKey, incomingBuild);
      window.location.reload();
    }
  });
}
