import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  base: "/Solar-System/",
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/setupTests.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/__tests__/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        // Covered by Cypress E2E, not unit tests
        "src/App.tsx",
        "src/index.tsx",
        "src/components/**",
        "src/shared/**",
        "src/renderers/**",
      ],
      thresholds: { lines: 0, functions: 0, branches: 0, statements: 0 },
    },
  },
});
