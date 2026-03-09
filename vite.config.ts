import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 10001,
    strictPort: true,
  },
  preview: {
    port: 10001,
    strictPort: true,
  },
});
