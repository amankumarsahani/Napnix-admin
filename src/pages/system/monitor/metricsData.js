// Pure transforms for the /monitoring dashboard (tested in __tests__/metricsData.test.js).
// The API returns DB-aggregated buckets keyed by epoch seconds; numbers may arrive as
// strings (MariaDB DECIMAL/SUM), so everything goes through num().

export const MAX_SERIES = 6; // --chart-1..6; more tenants fold into "Other"
export const OTHER_KEY = '__other';

export const num = v => (v === null || v === undefined || v === '' ? null : Number(v));

/** Every bucket start from `from` to `to`, so missing data renders as a gap, not a join. */
export function buildAxis(from, to, bucket) {
    const out = [];
    for (let t = Math.floor(from / bucket) * bucket; t <= to; t += bucket) out.push(t);
    return out;
}

/**
 * Series definitions with colour fixed by the tenant's position in `tenants` (id order),
 * never by value, so filtering or refetching never repaints a tenant. Past MAX_SERIES
 * the rest fold into one "Other" series.
 */
export function seriesFor(tenants, colors, otherColor) {
    const fold = tenants.length > MAX_SERIES;
    const keep = fold ? tenants.slice(0, MAX_SERIES - 1) : tenants;
    const defs = keep.map((t, i) => ({ key: t.slug, label: t.slug, color: colors[i % colors.length], ids: [t.id] }));
    if (fold) {
        defs.push({ key: OTHER_KEY, label: `Other (${tenants.length - keep.length})`, color: otherColor, ids: tenants.slice(keep.length).map(t => t.id) });
    }
    return defs;
}

/**
 * Rows of { t, [seriesKey]: value } for one metric. "Other" averages its members.
 * `agg` picks how folded tenants combine ('avg' | 'sum' | 'max').
 */
export function pivot(rows, axis, defs, metric, agg = 'avg') {
    const byKey = new Map(); // `${tenantId}:${t}` -> value
    for (const r of rows) byKey.set(`${r.tenant_id}:${num(r.t)}`, num(r[metric]));
    return axis.map(t => {
        const row = { t };
        for (const d of defs) {
            const vals = d.ids.map(id => byKey.get(`${id}:${t}`)).filter(v => v !== null && v !== undefined);
            if (!vals.length) { row[d.key] = null; continue; }
            if (agg === 'sum') row[d.key] = vals.reduce((a, b) => a + b, 0);
            else if (agg === 'max') row[d.key] = Math.max(...vals);
            else row[d.key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
        return row;
    });
}

/** Per-tenant availability cells for the state timeline. */
export function timeline(rows, axis, tenants) {
    const byKey = new Map();
    for (const r of rows) byKey.set(`${r.tenant_id}:${num(r.t)}`, r);
    return tenants.map(tenant => ({
        tenant,
        cells: axis.map(t => {
            const r = byKey.get(`${tenant.id}:${t}`);
            if (!r) return { t, state: 'none', checks: 0, ok: 0 };
            const checks = num(r.checks) || 0;
            const ok = num(r.ok_checks) || 0;
            const state = checks === 0 ? 'none' : ok === checks ? 'up' : ok === 0 ? 'down' : 'partial';
            return { t, state, checks, ok };
        }),
    }));
}

/** Range totals per tenant for the table view. */
export function tenantSummary(rows, tenants) {
    return tenants.map(tenant => {
        const mine = rows.filter(r => r.tenant_id === tenant.id);
        const checks = mine.reduce((s, r) => s + (num(r.checks) || 0), 0);
        const ok = mine.reduce((s, r) => s + (num(r.ok_checks) || 0), 0);
        const lat = mine.map(r => num(r.latency_ms)).filter(v => v !== null);
        const mem = mine.map(r => num(r.memory_mb)).filter(v => v !== null);
        const max = key => {
            const v = mine.map(r => num(r[key])).filter(x => x !== null);
            return v.length ? Math.max(...v) : null;
        };
        return {
            ...tenant,
            checks,
            uptime: checks ? (100 * ok) / checks : null,
            latency_ms: lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : null,
            memory_mb: mem.length ? Math.round(mem.reduce((a, b) => a + b, 0) / mem.length) : null,
            max_5xx: max('errors_5xx_5m'),
            max_4xx: max('errors_4xx_5m'),
        };
    });
}

/** Alert counts per bucket, one key per severity. */
export function eventRows(rows, axis) {
    const out = axis.map(t => ({ t, critical: 0, high: 0, medium: 0, low: 0, info: 0 }));
    const idx = new Map(axis.map((t, i) => [t, i]));
    for (const r of rows) {
        const i = idx.get(num(r.t));
        if (i !== undefined && r.severity in out[i]) out[i][r.severity] += num(r.n) || 0;
    }
    return out;
}

/** Server series rows for one server; percentages computed here so the chart has one axis. */
export function serverRows(rows, axis, serverName) {
    const byT = new Map(rows.filter(r => r.server_name === serverName).map(r => [num(r.t), r]));
    return axis.map(t => {
        const r = byT.get(t);
        if (!r) return { t, load1: null, mem_pct: null, disk_pct: null, cpu_count: null };
        const pct = (used, total) => (num(used) !== null && num(total) ? Math.round((1000 * num(used)) / num(total)) / 10 : null);
        return {
            t,
            load1: num(r.load1),
            cpu_count: num(r.cpu_count),
            mem_pct: pct(r.mem_used_mb, r.mem_total_mb),
            disk_pct: pct(r.disk_used_gb, r.disk_total_gb),
        };
    });
}

export function formatTick(t, range) {
    const d = new Date(t * 1000);
    if (range === '7d') return d.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatFull(t) {
    return new Date(t * 1000).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(s) {
    if (s === null || s === undefined) return '—';
    if (s < 3600) return `${Math.round(s / 60)}m`;
    if (s < 86400) return `${Math.round(s / 3600)}h`;
    return `${Math.round(s / 86400)}d`;
}
