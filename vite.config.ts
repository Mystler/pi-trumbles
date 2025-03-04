import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  build: {
    sourcemap: true,
    lib: {
      entry: "src/main.ts",
      name: "trumbles",
      fileName: "trumbles",
      formats: ["es"],
    },
  },
});
