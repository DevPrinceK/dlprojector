import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import packageJson from "../package.json";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  root: fileURLToPath(new URL(".", import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL("../dist-website", import.meta.url)),
    emptyOutDir: true
  },
  server: {
    port: 4321,
    strictPort: true
  },
  preview: {
    port: 4322,
    strictPort: true
  }
});
