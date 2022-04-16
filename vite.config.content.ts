import { defineConfig } from "vite";
import { sharedConfig } from "./vite.config";
import { r, isDev } from "./scripts/utils";
import packageJson from "./package.json";
import { visualizer } from "rollup-plugin-visualizer";

// bundling the content script using Vite
export default defineConfig({
    ...sharedConfig,
    build: {
        watch: isDev ? {} : undefined,
        outDir: r("extension/dist/contentScripts"),
        cssCodeSplit: false,
        emptyOutDir: false,
        sourcemap: isDev ? "inline" : false,
        lib: {
            entry: r("src/contentScripts/index.module.ts"),
            name: packageJson.name,
            formats: ["iife"],
        },
        rollupOptions: {
            output: {
                entryFileNames: "index.js",
                extend: true,
            },
        },
    },
    plugins: [...sharedConfig.plugins!, visualizer()]
});
