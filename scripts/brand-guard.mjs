#!/usr/bin/env node
/**
 * Brand guard.
 *
 * Fails if a platform brand string appears anywhere it would ship to a partner
 * build. Without this, brand strings creep back in during normal feature work and
 * the next partner deploy leaks them - see the P2-09 audit in
 * nexcrm-agents/shared/whitelabel-execution-plan.md.
 *
 * Usage: node scripts/brand-guard.mjs [--fix-hint]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();

/** Directories scanned. Everything shipped to the browser. */
const SCAN_DIRS = ['src'];

/** Files scanned individually. */
const SCAN_FILES = ['index.html'];

/**
 * Paths exempt from the guard. Keep this list short and justified - every entry is
 * a place a brand string is allowed to live, which is a place one can hide.
 */
const BASE_ALLOWLIST = [
    'brands',                       // brand token files - the whole point
    'scripts/brand-guard.mjs',      // this file names the patterns it bans
    'src/config/editionPaths.js',   // names the excluded trees, in comments
];

/**
 * Pages excluded from whitelabel builds are also exempt: they are never bundled for
 * a partner, so a brand string there cannot leak. The list is imported rather than
 * restated so the guard and the router can never disagree about what ships.
 */
async function loadEditionAllowlist() {
    try {
        const mod = await import(
            new URL('../src/config/editionPaths.js', import.meta.url).href
        );
        return (mod.WHITELABEL_EXCLUDED_PATHS || []).map((p) => `src/${p}`);
    } catch {
        return []; // repo has no edition config; guard everything
    }
}

const ALLOWLIST = [...BASE_ALLOWLIST, ...(await loadEditionAllowlist())];

const BANNED = /NexCRM|NapCRM|Napnix|NAPNIX|napnix\.in|nexcrm\.|Nexspire/;

const TEXT_EXT = /\.(js|jsx|ts|tsx|css|html|json|md|svg)$/;

function isAllowed(rel) {
    const norm = rel.split(sep).join('/');
    return ALLOWLIST.some((a) => norm === a || norm.startsWith(`${a}/`));
}

function walk(dir, out = []) {
    let entries;
    try {
        entries = readdirSync(dir);
    } catch {
        return out;
    }
    for (const entry of entries) {
        if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
        const full = join(dir, entry);
        const rel = relative(ROOT, full);
        if (isAllowed(rel)) continue;
        if (statSync(full).isDirectory()) walk(full, out);
        else if (TEXT_EXT.test(entry)) out.push(full);
    }
    return out;
}

const files = [];
for (const dir of SCAN_DIRS) files.push(...walk(join(ROOT, dir)));
for (const file of SCAN_FILES) {
    const full = join(ROOT, file);
    try {
        statSync(full);
        files.push(full);
    } catch { /* file not present in this repo */ }
}

const violations = [];
for (const file of files) {
    const lines = readFileSync(file, 'utf-8').split('\n');
    lines.forEach((line, i) => {
        const match = line.match(BANNED);
        if (match) {
            violations.push({
                file: relative(ROOT, file).split(sep).join('/'),
                line: i + 1,
                text: line.trim().slice(0, 140),
                match: match[0],
            });
        }
    });
}

if (violations.length === 0) {
    console.log(`brand-guard: clean (${files.length} files scanned)`);
    process.exit(0);
}

console.error(`\nbrand-guard: ${violations.length} platform brand string(s) found in shipped code.\n`);
for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.match}]`);
    console.error(`      ${v.text}`);
}
console.error(`
Replace hardcoded brand strings with tokens from the brand module:

    import { brand } from '<path>/brand';
    brand.productName      // "NapCRM"
    brand.productShortName
    brand.baseDomain       // "napnix.in"
    brand.supportEmail

If a string genuinely must stay, add its path to ALLOWLIST in scripts/brand-guard.mjs
and say why in the commit message.
`);
process.exit(1);
