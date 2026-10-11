// Checks WCAG contrast of the design-token pairs in src/index.css, in light and dark.
// Usage: node scripts/check-contrast.mjs   (exits 1 if any pair fails)
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const block = sel => Object.fromEntries(
    [...css.match(new RegExp(`${sel}\\s*\\{([^}]*)\\}`))[1].matchAll(/--([\w-]+):\s*oklch\(([^)]*)\)/g)]
        .map(([, name, v]) => [name, v.split('/')[0].trim().split(/\s+/).map(Number)])
);

// OKLCH -> linear sRGB (Björn Ottosson), clamped
function luminance([L, C, h]) {
    const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const rgb = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ].map(c => Math.min(Math.max(c, 0), 1));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
const ratio = (x, y) => {
    const [a, b] = [luminance(x), luminance(y)].sort((p, q) => q - p);
    return (a + 0.05) / (b + 0.05);
};

// [foreground, background, minimum]
const PAIRS = [
    ['fg', 'surface', 4.5], ['fg', 'canvas', 4.5], ['fg', 'surface-2', 4.5],
    ['fg-muted', 'surface', 4.5], ['fg-muted', 'surface-2', 4.5],
    ['fg-subtle', 'surface', 4.5], ['fg-subtle', 'surface-2', 4.5],
    ['accent', 'surface', 4.5], ['accent-fg', 'accent', 4.5], ['accent', 'accent-soft', 4.5],
    ['success', 'surface', 4.5], ['success', 'success-soft', 4.5],
    ['warning', 'surface', 4.5], ['warning', 'warning-soft', 4.5],
    ['danger', 'surface', 4.5], ['danger', 'danger-soft', 4.5],
    ['border-strong', 'surface', 3],
];

let failed = 0;
for (const [theme, tokens] of [['light', block(':root')], ['dark', { ...block(':root'), ...block('\\.dark') }]]) {
    for (const [fg, bg, min] of PAIRS) {
        const r = ratio(tokens[fg], tokens[bg]);
        const ok = r >= min;
        if (!ok) failed++;
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${theme.padEnd(5)} ${fg.padEnd(13)} on ${bg.padEnd(13)} ${r.toFixed(2)} (min ${min})`);
    }
}
process.exit(failed ? 1 : 0);
