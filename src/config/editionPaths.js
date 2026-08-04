/**
 * Which page trees belong to which edition.
 *
 * Single source of truth, deliberately dependency-free so it can be imported both
 * by the app (src/config/edition.js) and by plain Node tooling
 * (scripts/brand-guard.mjs). The plan calls for one list, not two that drift -
 * see P0-06 and P0-08 in nexcrm-agents/shared/whitelabel-execution-plan.md.
 *
 * Paths are src-relative prefixes.
 */

/**
 * Agency-operations surfaces. These are our own business - our CRM, our
 * marketing site CMS, our money, our infrastructure telemetry - and are never
 * mounted, routed or bundled in a whitelabel build. Because they cannot reach a
 * partner, they are also exempt from the brand guard.
 */
export const AGENCY_ONLY_PATHS = [
    // Our own agency CRM
    'pages/clients',
    'pages/projects',
    'pages/leads',
    'pages/inquiries',
    'pages/Inquiries.jsx',

    // Our marketing site CMS
    'pages/blogs',
    'pages/caseStudies',
    'pages/portfolio',
    'pages/marketing',

    // Our money
    'pages/expenses',
    'pages/admin/Transactions.jsx',

    // Our website visitor intelligence
    'pages/system/SiteAnalytics.jsx',
    'pages/system/Telemetry.jsx',

    // Internal tooling and credentials
    'pages/tools',
    'pages/backups',
    'pages/admin/Documents.jsx',
    'pages/admin/DocumentEdit.jsx',
    'pages/admin/Templates.jsx',

    // Our WhatsApp numbers
    'pages/whatsapp',

    // Agency NapMail instance. Gated separately by VITE_FEATURE_NAPMAIL so a
    // partner can buy it as an add-on (decision D4).
    'pages/email-marketing',
];

/**
 * Tenant infrastructure internals. Held back from whitelabel builds for now
 * because process names, ports, DB names and raw PM2 logs expose our platform
 * naming and paths. Revisit once logs are brand-scrubbed (decision D3, task P5-04).
 */
export const INFRA_DETAIL_PATHS = [
    'pages/tenants/TenantInfrastructure.jsx',
    'pages/tenants/TenantLogs.jsx',
    'pages/tenants/TenantDangerZone.jsx',
];

/** Everything excluded from a whitelabel build. */
export const WHITELABEL_EXCLUDED_PATHS = [
    ...AGENCY_ONLY_PATHS,
    ...INFRA_DETAIL_PATHS,
];
