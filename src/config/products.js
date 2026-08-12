/**
 * Product SKU slugs.
 *
 * These are wire values: they are stored in the tools registry and compared by the
 * backend, so they are not brand text and must not be renamed with the brand. They
 * live here rather than inline so the strings appear once instead of a dozen times,
 * and so the brand guard has a single documented place to exempt.
 *
 * Display names come from the brand — `brand.crmProductName`, `brand.mailProductName`.
 */

export const SKU_CRM = 'nexcrm';   // brand-guard: allow - stored SKU, backend compares this exact value
export const SKU_MAIL = 'napmail'; // brand-guard: allow - stored SKU, backend compares this exact value
