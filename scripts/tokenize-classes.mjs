// Codemod: replace common slate light/dark class pairs with design tokens (src/index.css).
// Usage: node scripts/tokenize-classes.mjs <file...>   (prints replacements per file; edits in place)
// Review the diff afterwards: it only rewrites known pairs, never coloured/semantic classes.
import { readFileSync, writeFileSync } from 'node:fs';

const D = '(?:/\\d+)?'; // optional opacity suffix
const RULES = [
    // text
    [`text-slate-900 dark:text-(?:white|slate-100)`, 'text-fg'],
    [`text-slate-800 dark:text-(?:white|slate-200|slate-100)`, 'text-fg'],
    [`text-slate-700 dark:text-slate-(?:200|300)`, 'text-fg'],
    [`text-gray-900 dark:text-white`, 'text-fg'],
    [`text-slate-600 dark:text-slate-(?:300|400)`, 'text-fg-muted'],
    [`text-gray-600 dark:text-slate-400`, 'text-fg-muted'],
    [`text-slate-500 dark:text-slate-400`, 'text-fg-muted'],
    [`text-slate-400 dark:text-slate-500`, 'text-fg-subtle'],
    [`text-slate-300 dark:text-slate-600`, 'text-fg-subtle'],
    [`hover:text-slate-(?:600|700|800|900) dark:hover:text-(?:slate-(?:200|300)|white)`, 'hover:text-fg'],
    [`placeholder-slate-400 dark:placeholder-slate-500`, 'placeholder:text-fg-subtle'],
    // surfaces
    [`bg-white dark:bg-slate-(?:700|800|900)${D}`, 'bg-surface'],
    [`bg-slate-50 dark:bg-slate-(?:700|800|900)${D}`, 'bg-surface-2'],
    [`bg-slate-100 dark:bg-slate-(?:700|800)${D}`, 'bg-surface-3'],
    [`bg-slate-200 dark:bg-slate-700${D}`, 'bg-surface-3'],
    [`hover:bg-slate-(?:50|100) dark:hover:bg-slate-(?:700|800)${D}`, 'hover:bg-surface-2'],
    // borders
    [`border-slate-300 dark:border-slate-(?:600|700)`, 'border-border-strong'],
    [`border-slate-(?:100|200) dark:border-slate-(?:600|700|800)${D}`, 'border-border'],
    [`divide-slate-(?:100|200) dark:divide-slate-(?:700|800)${D}`, 'divide-border'],
    // lone light-only greys (no dark: partner): fail contrast in dark mode, and slate-400 fails in light
    [`text-slate-(?:500|600)(?! dark:)`, 'text-fg-muted'],
    [`text-slate-400(?! dark:)`, 'text-fg-subtle'],
    // radius: panels 8px (rounded-xl/2xl were 12/16px)
    [`rounded-(?:xl|2xl)`, 'rounded-md'],
];

let total = 0;
for (const file of process.argv.slice(2)) {
    let src = readFileSync(file, 'utf8');
    const counts = [];
    for (const [pattern, token] of RULES) {
        const re = new RegExp(`(?<![\\w:-])${pattern}(?![\\w/-])`, 'g');
        const n = (src.match(re) || []).length;
        if (n) { src = src.replace(re, token); counts.push(`${token}×${n}`); total += n; }
    }
    writeFileSync(file, src);
    console.log(`${file}: ${counts.join(', ') || 'no changes'}`);
}
console.log(`total replacements: ${total}`);
