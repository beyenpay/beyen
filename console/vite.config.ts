import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    // Mirrors production, where nginx forwards /api to the gateway
    // (port: APP_PORT in gateway/.env).
    proxy: {
      "/api": "http://localhost:8020",
    },
  },
})
