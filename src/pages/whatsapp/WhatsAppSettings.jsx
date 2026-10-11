import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { whatsappApi } from '../../api/whatsapp';
import {
    Badge, Button, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, IconButton, Input, PageHeader, Panel, Skeleton, StatCard, cx,
} from '../../components/ui';

// Account state: colour is paired with the label, never the only signal
const STATUS = {
    connected: { tone: 'success', label: 'Connected', dot: 'bg-success' },
    disconnected: { tone: 'neutral', label: 'Disconnected', dot: 'bg-fg-subtle' },
    pending_qr: { tone: 'warning', label: 'Awaiting scan', dot: 'bg-warning animate-pulse' },
    reconnecting: { tone: 'info', label: 'Reconnecting', dot: 'bg-accent animate-pulse' },
};
const apiErr = (err, fallback) => err?.response?.data?.error || fallback;

// Scan-to-link. Streams the session's events (SSE over fetch, because EventSource can't send the auth header).
function QRDialog({ account, onClose, onConnected }) {
    const [qr, setQr] = useState(null);
    const [status, setStatus] = useState('starting');
    const readerRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const url = `${apiBase}/admin/whatsapp/internal/session/events/${account.session_id}`;
        let cancelled = false;
        (async () => {
            try {
                const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                const reader = resp.body.getReader();
                readerRef.current = reader;
                const dec = new TextDecoder();
                let buf = '';
                while (!cancelled) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buf += dec.decode(value, { stream: true });
                    const lines = buf.split('\n');
                    buf = lines.pop();
                    for (const line of lines) {
                        if (!line.startsWith('data:')) continue;
                        try {
                            const ev = JSON.parse(line.slice(5).trim());
                            if (ev.type === 'qr' && ev.qr) {
                                const dataUrl = await QRCode.toDataURL(ev.qr, { width: 256, margin: 1 });
                                if (!cancelled) { setQr(dataUrl); setStatus('pending_qr'); }
                            }
                            if (ev.type === 'connected' || (ev.type === 'status' && ev.connected)) {
                                setStatus('connected'); onConnected(); setTimeout(onClose, 1200);
                            }
                        } catch (err) {
                            console.error('Failed to parse SSE event line:', line, err);
                        }
                    }
                }
            } catch (err) {
                console.error('WhatsApp QR stream failed:', err);
                if (!cancelled) setStatus('error');
            }
        })();
        return () => { cancelled = true; readerRef.current?.cancel(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog open onClose={onClose} title="Scan with WhatsApp" description="Settings, Linked devices, Link a device" size="sm" footer={<Button onClick={onClose}>Cancel</Button>}>
            <div className="flex flex-col items-center gap-3 py-2">
                <div className="grid size-64 place-items-center rounded-md border border-border bg-white">
                    {status === 'connected' ? <p role="status" className="text-sm font-semibold text-success">Connected</p>
                        : qr ? <img src={qr} alt="WhatsApp pairing QR code" width={248} height={248} />
                            : (
                                <p role="status" className="flex flex-col items-center gap-2 text-xs text-gray-500">
                                    <span aria-hidden="true" className="size-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                    {status === 'error' ? 'Connection error. Close and try again.' : 'Generating QR…'}
                                </p>
                            )}
                </div>
                {status === 'pending_qr' && <p className="text-center text-xs text-fg-subtle">The code expires after about 60 seconds; a fresh one appears on its own.</p>}
            </div>
        </Dialog>
    );
}

function MetaDialog({ account, onClose, onSaved }) {
    const [form, setForm] = useState({ token: '', phoneNumberId: '', wabaId: '' });
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const save = useMutation({
        mutationFn: () => whatsappApi.saveMetaCredentials(account.id, form),
        onSuccess: r => { toast.success(`Connected: ${r.phone || 'Meta account'}`); onSaved(); onClose(); },
        onError: err => toast.error(apiErr(err, 'Invalid credentials')),
    });
    return (
        <Dialog
            open onClose={onClose} title="Meta Cloud API credentials" description="From Meta developer console, WhatsApp, API setup" size="sm"
            footer={<><Button onClick={onClose} disabled={save.isPending}>Cancel</Button><Button variant="primary" type="submit" form="meta-form" loading={save.isPending}>Save and connect</Button></>}
        >
            <form id="meta-form" onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                <Field label="Access token" required><Input type="password" required autoComplete="off" value={form.token} onChange={set('token')} placeholder="EAAxxxxxxx…" className="font-mono text-xs" data-autofocus /></Field>
                <Field label="Phone number ID" required><Input required value={form.phoneNumberId} onChange={set('phoneNumberId')} placeholder="1234567890123456" className="font-mono" /></Field>
                <Field label="WhatsApp Business account ID" hint="Optional. Needed for message templates"><Input value={form.wabaId} onChange={set('wabaId')} className="font-mono" /></Field>
            </form>
        </Dialog>
    );
}

const CHANNELS = [
    { v: 'baileys', title: 'Baileys', sub: 'A personal number linked by QR. No approval needed.' },
    { v: 'meta', title: 'Meta API', sub: 'Official Business API. Needs Meta developer access.' },
];

function AddDialog({ onClose, onCreated }) {
    const [channel, setChannel] = useState('baileys');
    const [label, setLabel] = useState('');
    const create = useMutation({
        mutationFn: () => whatsappApi.createAccount({ channel, label: label.trim() }),
        onSuccess: r => { toast.success('Account created'); onCreated(r); onClose(); },
        onError: err => toast.error(apiErr(err, 'Could not create the account')),
    });
    return (
        <Dialog
            open onClose={onClose} title="Add WhatsApp account" size="sm"
            footer={<><Button onClick={onClose} disabled={create.isPending}>Cancel</Button><Button variant="primary" type="submit" form="wa-add-form" loading={create.isPending}>Create</Button></>}
        >
            <form id="wa-add-form" onSubmit={e => { e.preventDefault(); create.mutate(); }} className="space-y-4">
                <fieldset>
                    <legend className="mb-1.5 text-sm font-medium text-fg">Channel</legend>
                    <div className="grid grid-cols-2 gap-2">
                        {CHANNELS.map(o => (
                            <button key={o.v} type="button" aria-pressed={channel === o.v} onClick={() => setChannel(o.v)}
                                className={cx('rounded-sm border p-3 text-left', channel === o.v ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-2')}>
                                <span className="block text-sm font-medium text-fg">{o.title}</span>
                                <span className="mt-0.5 block text-xs text-fg-muted">{o.sub}</span>
                            </button>
                        ))}
                    </div>
                </fieldset>
                <Field label="Label" required><Input required value={label} onChange={e => setLabel(e.target.value)} placeholder="Support, Sales, Marketing" data-autofocus /></Field>
            </form>
        </Dialog>
    );
}

function AccountCard({ account, onRefresh }) {
    const navigate = useNavigate();
    const [dialog, setDialog] = useState(null); // 'qr' | 'meta' | 'delete' | 'disconnect'
    const cfg = STATUS[account.status] || STATUS.disconnected;
    const isConnected = account.status === 'connected';
    const baileys = account.channel === 'baileys';

    const disconnect = useMutation({
        mutationFn: () => whatsappApi.disconnectAccount(account.id),
        onSuccess: () => { toast.success('Disconnected'); setDialog(null); onRefresh(); },
        onError: err => { toast.error(apiErr(err, 'Could not disconnect')); setDialog(null); },
    });
    const remove = useMutation({
        mutationFn: () => whatsappApi.deleteAccount(account.id),
        onSuccess: () => { toast.success('Account deleted'); setDialog(null); onRefresh(); },
        onError: err => { toast.error(apiErr(err, 'Could not delete')); setDialog(null); },
    });
    const connect = useMutation({
        mutationFn: async () => {
            // the session may already be live
            const live = await whatsappApi.getStatus(account.id);
            if (live.connected || live.status === 'connected') return 'already';
            await whatsappApi.connectAccount(account.id);
            return 'qr';
        },
        onSuccess: r => { if (r === 'already') { toast.success('Already connected'); onRefresh(); } else setDialog('qr'); },
        onError: err => toast.error(apiErr(err, 'Failed to start the session')),
    });

    return (
        <Panel>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h2 className="truncate font-semibold text-fg">{account.label}</h2>
                    <p className="text-xs text-fg-subtle">{baileys ? 'Baileys, personal number' : 'Meta Cloud API'}</p>
                </div>
                <Badge tone={cfg.tone}><span aria-hidden="true" className={cx('size-1.5 rounded-full', cfg.dot)} />{cfg.label}</Badge>
            </div>
            <p className={cx('mt-3 rounded-sm border border-border bg-surface-2 px-3 py-2 text-xs', account.phone ? 'font-mono text-fg-muted' : 'italic text-fg-subtle')}>
                {account.phone || 'No number connected'}
            </p>
            <div className="mt-4 flex items-center gap-2">
                {isConnected ? (
                    <>
                        <Button variant="primary" className="flex-1" onClick={() => navigate(`/whatsapp/${account.id}`)}>Open inbox</Button>
                        <Button onClick={() => setDialog('disconnect')}>Disconnect</Button>
                    </>
                ) : (
                    <Button variant="primary" className="flex-1" onClick={() => (baileys ? connect.mutate() : setDialog('meta'))} loading={connect.isPending}>
                        {baileys ? 'Scan QR' : 'Enter credentials'}
                    </Button>
                )}
                <IconButton variant="danger" label={`Delete ${account.label}`} onClick={() => setDialog('delete')}><FiTrash2 className="size-4" /></IconButton>
            </div>

            {dialog === 'qr' && <QRDialog account={account} onClose={() => setDialog(null)} onConnected={onRefresh} />}
            {dialog === 'meta' && <MetaDialog account={account} onClose={() => setDialog(null)} onSaved={onRefresh} />}
            <ConfirmDialog open={dialog === 'delete'} onClose={() => setDialog(null)} onConfirm={() => remove.mutate()} loading={remove.isPending}
                title="Delete account?" message={`This removes “${account.label}” and its session. This can’t be undone.`} confirmText="Delete account" />
            <ConfirmDialog open={dialog === 'disconnect'} onClose={() => setDialog(null)} onConfirm={() => disconnect.mutate()} loading={disconnect.isPending}
                title="Disconnect account?" message={`“${account.label}” stops sending and receiving until you link it again.`} confirmText="Disconnect" />
        </Panel>
    );
}

export default function WhatsAppSettings() {
    const [adding, setAdding] = useState(false);
    const queryClient = useQueryClient();

    const query = useQuery({ queryKey: ['whatsapp-accounts'], queryFn: whatsappApi.getAccounts, staleTime: 30000, refetchInterval: 15000 });
    const accounts = query.data || [];
    // v5 needs the { queryKey } form; the old array form here did nothing, so lists only updated on the 15 s poll
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
    const napnix = accounts.filter(a => a.owner_type === 'napnix');
    const tenants = accounts.filter(a => a.owner_type === 'tenant');
    const connected = accounts.filter(a => a.status === 'connected').length;
    const addButton = <Button variant="primary" onClick={() => setAdding(true)}><FiPlus className="size-4" />Add account</Button>;

    const group = (title, list) => !!list.length && (
        <section>
            <h2 className="mb-2 text-xs font-medium text-fg-muted">{title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map(a => <AccountCard key={a.id} account={a} onRefresh={refresh} />)}</div>
        </section>
    );

    let body;
    if (query.isLoading) body = <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-md" />)}</div>;
    else if (query.isError) body = <ErrorState error={query.error} onRetry={query.refetch} />;
    else if (!accounts.length) body = <Panel><EmptyState title="No WhatsApp accounts yet" description="Add a Baileys or Meta account to start messaging." action={addButton} /></Panel>;
    else body = <div className="space-y-6">{group('Napnix accounts', napnix)}{group('Tenant accounts', tenants)}</div>;

    return (
        <div className="max-w-5xl space-y-4">
            <PageHeader title="WhatsApp" description={query.data ? `${accounts.length} account${accounts.length === 1 ? '' : 's'}, ${connected} connected` : undefined} actions={addButton} />
            {accounts.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Accounts" value={accounts.length} />
                    <StatCard label="Connected" value={connected} />
                    <StatCard label="Pending or offline" value={accounts.length - connected} />
                </div>
            )}
            {body}
            {adding && <AddDialog onClose={() => setAdding(false)} onCreated={refresh} />}
        </div>
    );
}
