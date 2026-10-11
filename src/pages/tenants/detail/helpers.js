export const BASE_DOMAIN = import.meta.env.VITE_APP_BASE_DOMAIN || 'napnix.in';

export const fmtDate = v => (v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);
export const inr = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const apiError = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;

export const daysUntil = v => (v ? Math.ceil((new Date(v).getTime() - Date.now()) / 86400000) : null);

// Process status -> token dot colour (colour is paired with a text label wherever it is shown)
export const PROCESS_DOT = {
    running: 'bg-success', stopped: 'bg-fg-subtle', starting: 'bg-warning animate-pulse', error: 'bg-danger',
};

/** Provisioning finished well enough to configure domains / repair DNS. */
export const isInfraReady = t => Boolean(
    t.assigned_port && t.db_name && t.process_status !== 'starting' && t.process_status !== 'error' && !t.provision_error
);

export const monthValue = (offset = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
