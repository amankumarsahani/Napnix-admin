/**
 * Edition gating for the admin panel.
 *
 * Mirrors nexs-backend/config/edition.js. Selected at build time by VITE_EDITION:
 *
 *   full       - the complete panel
 *   whitelabel - a partner instance: control plane only
 *
 * Excluded pages are dropped from the route table *and* their React.lazy imports,
 * so Vite never emits those chunks. Hiding a nav item is not enough - the bundle
 * itself must not contain our agency screens.
 *
 * See nexcrm-agents/shared/whitelabel-execution-plan.md (P0-08).
 */
import { AGENCY_ONLY_PATHS, INFRA_DETAIL_PATHS } from './editionPaths';

const EDITIONS = ['full', 'whitelabel'];

export const EDITION = import.meta.env.VITE_EDITION || 'full';

if (!EDITIONS.includes(EDITION)) {
    throw new Error(`VITE_EDITION must be one of ${EDITIONS.join(', ')} - got "${EDITION}"`);
}

export const isFullEdition = EDITION === 'full';
export const isWhitelabelEdition = EDITION === 'whitelabel';

/**
 * Optional add-ons a partner can buy. On in the full edition, off for a partner unless the
 * build sets the flag. Decision D4 in the plan is still open, and answering it
 * must not require a code change.
 *
 * Each flag is its own top-level const rather than a property on an object.
 * Rollup can constant-fold a bare identifier and drop the guarded import(), but
 * it cannot fold `features.napmail`, so the object form left every NapMail and
 * WhatsApp chunk in the partner bundle. The `features` object below is kept for
 * readable runtime checks only - never use it to guard a lazy import.
 */
export const FEATURE_NAPMAIL = import.meta.env.VITE_FEATURE_NAPMAIL === undefined
    ? isFullEdition
    : (import.meta.env.VITE_FEATURE_NAPMAIL === 'true' || import.meta.env.VITE_FEATURE_NAPMAIL === '1');

export const FEATURE_WHATSAPP = import.meta.env.VITE_FEATURE_WHATSAPP === undefined
    ? isFullEdition
    : (import.meta.env.VITE_FEATURE_WHATSAPP === 'true' || import.meta.env.VITE_FEATURE_WHATSAPP === '1');

export const FEATURE_NAPLEAD = import.meta.env.VITE_FEATURE_NAPLEAD === undefined
    ? isFullEdition
    : (import.meta.env.VITE_FEATURE_NAPLEAD === 'true' || import.meta.env.VITE_FEATURE_NAPLEAD === '1');

export const features = {
    napmail: FEATURE_NAPMAIL,
    whatsapp: FEATURE_WHATSAPP,
    naplead: FEATURE_NAPLEAD,
};

/**
 * Tenant infrastructure internals (process name, port, DB name, raw PM2 logs).
 * Withheld from partner builds because those logs still carry our platform naming
 * and server paths - decision D3, revisit after task P5-04 scrubs them.
 */
export const showInfraDetail = isFullEdition;

export { AGENCY_ONLY_PATHS, INFRA_DETAIL_PATHS };
