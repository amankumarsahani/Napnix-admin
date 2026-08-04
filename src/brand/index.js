/**
 * Brand tokens.
 *
 * The concrete brand file is chosen at build time by VITE_BRAND and aliased to
 * `virtual:brand` in vite.config.js, so only one brand's tokens are ever bundled.
 * See nexcrm-agents/shared/whitelabel-execution-plan.md (P0-01, P0-02).
 */
import brandTokens from 'virtual:brand';

/** Ramp steps and how far each is mixed from the base colour. */
const SCALE_MIX = {
    50: ['white', 95],
    100: ['white', 90],
    200: ['white', 75],
    300: ['white', 55],
    400: ['white', 30],
    500: null, // the base colour itself
    600: ['black', 10],
    700: ['black', 22],
    800: ['black', 35],
    900: ['black', 48],
    950: ['black', 65],
};

/**
 * Build a 50-950 ramp from a single hex.
 *
 * Uses CSS color-mix rather than JS colour maths: custom properties are untyped,
 * so the mix resolves at the point of use and composes correctly with Tailwind's
 * own opacity modifiers (which wrap the value in a second color-mix).
 *
 * A brand that needs an exact palette supplies `brandScale` instead and skips this.
 */
function deriveScale(baseHex) {
    const out = {};
    for (const [step, mix] of Object.entries(SCALE_MIX)) {
        out[step] = mix === null
            ? baseHex
            : `color-mix(in oklab, ${baseHex}, ${mix[0]} ${mix[1]}%)`;
    }
    return out;
}

export const brand = Object.freeze({
    ...brandTokens,
    productShortName: brandTokens.productShortName || brandTokens.productName,
    crmProductName: brandTokens.crmProductName || brandTokens.productName,
    mailProductName: brandTokens.mailProductName || brandTokens.productName,
});

/**
 * Write brand tokens onto the document.
 *
 * Must run before first render so the app never paints with default colours and
 * then snap to the brand. Overrides the same `--color-brand-*` / `--color-accent-*`
 * custom properties that index.css declares in its @theme block, which is why no
 * component needs to change: every existing `bg-brand-600` re-themes for free.
 */
export function applyBrand(target = document) {
    const root = target.documentElement;
    const { colors } = brand;

    const brandScale = colors.brandScale || deriveScale(colors.primary);
    for (const [step, value] of Object.entries(brandScale)) {
        root.style.setProperty(`--color-brand-${step}`, value);
    }

    if (colors.accent || colors.accentScale) {
        const accentScale = colors.accentScale || deriveScale(colors.accent);
        for (const [step, value] of Object.entries(accentScale)) {
            root.style.setProperty(`--color-accent-${step}`, value);
        }
    }

    root.style.setProperty('--brand-primary', colors.primary);
    root.style.setProperty('--brand-primary-fg', colors.primaryFg || '#ffffff');
    if (colors.accent) root.style.setProperty('--brand-accent', colors.accent);
    if (colors.sidebar) root.style.setProperty('--brand-sidebar', colors.sidebar);
    if (colors.surface) root.style.setProperty('--brand-surface', colors.surface);
    if (brand.fontFamily) root.style.setProperty('--font-sans', brand.fontFamily);

    target.title = brand.tagline
        ? `${brand.productName} - ${brand.tagline}`
        : brand.productName;

    if (brand.favicon) {
        let link = target.querySelector('link[rel="icon"]');
        if (!link) {
            link = target.createElement('link');
            link.rel = 'icon';
            target.head.appendChild(link);
        }
        link.href = brand.favicon;
    }

    if (brand.customCss) {
        const style = target.createElement('style');
        style.dataset.brand = brand.slug;
        style.textContent = brand.customCss;
        target.head.appendChild(style);
    }
}

export default brand;
