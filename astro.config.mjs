// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Landing pages are prerendered (`export const prerender = true`).
// /login, /coach/* and /app/* render on the server so the auth middleware runs on every request.
export default defineConfig({
  site: "https://blado.example.com", // TODO: REEMPLAZAR con el dominio real
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  security: {
    checkOrigin: true,
  },
});
