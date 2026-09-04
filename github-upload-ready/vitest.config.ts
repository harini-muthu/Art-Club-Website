import { configDefaults, defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "github-upload-ready/**"],
    globals: true,
    setupFiles: ["./vitest.setup.ts"]
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "@supabase/ssr": fileURLToPath(
        new URL("./test-stubs/supabase-ssr.ts", import.meta.url)
      )
    }
  }
});
