import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

/**
 * Substitute brand tokens into index.html.
 *
 * applyBrand() already fixes the title and favicon at runtime, but the raw HTML
 * still ships whatever is written in the file - visible in view-source and as a
 * flash of the wrong favicon before JS runs. Both are brand leaks on a partner
 * build, so the shell is templated too.
 */
/**
 * Emit the deploy-time static files from brand tokens rather than shipping them
 * from public/.
 *
 * public/404.html and public/CNAME were copied verbatim into every build, so a
 * partner bundle carried our page title and, worse, a CNAME claiming
 * admin.napnix.in on their Pages project. Neither file is reachable by
 * transformIndexHtml, which is why they survived the brand work in P0.
 */
function brandStaticFilesPlugin(brand, outDir) {
  return {
    name: 'brand-static-files',
    apply: 'build',
    closeBundle() {
      const dist = resolve(process.cwd(), outDir)

      // The SPA fallback is the built index, so it inherits the brand automatically.
      const index = join(dist, 'index.html')
      if (existsSync(index)) {
        writeFileSync(join(dist, '404.html'), readFileSync(index))
      }

      // Only meaningful for GitHub Pages; Cloudflare Pages ignores it. Emitted per
      // brand so it can never point a partner deploy at our hostname.
      const adminDomain = brand.adminDomain || `admin.${brand.baseDomain}`
      writeFileSync(join(dist, 'CNAME'), `${adminDomain}\n`)
    },
  }
}

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

  // Must match src/config/edition.js. These were renamed from 'napnix' to 'full'
  // in P0-08 and this copy was missed, so an explicit VITE_EDITION=full threw.
  const edition = env.VITE_EDITION || 'full'
  if (!['full', 'whitelabel'].includes(edition)) {
    throw new Error(`[edition] VITE_EDITION must be "full" or "whitelabel", got "${edition}"`)
  }

  const brand = JSON.parse(readFileSync(brandFile, 'utf-8'))
  console.log(`[build] brand=${brandSlug} edition=${edition}`)

  return {
    plugins: [react(), brandHtmlPlugin(brand), brandStaticFilesPlugin(brand, 'dist')],
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
