import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Fuerza en casa",
        short_name: "Fuerza",
        lang: "es",
        start_url: "/",
        display: "standalone",
        background_color: "#f5f2ea",
        theme_color: "#15352f",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }]
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg}"] }
    })
  ]
});
