import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_BUILD_ID__: JSON.stringify(process.env.VITE_APP_BUILD_ID || Date.now().toString()),
  },
  server: {
    host: "::",
    port: 5173,
    // Required when serving dev server through Cloudflare Tunnel/custom hostnames.
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/sitemap.xml": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "ui-vendor": ["lucide-react"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@prismpublication/sdk/react": path.resolve(__dirname, "./packages/sdk/dist/react.mjs"),
      "@prismpublication/sdk": path.resolve(__dirname, "./packages/sdk/dist/index.mjs"),
    },
  },
}));
