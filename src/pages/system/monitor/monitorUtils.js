import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { tenantMonitorAPI } from '../../../api/admin';

export const HEALTH_TONE = { up: 'success', degraded: 'warning', down: 'danger', unknown: 'neutral' };
export const SEVERITY_TONE = { info: 'neutral', low: 'neutral', medium: 'warning', high: 'danger', critical: 'danger' };

export const RULE_LABELS = {
    tenant_down: 'Tenant down',
    db_unreachable: 'Database unreachable',
    tenant_recovered: 'Recovered',
    slow: 'Slow responses',
    memory_high: 'High memory',
    error_spike: '5xx spike',
    scan_suspect: '4xx spike (scanning?)',
    crash_loop: 'Crash loop',
    pm2_mismatch: 'PM2 status mismatch',
    server_unreachable: 'Server unreachable',
    monitor_dns_failure: 'Monitor DNS failure',
    credential_stuffing: 'Credential stuffing',
    brute_force_ip: 'Brute force (IP)',
    brute_force_account: 'Brute force (account)',
    privilege_escalation: 'New admin',
    mass_delete: 'Mass delete',
    mass_export: 'Mass export',
    rate_limit_abuse: 'Rate-limit abuse',
    admin_new_country: 'Admin login, new country',
    security_feed_gap: 'Security log unreadable',
};

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
/** "3 min ago" from a server timestamp; the API returns ISO strings. */
export function timeAgo(value) {
    if (!value) return '—';
    const s = Math.round((new Date(value).getTime() - Date.now()) / 1000);
    if (Number.isNaN(s)) return '—';
    const abs = Math.abs(s);
    if (abs < 60) return rtf.format(s, 'second');
    if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
    return rtf.format(Math.round(s / 86400), 'day');
}

export function useAcknowledge() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ids => tenantMonitorAPI.acknowledge(ids),
        onSuccess: r => {
            toast.success(`${r.acknowledged} event${r.acknowledged === 1 ? '' : 's'} acknowledged`);
            qc.invalidateQueries({ queryKey: ['tenant-monitor'] });
        },
        onError: e => toast.error(e?.response?.data?.error || 'Failed to acknowledge'),
    });
}
