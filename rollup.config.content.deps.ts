import { isDev } from "./scripts/utils";
import type { RollupOptions } from "rollup";
import nodeResolvePlugin from "@rollup/plugin-node-resolve";
import commonJSPlugin from "@rollup/plugin-commonjs";
import packageJson from "./package.json";
import { readFile } from "fs/promises";
import { join } from "path";

// For a given package name, return the path to the module JavaScript file (listed in the package.json module property)
async function findPackageJSPath(packageName: string) {
  const packageJsonPath = `node_modules/${packageName}/package.json`;
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const modulePath = packageJson.module ?? packageJson.main;
  console.log(`Found ${packageName} at ${modulePath}`);
  if(!modulePath) return undefined;
  return join("node_modules", packageName, modulePath);
}

const getConfig: () => Promise<RollupOptions> = async () => {
    const input = Object.fromEntries((await Promise.all(
        Object.keys(packageJson.dependencies).map(async (packageName) => [packageName, await findPackageJSPath(packageName)])
    )).filter(([, path]) => path !== undefined));

    return {
        // input: "src/contentScripts/index.ts",
        input,
        output: {
            dir: "extension/dist/contentScripts/modules/",
            format: "systemjs",
            generatedCode: "es2015",
            sourcemap: isDev
        },
        // manualChunks: {
        //     "deps": Object.entries(input).map(([packageName]) => packageName)
        // },
        plugins: [
            nodeResolvePlugin(),
            commonJSPlugin()
        ],
        watch: {
            include: "./package.json"
        }
    }
};

export default getConfig();