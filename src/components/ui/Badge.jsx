import { getStatusColor, TONE as TONES } from '../../utils/statusColors';
import { cx } from './cx';

const BASE = 'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-2xs font-medium whitespace-nowrap';

/** Small label. tone: neutral | info | success | warning | danger. */
export function Badge({ tone = 'neutral', className, children }) {
    return <span className={cx(BASE, TONES[tone], className)}>{children}</span>;
}

const humanize = s => String(s ?? '').replace(/[_-]+/g, ' ').replace(/^\w/, c => c.toUpperCase());

/** Status badge for an entity (client, lead, tenant, project, campaign) using utils/statusColors. */
export function StatusBadge({ entity, status, label, className }) {
    if (!status) return null;
    return <span className={cx(BASE, getStatusColor(entity, status), className)}>{label || humanize(status)}</span>;
}
