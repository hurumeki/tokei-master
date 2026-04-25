import { defineConfig } from "vite";

// GitHub Pages: served from /<repo>/ when using project pages.
// Set VITE_BASE in CI to override (e.g. "/tokei-master/").
export default defineConfig(({ mode: _mode }) => ({
  base: process.env.VITE_BASE ?? "/",
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
  },
}));
