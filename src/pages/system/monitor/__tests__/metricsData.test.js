import { describe, expect, it } from 'vitest';
import { OTHER_KEY, buildAxis, eventRows, pivot, serverRows, seriesFor, tenantSummary, timeline } from '../metricsData';

const tenants = [{ id: 1, slug: 'a' }, { id: 2, slug: 'b' }];
const colors = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];

describe('metricsData', () => {
    it('builds an aligned bucket axis', () => {
        expect(buildAxis(125, 300, 60)).toEqual([120, 180, 240, 300]);
    });

    it('colours by tenant order and folds past six into Other', () => {
        expect(seriesFor(tenants, colors, 'gray').map(d => [d.key, d.color])).toEqual([['a', 'c1'], ['b', 'c2']]);
        const many = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, slug: `t${i + 1}` }));
        const defs = seriesFor(many, colors, 'gray');
        expect(defs).toHaveLength(6);
        expect(defs[5]).toMatchObject({ key: OTHER_KEY, color: 'gray', ids: [6, 7, 8] });
        // dropping a tenant never repaints the ones before it
        expect(seriesFor(many.slice(0, 3), colors, 'gray').map(d => d.color)).toEqual(['c1', 'c2', 'c3']);
    });

    it('pivots with gaps as null and string numbers coerced', () => {
        const rows = [{ tenant_id: 1, t: '60', latency_ms: '120' }, { tenant_id: 2, t: 120, latency_ms: 80 }];
        const defs = seriesFor(tenants, colors, 'gray');
        expect(pivot(rows, [60, 120], defs, 'latency_ms')).toEqual([
            { t: 60, a: 120, b: null },
            { t: 120, a: null, b: 80 },
        ]);
    });

    it('averages Other members', () => {
        const defs = [{ key: OTHER_KEY, ids: [1, 2] }];
        const rows = [{ tenant_id: 1, t: 0, m: 10 }, { tenant_id: 2, t: 0, m: 20 }];
        expect(pivot(rows, [0], defs, 'm')[0][OTHER_KEY]).toBe(15);
        expect(pivot(rows, [0], defs, 'm', 'max')[0][OTHER_KEY]).toBe(20);
    });

    it('classifies timeline cells', () => {
        const rows = [
            { tenant_id: 1, t: 0, checks: '5', ok_checks: '5' },
            { tenant_id: 1, t: 60, checks: 5, ok_checks: 3 },
            { tenant_id: 1, t: 120, checks: 5, ok_checks: 0 },
        ];
        const [row] = timeline(rows, [0, 60, 120, 180], [tenants[0]]);
        expect(row.cells.map(c => c.state)).toEqual(['up', 'partial', 'down', 'none']);
    });

    it('summarises a tenant over the range', () => {
        const rows = [
            { tenant_id: 1, t: 0, checks: 4, ok_checks: 3, latency_ms: 100, errors_5xx_5m: 2, errors_4xx_5m: 9, memory_mb: 150 },
            { tenant_id: 1, t: 60, checks: 4, ok_checks: 4, latency_ms: 200, errors_5xx_5m: 5, errors_4xx_5m: null, memory_mb: 170 },
        ];
        expect(tenantSummary(rows, [tenants[0]])[0]).toMatchObject({ checks: 8, uptime: 87.5, latency_ms: 150, max_5xx: 5, max_4xx: 9, memory_mb: 160 });
        expect(tenantSummary([], [tenants[1]])[0].uptime).toBeNull();
    });

    it('counts events per severity and computes server percentages', () => {
        expect(eventRows([{ t: 60, severity: 'high', n: '2' }], [0, 60])[1].high).toBe(2);
        const s = serverRows([{ server_name: 'x', t: 0, load1: '0.5', cpu_count: 4, mem_used_mb: 512, mem_total_mb: 2048, disk_used_gb: 10, disk_total_gb: 40 }], [0, 300], 'x');
        expect(s[0]).toEqual({ t: 0, load1: 0.5, cpu_count: 4, mem_pct: 25, disk_pct: 25 });
        expect(s[1].mem_pct).toBeNull();
    });
});
