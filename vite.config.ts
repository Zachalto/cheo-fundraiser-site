import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { event } from "./src/config/event.ts";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Fills %EVENT_NAME% etc. in index.html from the config file, so link previews stay in sync. */
function eventMeta(): Plugin {
  // Link previews need the full address. Use the one in the config, or the one Vercel gives us.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const site = (event.siteUrl ?? (vercel ? `https://${vercel}` : "")).replace(/\/$/, "");
  const tokens: Record<string, string> = {
    EVENT_NAME: event.name,
    EVENT_TAGLINE: event.tagline,
    EVENT_DESCRIPTION: `${event.tagline} A Minute to Win It fundraiser for ${event.charity}, run by the ${event.classCode} class.`,
    SITE_URL: site,
  };
  return {
    name: "event-meta",
    transformIndexHtml: (html) =>
      html.replace(/%([A-Z_]+)%/g, (whole, key: string) =>
        key in tokens ? escapeHtml(tokens[key]) : whole,
      ),
  };
}

export default defineConfig({
  plugins: [react(), eventMeta()],
  // The 3D chunk is big on purpose (physics engine). It loads late and only on capable phones.
  build: { chunkSizeWarningLimit: 3500 },
});
