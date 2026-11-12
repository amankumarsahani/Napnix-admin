import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { flatfitAPI } from '../../api/admin';
import {
    Badge, Button, ConfirmDialog, DataTable, EmptyState, PageHeader, Panel, QueryState, SearchInput, Select, StatCard, Tabs,
} from '../../components/ui';

const ROLE = { host: 'Has a room', seeker: 'Needs a room', teamup: 'Rent together' };
const REASON = { fake: 'Fake profile', money: 'Asked for money', harassment: 'Harassment', broker: 'Broker / listing', other: 'Other' };
const STATUS_TONE = { active: 'success', banned: 'danger', deleted: 'neutral' };
const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const ageHours = (d) => Math.round((Date.now() - new Date(d).getTime()) / 36e5);
const errMsg = (e, fallback) => e?.response?.data?.error || fallback;

export default function FlatFit() {
    const [tab, setTab] = useState('overview');
    const overview = useQuery({ queryKey: ['flatfit', 'overview'], queryFn: flatfitAPI.getOverview, staleTime: 60 * 1000 });
    const o = overview.data;
    return (
        <div>
            <PageHeader title="FlatFit" description="Flatmate app: reports to act on, users, and early-access sign-ups. Reports must be acknowledged within 24 hours." />
            <Tabs
                className="mb-4"
                value={tab}
                onChange={setTab}
                tabs={[
                    { id: 'overview', label: 'Overview' },
                    { id: 'reports', label: 'Reports', count: o?.open_reports },
                    { id: 'users', label: 'Users', count: o?.users.active },
                    { id: 'waitlist', label: 'Early access', count: o?.waitlist.total },
                ]}
            />
            {tab === 'overview' && <Overview query={overview} />}
            {tab === 'reports' && <Reports />}
            {tab === 'users' && <Users />}
            {tab === 'waitlist' && <Waitlist />}
        </div>
    );
}

function Overview({ query }) {
    return (
        <QueryState query={query} isEmpty={() => false}>
            {(o) => (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <StatCard label="Active users" value={o.users.active} hint={`${o.users.new_7d} new this week`} />
                        <StatCard label="Visible profiles" value={o.profiles} hint={`${o.verified} ID-verified`} />
                        <StatCard label="Matches" value={o.matches} hint={`${o.numbers_shared} shared numbers · ${o.messages} messages`} />
                        <StatCard label="Open reports" value={o.open_reports} hint={o.open_reports ? 'Reply within 24 hours' : 'Nothing waiting'} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <Panel title="Profiles by city">
                            <Counts rows={o.cities} empty="No profiles yet" />
                        </Panel>
                        <Panel title="What they need">
                            <Counts rows={Object.fromEntries(Object.entries(o.roles).map(([k, v]) => [ROLE[k] || k, v]))} empty="No profiles yet" />
                        </Panel>
                        <Panel title="Accounts">
                            <Counts rows={{ Active: o.users.active, Banned: o.users.banned, 'Deleted (kept 180 days)': o.users.deleted, 'Early access sign-ups': o.waitlist.total }} />
                        </Panel>
                    </div>
                </div>
            )}
        </QueryState>
    );
}

function Counts({ rows, empty }) {
    const entries = Object.entries(rows || {});
    if (!entries.length) return <p className="text-sm text-fg-muted">{empty}</p>;
    return (
        <dl className="divide-y divide-border text-sm">
            {entries.map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5">
                    <dt className="text-fg-muted">{k}</dt>
                    <dd className="font-mono tabular-nums text-fg">{v}</dd>
                </div>
            ))}
        </dl>
    );
}

function Reports() {
    const qc = useQueryClient();
    const [status, setStatus] = useState('open');
    const [confirm, setConfirm] = useState(null); // { report, action }
    const query = useQuery({ queryKey: ['flatfit', 'reports', status], queryFn: () => flatfitAPI.getReports(status), staleTime: 30 * 1000 });
    const act = useMutation({
        mutationFn: ({ report, action }) => flatfitAPI.actOnReport(report.id, action),
        onSuccess: (_, { action, report }) => {
            toast.success(action === 'ban' ? `${report.reported_name || 'User'} banned` : 'Report dismissed');
            setConfirm(null);
            qc.invalidateQueries({ queryKey: ['flatfit'] });
        },
        onError: (e) => toast.error(errMsg(e, 'Failed to update the report')),
    });
    const columns = [
        { key: 'created_at', header: 'Reported', render: r => (
            <span className="whitespace-nowrap">
                {when(r.created_at)}
                {r.status === 'open' && ageHours(r.created_at) >= 20 && <Badge tone="danger" className="ml-2">{ageHours(r.created_at)}h old</Badge>}
            </span>
        ) },
        { key: 'reason', header: 'Reason', render: r => (
            <div>
                <Badge tone={r.reason === 'money' || r.reason === 'harassment' ? 'danger' : 'warning'}>{REASON[r.reason] || r.reason}</Badge>
                {r.details && <p className="mt-1 max-w-sm text-xs text-fg-muted">{r.details}</p>}
            </div>
        ) },
        { key: 'reported', header: 'Reported user', render: r => (
            <div>
                <p className="text-fg">{r.reported_name || '(no name)'} <span className="text-fg-subtle">#{r.reported}</span></p>
                <p className="text-xs text-fg-muted">{r.reported_login} · {r.reports_against} report{r.reports_against === 1 ? '' : 's'}</p>
                {r.reported_status !== 'active' && <Badge tone={STATUS_TONE[r.reported_status]}>{r.reported_status}</Badge>}
            </div>
        ) },
        { key: 'reporter', header: 'By', render: r => (
            <div className="text-xs text-fg-muted">{r.reporter_name || '(no name)'} #{r.reporter}<br />{r.reporter_login}</div>
        ) },
    ];
    return (
        <Panel
            flush
            title="Reports"
            description="Reporting also blocks the two people from each other. Ban closes every open report against that user."
            actions={(
                <Select aria-label="Report status" value={status} onChange={e => setStatus(e.target.value)} className="w-40">
                    <option value="open">Open</option>
                    <option value="actioned">Actioned</option>
                    <option value="dismissed">Dismissed</option>
                </Select>
            )}
        >
            <DataTable
                columns={columns}
                rows={query.data?.reports || []}
                loading={query.isLoading}
                error={query.error}
                onRetry={query.refetch}
                empty={<EmptyState title={status === 'open' ? 'No open reports' : 'Nothing here'} description={status === 'open' ? 'Every report has been handled.' : undefined} />}
                actions={status === 'open' ? (r => (
                    <span className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="secondary" onClick={() => setConfirm({ report: r, action: 'dismiss' })}>Dismiss</Button>
                        <Button size="sm" variant="danger" onClick={() => setConfirm({ report: r, action: 'ban' })}>Ban user</Button>
                    </span>
                )) : undefined}
            />
            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={() => act.mutate(confirm)}
                loading={act.isPending}
                variant={confirm?.action === 'ban' ? 'danger' : 'primary'}
                title={confirm?.action === 'ban' ? `Ban ${confirm?.report.reported_name || 'this user'}?` : 'Dismiss this report?'}
                message={confirm?.action === 'ban'
                    ? 'They are logged out and hidden from everyone at once. You can unban them from the Users tab.'
                    : 'The report is closed with no action. The two people stay blocked from each other.'}
                confirmText={confirm?.action === 'ban' ? 'Ban user' : 'Dismiss'}
            />
        </Panel>
    );
}

function Users() {
    const qc = useQueryClient();
    const [filters, setFilters] = useState({ q: '', status: '', page: 1 });
    const [confirm, setConfirm] = useState(null); // user to ban/unban
    const params = { q: filters.q || undefined, status: filters.status || undefined, page: filters.page };
    const query = useQuery({
        queryKey: ['flatfit', 'users', params], queryFn: () => flatfitAPI.getUsers(params), staleTime: 30 * 1000, placeholderData: prev => prev,
    });
    const setStatus = useMutation({
        mutationFn: (u) => flatfitAPI.setStatus(u.id, u.status === 'banned' ? 'active' : 'banned'),
        onSuccess: (_, u) => {
            toast.success(u.status === 'banned' ? 'User unbanned' : 'User banned');
            setConfirm(null);
            qc.invalidateQueries({ queryKey: ['flatfit'] });
        },
        onError: (e) => toast.error(errMsg(e, 'Failed to update the user')),
    });
    const total = query.data?.pagination?.total || 0;
    const limit = query.data?.pagination?.limit || 50;
    const columns = [
        { key: 'name', header: 'User', render: u => (
            <div>
                <p className="text-fg">{u.name || '(no profile yet)'} <span className="text-fg-subtle">#{u.id}</span></p>
                <p className="text-xs text-fg-muted">{u.email || ''}{u.email && u.phone ? ' · ' : ''}{u.phone ? `+${u.phone}` : ''}</p>
            </div>
        ) },
        { key: 'role', header: 'Needs', render: u => (u.role ? ROLE[u.role] : <span className="text-fg-subtle">-</span>) },
        { key: 'areas', header: 'Areas', render: u => <span className="text-xs text-fg-muted">{u.areas.join(', ') || '-'}</span> },
        { key: 'flags', header: 'Status', render: u => (
            <span className="flex flex-wrap gap-1">
                <Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge>
                {u.verified && <Badge tone="success">ID verified</Badge>}
                {!u.visible && u.status === 'active' && <Badge>hidden</Badge>}
                {u.reports_against > 0 && <Badge tone="warning">{u.reports_against} report{u.reports_against === 1 ? '' : 's'}</Badge>}
            </span>
        ) },
        { key: 'created_at', header: 'Joined', render: u => <span className="whitespace-nowrap text-xs text-fg-muted">{when(u.created_at)}</span> },
    ];
    return (
        <Panel
            flush
            title="Users"
            actions={(
                <>
                    <SearchInput value={filters.q} onChange={q => setFilters(f => ({ ...f, q, page: 1 }))} placeholder="Email, phone or name" className="w-64" />
                    <Select aria-label="Account status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))} className="w-36">
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="banned">Banned</option>
                        <option value="deleted">Deleted</option>
                    </Select>
                </>
            )}
        >
            <DataTable
                columns={columns}
                rows={query.data?.users || []}
                loading={query.isLoading}
                error={query.error}
                onRetry={query.refetch}
                empty={<EmptyState title="No users found" />}
                actions={u => (u.status === 'deleted' ? null : (
                    <span onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant={u.status === 'banned' ? 'secondary' : 'danger'} onClick={() => setConfirm(u)}>
                            {u.status === 'banned' ? 'Unban' : 'Ban'}
                        </Button>
                    </span>
                ))}
            />
            {total > limit && (
                <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 text-sm text-fg-muted">
                    <span>Page {filters.page} of {Math.ceil(total / limit)} · {total} users</span>
                    <span className="flex gap-2">
                        <Button size="sm" variant="secondary" disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>Previous</Button>
                        <Button size="sm" variant="secondary" disabled={filters.page * limit >= total} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next</Button>
                    </span>
                </div>
            )}
            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={() => setStatus.mutate(confirm)}
                loading={setStatus.isPending}
                variant={confirm?.status === 'banned' ? 'primary' : 'danger'}
                title={confirm?.status === 'banned' ? `Unban ${confirm?.name || 'this user'}?` : `Ban ${confirm?.name || 'this user'}?`}
                message={confirm?.status === 'banned'
                    ? 'They can log in again and show up in Discover.'
                    : 'They are logged out and hidden from everyone at once.'}
                confirmText={confirm?.status === 'banned' ? 'Unban' : 'Ban'}
            />
        </Panel>
    );
}

function Waitlist() {
    const query = useQuery({ queryKey: ['flatfit', 'waitlist'], queryFn: flatfitAPI.getWaitlist, staleTime: 60 * 1000 });
    const rows = query.data?.waitlist || [];
    const exportCsv = () => {
        const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = [['Contact', 'Station', 'Moving', 'Needs', 'Signed up'], ...rows.map(r => [r.contact, r.station, r.moving, ROLE[r.role] || r.role, when(r.created_at)])]
            .map(r => r.map(cell).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `flatfit-early-access-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };
    const columns = [
        { key: 'contact', header: 'Contact', render: r => <span className="text-fg">{r.contact}</span> },
        { key: 'station', header: 'Station' },
        { key: 'moving', header: 'Moving' },
        { key: 'role', header: 'Needs', render: r => ROLE[r.role] || r.role },
        { key: 'created_at', header: 'Signed up', render: r => <span className="whitespace-nowrap text-xs text-fg-muted">{when(r.created_at)}</span> },
    ];
    return (
        <Panel
            flush
            title="Early access"
            description="From the form on flatfit.napnix.in. Deleted automatically 180 days after the last sign-up."
            actions={rows.length > 0 && <Button size="sm" variant="secondary" onClick={exportCsv}>Export CSV</Button>}
        >
            <DataTable
                columns={columns}
                rows={rows}
                loading={query.isLoading}
                error={query.error}
                onRetry={query.refetch}
                empty={<EmptyState title="No sign-ups yet" />}
            />
        </Panel>
    );
}
