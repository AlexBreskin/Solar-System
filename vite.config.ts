import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: '/Solar-System/',
  test: {
    globals: true,
    environment: "jsdom",
  },
});
