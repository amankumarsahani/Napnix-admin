import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

/**
 * Substitute brand tokens into index.html.
 *
 * applyBrand() already fixes the title and favicon at runtime, but the raw HTML
 * still ships whatever is written in the file - visible in view-source and as a
 * flash of the wrong favicon before JS runs. Both are brand leaks on a partner
 * build, so the shell is templated too.
 */
function brandHtmlPlugin(brand) {
  return {
    name: 'brand-html',
    transformIndexHtml: {
      // Must run before vite:build-html, which calls decodeURI() on href
      // attributes and would choke on the %...% placeholders.
      order: 'pre',
      handler(html) {
        const title = brand.tagline
          ? `${brand.productName} - ${brand.tagline}`
          : brand.productName
        return html
          .replace(/%BRAND_NAME%/g, title)
          .replace(/%BRAND_FAVICON%/g, brand.favicon || '/favicon.svg')
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Resolve the brand token file at config time and alias it to `virtual:brand`.
  // Doing it here rather than with import.meta.glob matters: a glob would bundle
  // every brand's tokens into every build, so a partner bundle would ship Napnix
  // strings. This way exactly one brand file ends up in the output.
  const brandSlug = env.VITE_BRAND || 'napnix'
  const brandFile = fileURLToPath(new URL(`./brands/${brandSlug}.json`, import.meta.url))
  if (!existsSync(brandFile)) {
    throw new Error(`[brand] VITE_BRAND="${brandSlug}" but brands/${brandSlug}.json does not exist`)
  }

  const edition = env.VITE_EDITION || 'napnix'
  if (!['napnix', 'whitelabel'].includes(edition)) {
    throw new Error(`[edition] VITE_EDITION must be "napnix" or "whitelabel", got "${edition}"`)
  }

  const brand = JSON.parse(readFileSync(brandFile, 'utf-8'))
  console.log(`[build] brand=${brandSlug} edition=${edition}`)

  return {
    plugins: [react(), brandHtmlPlugin(brand)],
    base: '/', // For custom domain deployment
    resolve: {
      alias: {
        'virtual:brand': brandFile,
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
