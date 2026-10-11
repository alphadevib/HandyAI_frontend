import react from '@vitejs/plugin-react'
import { copyFileSync, readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/**
 * Every build gets an id and a timestamp. The app is compiled with both, and the same values are
 * published as /version.json, so an open tab can tell when a newer release has been deployed.
 * On Vercel the commit hash makes the id; elsewhere the build time does.
 */
const build = {
  version: pkg.version,
  id: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 12) || `local-${Date.now().toString(36)}`,
  builtAt: new Date().toISOString(),
}

function versionFile() {
  return {
    name: 'handyai-version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(build) })
    },
  }
}

/**
 * Vercel only sends the app shell for real routes (see vercel.json); every other address gets
 * 404.html with a genuine 404 status. That page is the same shell, so the app still renders its
 * own "not found" screen.
 */
function notFoundPage() {
  return {
    name: 'handyai-404-page',
    apply: 'build',
    writeBundle(options) {
      copyFileSync(`${options.dir}/index.html`, `${options.dir}/404.html`)
    },
  }
}

// The dev server proxies /api to Spring Boot, so the browser talks to one origin and the
// production build can be served from anywhere without changing the frontend code.
export default defineConfig({
  plugins: [react(), versionFile(), notFoundPage()],
  define: {
    __APP_BUILD__: JSON.stringify(build),
  },
  server: {
    port: 5173,
    host: true, // reachable from a phone on the same network
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
