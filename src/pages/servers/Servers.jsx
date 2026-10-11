import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiCloud, FiEdit2, FiPlus, FiRefreshCw, FiServer } from 'react-icons/fi';
import serverService from '../../api/admin';
import {
    Badge, Button, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, IconButton, Input, PageHeader, Panel,
    SearchInput, Skeleton, Switch,
} from '../../components/ui';

const EMPTY = {
    name: '', hostname: '', ssh_user: 'admin', cloudflare_tunnel_id: '',
    db_host: 'localhost', db_port: 3306, db_user: 'nexcrm', db_password: '',
    nexcrm_backend_path: '/var/www/html/nexcrm-backend',
    ecosystem_config_path: '/var/www/html/ecosystem.config.js',
    cloudflare_config_path: '/etc/cloudflared/config.yml',
    port_start: 3001, port_end: 3050, is_active: false,
};
const fromServer = s => Object.fromEntries(Object.keys(EMPTY).map(k => [k, k === 'db_password' ? '' : (s[k] ?? EMPTY[k])]));

function ServerForm({ server, onSubmit }) {
    const editing = !!server?.id;
    const [form, setForm] = useState(() => (editing ? fromServer(server) : EMPTY));
    const set = (key, num) => e => setForm(f => ({ ...f, [key]: num ? Number(e.target.value) : e.target.value }));
    const portError = form.port_end < form.port_start ? 'End port is below the start port' : undefined;
    return (
        <form id="server-form" onSubmit={e => { e.preventDefault(); if (!portError) onSubmit(form); }} className="space-y-6">
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <legend className="mb-3 text-sm font-semibold text-fg">Connection</legend>
                <Field label="Display name" required><Input required value={form.name} onChange={set('name')} placeholder="e.g. Alpine Server 2" data-autofocus /></Field>
                <Field label="SSH user" required><Input required value={form.ssh_user} onChange={set('ssh_user')} /></Field>
                <Field label="Hostname" required><Input required value={form.hostname} onChange={set('hostname')} placeholder="ssh2.napnix.in" className="font-mono" /></Field>
                <Field label="Cloudflare tunnel ID" required><Input required value={form.cloudflare_tunnel_id} onChange={set('cloudflare_tunnel_id')} placeholder="Tunnel UUID" className="font-mono" /></Field>
            </fieldset>
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <legend className="mb-3 text-sm font-semibold text-fg">MariaDB</legend>
                <Field label="Database host" required><Input required value={form.db_host} onChange={set('db_host')} className="font-mono" /></Field>
                <Field label="Database port" required><Input type="number" min="1" max="65535" required value={form.db_port} onChange={set('db_port', true)} className="font-mono" /></Field>
                <Field label="Database user" required><Input required value={form.db_user} onChange={set('db_user')} className="font-mono" /></Field>
                <Field label="Database password" required={!editing} hint={editing ? (server.has_db_password ? 'Leave blank to keep the saved password' : 'No password saved yet') : undefined}>
                    <Input type="password" autoComplete="new-password" required={!editing} value={form.db_password} onChange={set('db_password')} />
                </Field>
            </fieldset>
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <legend className="mb-3 text-sm font-semibold text-fg">Runtime paths and ports</legend>
                <Field label="NapCRM backend path" required className="sm:col-span-2"><Input required value={form.nexcrm_backend_path} onChange={set('nexcrm_backend_path')} className="font-mono" /></Field>
                <Field label="PM2 ecosystem path" required><Input required value={form.ecosystem_config_path} onChange={set('ecosystem_config_path')} className="font-mono" /></Field>
                <Field label="Tunnel config path" required><Input required value={form.cloudflare_config_path} onChange={set('cloudflare_config_path')} className="font-mono" /></Field>
                <Field label="Tenant port start" required><Input type="number" min="1024" max="65535" required value={form.port_start} onChange={set('port_start', true)} className="font-mono" /></Field>
                <Field label="Tenant port end" required error={portError} hint="Ports are unique per server; another server can reuse the same range">
                    <Input type="number" min="1024" max="65535" required value={form.port_end} onChange={set('port_end', true)} className="font-mono" />
                </Field>
            </fieldset>
        </form>
    );
}

function ServerCard({ server, onEdit, onToggle, onTest, testing }) {
    const stat = (label, value) => (
        <div>
            <dt className="text-xs text-fg-subtle">{label}</dt>
            <dd className="font-mono tabular-nums text-sm text-fg">{value}</dd>
        </div>
    );
    return (
        <Panel>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="flex items-center gap-2 font-semibold text-fg">
                        <FiServer aria-hidden="true" className="size-4 text-fg-subtle shrink-0" />
                        <span className="truncate">{server.name}</span>
                        {!!server.is_primary && <Badge tone="info">Primary</Badge>}
                    </h2>
                    <p className="mt-0.5 font-mono text-xs text-fg-muted truncate">{server.hostname}</p>
                </div>
                <Switch checked={!!server.is_active} onChange={() => onToggle(server)} label={server.is_active ? 'Active' : 'Maintenance'} />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3">
                {stat('Tenants', server.tenant_count || 0)}
                {stat('Running', server.running_count || 0)}
                {stat('Ports free', `${server.available_ports || 0}/${server.total_ports || 0}`)}
            </dl>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle" title={server.cloudflare_tunnel_id || undefined}>
                <FiCloud aria-hidden="true" className="size-3.5" />
                Tunnel <span className="font-mono">{server.cloudflare_tunnel_id ? `${server.cloudflare_tunnel_id.slice(0, 8)}…` : 'not set'}</span>
            </p>
            <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => onTest(server)} loading={testing}>
                    {!testing && <FiRefreshCw className="size-4" />}Test connection
                </Button>
                <IconButton size="sm" variant="secondary" label={`Edit ${server.name}`} onClick={() => onEdit(server)}><FiEdit2 className="size-4" /></IconButton>
            </div>
        </Panel>
    );
}

export default function Servers() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [formServer, setFormServer] = useState(null);
    const [deactivating, setDeactivating] = useState(null);

    const query = useQuery({
        queryKey: ['servers'],
        queryFn: () => serverService.getAllServers().then(r => r.data || []),
        staleTime: 60 * 1000,
    });
    // The API has no search; a handful of servers filters fine here
    const term = search.trim().toLowerCase();
    const servers = (query.data || []).filter(s => !term || `${s.name} ${s.hostname}`.toLowerCase().includes(term));

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['servers'] });
    const save = useMutation({
        mutationFn: ({ id, form }) => (id ? serverService.updateServer(id, form) : serverService.createServer(form)),
        onSuccess: (_, { id }) => { toast.success(id ? 'Server updated' : 'Server added'); setFormServer(null); invalidate(); },
        onError: (err, { id }) => toast.error(err.response?.data?.message || `Failed to ${id ? 'update' : 'add'} server`),
    });
    const setActive = useMutation({
        mutationFn: ({ id, is_active }) => serverService.updateServer(id, { is_active }),
        onSuccess: (_, { is_active }) => { toast.success(is_active ? 'Server activated' : 'Server in maintenance'); setDeactivating(null); invalidate(); },
        onError: () => toast.error('Failed to update status'),
    });
    const test = useMutation({
        mutationFn: server => serverService.testConnection(server.id),
        onSuccess: (res, server) => (res.success
            ? toast.success(`${server.name} is reachable${res.version ? ` (PM2 v${res.version})` : ''}`)
            : toast.error(`Connection failed: ${res.message}`)),
        onError: err => toast.error(err.response?.data?.error || err.response?.data?.message || 'Connection test failed'),
    });

    // Turning a server off stops new tenants landing on it, so confirm that direction only
    const toggle = server => (server.is_active ? setDeactivating(server) : setActive.mutate({ id: server.id, is_active: true }));
    const addButton = <Button variant="primary" onClick={() => setFormServer({})}><FiPlus className="size-4" />Add server</Button>;

    let body;
    if (query.isLoading) body = <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-52 rounded-md" />)}</div>;
    else if (query.isError) body = <ErrorState error={query.error} onRetry={query.refetch} />;
    else if (!servers.length) {
        body = (
            <Panel>
                <EmptyState
                    title={term ? `No servers match “${search}”` : 'No servers configured'}
                    description={term ? undefined : 'Add a server to deploy tenants on it. You need its Cloudflare tunnel ID and database credentials.'}
                    action={!term && addButton}
                />
            </Panel>
        );
    } else {
        body = (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {servers.map(s => (
                    <ServerCard key={s.id} server={s} onEdit={setFormServer} onToggle={toggle} onTest={test.mutate}
                        testing={test.isPending && test.variables?.id === s.id} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Servers" description="Distribute tenants across servers" actions={addButton} />
            <SearchInput value={search} onChange={setSearch} delay={0} placeholder="Search name or hostname" label="Search servers" className="w-full sm:w-72" />
            {body}

            <Dialog
                open={!!formServer}
                onClose={() => setFormServer(null)}
                title={formServer?.id ? `Edit ${formServer.name}` : 'Add server'}
                size="lg"
                footer={
                    <>
                        <Button onClick={() => setFormServer(null)} disabled={save.isPending}>Cancel</Button>
                        <Button variant="primary" type="submit" form="server-form" loading={save.isPending}>{formServer?.id ? 'Save changes' : 'Add server'}</Button>
                    </>
                }
            >
                {formServer && <ServerForm key={formServer.id ?? 'new'} server={formServer} onSubmit={form => save.mutate({ id: formServer.id, form })} />}
            </Dialog>

            <ConfirmDialog
                open={!!deactivating}
                onClose={() => setDeactivating(null)}
                onConfirm={() => setActive.mutate({ id: deactivating.id, is_active: false })}
                loading={setActive.isPending}
                title="Put server in maintenance?"
                message={deactivating && `New tenants won't be placed on ${deactivating.name}. Tenants already running there keep running.`}
                confirmText="Maintenance mode"
            />
        </div>
    );
}
