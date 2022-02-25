import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { isDev, port, r } from '../scripts/utils'
import { readdir, stat } from "fs/promises";

// Recursively get all files in a directory
async function getDirectoryFiles(path: string): Promise<string[]> {
  const files = await readdir(path)
  const paths = await Promise.all(files.map(async (file) => {
    const filePath = `${path}/${file}`
    const stats = await stat(filePath)
    if (stats.isDirectory()) {
      return getDirectoryFiles(filePath)
    } else {
      return filePath
    }
  }));
  return paths.flat()
}

export async function getManifest() {
  const pkg = await fs.readJSON(r('package.json')) as typeof PkgType

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 2,
    name: pkg.displayName || pkg.name,
    version: pkg.version,
    description: pkg.description,
    browser_action: {
      default_icon: './assets/icon-512.png',
      default_popup: './dist/popup/index.html',
    },
    options_ui: {
      page: './dist/options/index.html',
      open_in_tab: true,
      chrome_style: false,
    },
    background: {
      page: './dist/background/index.html',
      persistent: false,
    },
    icons: {
      16: './assets/icon-512.png',
      48: './assets/icon-512.png',
      128: './assets/icon-512.png',
    },
    permissions: [
      'storage',
      'http://*/',
      'https://*/',
    ],
    content_scripts: [{
      matches: ['http://*/*', 'https://*/*'],
      js: ['./assets/index.js'],
    }],
    // web_accessible_resources: (await getDirectoryFiles("extension/dist/contentScripts")).filter(p => p.endsWith(".js")).map(p => "./" + p.replace("extension/", "")),
    browser_specific_settings: {
      gecko: {
        id: "bandcamp@benjaminsmith.dev"
      }
    }
  }

  if (isDev) {
    // for content script, as browsers will cache them for each reload,
    // we use a background script to always inject the latest version
    // see src/background/contentScriptHMR.ts
    // delete manifest.content_scripts
    manifest.permissions?.push('webNavigation')

    // this is required on dev for Vite script to load
    manifest.content_security_policy = `script-src \'self\' http://localhost:${port}; object-src \'self\'`
  }

  return manifest
}
