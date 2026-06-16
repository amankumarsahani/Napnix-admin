import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { whatsappApi } from '../../api/whatsapp';

const STATUS_CONFIG = {
    connected:    { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20', label: 'Connected' },
    disconnected: { dot: 'bg-slate-400', badge: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20', label: 'Disconnected' },
    pending_qr:   { dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20', label: 'Awaiting Scan' },
    reconnecting: { dot: 'bg-blue-400 animate-pulse', badge: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20', label: 'Reconnecting' },
};

// ── QR Modal ──────────────────────────────────────────────
function QRModal({ account, onClose, onConnected }) {
    const [qrDataUrl, setQrDataUrl] = useState(null);
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
                while (true) {
                    const { value, done } = await reader.read();
                    if (done || cancelled) break;
                    buf += dec.decode(value, { stream: true });
                    const lines = buf.split('\n');
                    buf = lines.pop();
                    for (const line of lines) {
                        if (!line.startsWith('data:')) continue;
                        try {
                            const ev = JSON.parse(line.slice(5).trim());
                            if (ev.type === 'qr' && ev.qr) {
                                const du = await QRCode.toDataURL(ev.qr, { width: 256, margin: 1 });
                                if (!cancelled) { setQrDataUrl(du); setStatus('pending_qr'); }
                            }
                            if (ev.type === 'connected') { setStatus('connected'); onConnected(); setTimeout(onClose, 1200); }
                        } catch (_) {}
                    }
                }
            } catch { if (!cancelled) setStatus('error'); }
        })();

        return () => { cancelled = true; readerRef.current?.cancel(); };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scan with WhatsApp</h3>
                    <p className="text-sm text-slate-500 mt-1">Settings → Linked Devices → Link a Device</p>
                </div>
                <div className="p-6 flex flex-col items-center">
                    <div className="w-64 h-64 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                        {status === 'connected' ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-emerald-500">Connected!</p>
                            </div>
                        ) : qrDataUrl ? (
                            <img src={qrDataUrl} alt="QR" className="rounded-lg" width={248} height={248} />
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <div className="w-8 h-8 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin" />
                                <p className="text-xs">{status === 'error' ? 'Connection error — retry' : 'Generating QR…'}</p>
                            </div>
                        )}
                    </div>
                    {status === 'pending_qr' && (
                        <p className="text-xs text-slate-400 mt-4 text-center">QR expires in 60s — a new one generates automatically</p>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Meta Modal ────────────────────────────────────────────
function MetaModal({ account, onClose, onSaved }) {
    const [token, setToken] = useState('');
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [wabaId, setWabaId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!token || !phoneNumberId) return toast.error('Token and Phone Number ID required');
        setLoading(true);
        try {
            const r = await whatsappApi.saveMetaCredentials(account.id, { token, phoneNumberId, wabaId });
            toast.success(`Connected: ${r.phone || 'Meta account'}`);
            onSaved(); onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid credentials');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Meta Cloud API Credentials</h3>
                    <p className="text-sm text-slate-500 mt-1">From Meta Developer Console → WhatsApp → API Setup</p>
                </div>
                <div className="p-6 space-y-4">
                    {[
                        { label: 'Access Token *', value: token, set: setToken, type: 'password', ph: 'EAAxxxxxxx...' },
                        { label: 'Phone Number ID *', value: phoneNumberId, set: setPhoneNumberId, type: 'text', ph: '1234567890123456' },
                        { label: 'WhatsApp Business Account ID', value: wabaId, set: setWabaId, type: 'text', ph: 'Optional — for templates' },
                    ].map(f => (
                        <div key={f.label}>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{f.label}</label>
                            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50">
                        {loading ? 'Verifying…' : 'Save & Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Add Account Modal ─────────────────────────────────────
function AddModal({ onClose, onCreated }) {
    const [channel, setChannel] = useState('baileys');
    const [label, setLabel] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!label.trim()) return toast.error('Label required');
        setLoading(true);
        try {
            const r = await whatsappApi.createAccount({ channel, label });
            toast.success('Account created');
            onCreated(r); onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add WhatsApp Account</h3>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { v: 'baileys', title: 'Baileys', sub: 'Personal number via QR. No approval needed.', color: 'emerald' },
                            { v: 'meta', title: 'Meta API', sub: 'Official Business API. Requires Meta dev access.', color: 'blue' },
                        ].map(o => (
                            <button key={o.v} onClick={() => setChannel(o.v)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${channel === o.v ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                <div className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-white text-xs font-bold ${o.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                                    {o.v === 'baileys' ? 'B' : 'M'}
                                </div>
                                <p className={`text-sm font-semibold ${channel === o.v ? 'text-violet-600 dark:text-violet-400' : 'text-slate-800 dark:text-white'}`}>{o.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{o.sub}</p>
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Label</label>
                        <input autoFocus type="text" value={label} onChange={e => setLabel(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="e.g. Support, Sales, Marketing"
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button onClick={handleCreate} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50">
                        {loading ? 'Creating…' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Account Card ──────────────────────────────────────────
function AccountCard({ account, onRefresh }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [modal, setModal] = useState(null);
    const cfg = STATUS_CONFIG[account.status] || STATUS_CONFIG.disconnected;
    const isConnected = account.status === 'connected';

    const disconnectMutation = useMutation({
        mutationFn: () => whatsappApi.disconnectAccount(account.id),
        onSuccess: () => { toast.success('Disconnected'); onRefresh(); },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: () => whatsappApi.deleteAccount(account.id),
        onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries(['whatsapp-accounts']); },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
    });

    const handleConnect = async (e) => {
        e.stopPropagation();
        try {
            await whatsappApi.connectAccount(account.id);
            setModal('qr');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to start session');
        }
    };

    return (
        <>
            <div
                onClick={() => navigate(`/whatsapp/${account.id}`)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200"
            >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm ${account.channel === 'baileys' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                            {account.channel === 'baileys' ? '⚡' : 'M'}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{account.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {account.channel === 'baileys' ? 'Baileys · Personal' : 'Meta Cloud API'}
                            </p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                    </span>
                </div>

                {/* Phone number */}
                {account.phone ? (
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 mb-4">
                        {account.phone}
                    </div>
                ) : (
                    <div className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 mb-4 italic">
                        No number connected
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {!isConnected ? (
                        <button onClick={account.channel === 'baileys' ? handleConnect : (e) => { e.stopPropagation(); setModal('meta'); }}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                            {account.channel === 'baileys' ? 'Scan QR' : 'Enter Credentials'}
                        </button>
                    ) : (
                        <>
                            <button onClick={() => navigate(`/whatsapp/${account.id}`)}
                                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                                Open Inbox
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); disconnectMutation.mutate(); }}
                                disabled={disconnectMutation.isPending}
                                className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-700 transition-colors disabled:opacity-50">
                                Disconnect
                            </button>
                        </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${account.label}"?`)) deleteMutation.mutate(); }}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                {/* Hover arrow */}
                <div className="absolute top-4 right-16 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>

            {modal === 'qr' && <QRModal account={account} onClose={() => setModal(null)} onConnected={onRefresh} />}
            {modal === 'meta' && <MetaModal account={account} onClose={() => setModal(null)} onSaved={onRefresh} />}
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────
export default function WhatsAppSettings() {
    const [showAdd, setShowAdd] = useState(false);
    const queryClient = useQueryClient();

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['whatsapp-accounts'],
        queryFn: whatsappApi.getAccounts,
        staleTime: 30000,
        refetchInterval: 15000,
    });

    const refresh = () => queryClient.invalidateQueries(['whatsapp-accounts']);
    const napnix = accounts.filter(a => a.owner_type === 'napnix');
    const tenants = accounts.filter(a => a.owner_type === 'tenant');
    const connected = accounts.filter(a => a.status === 'connected').length;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">WhatsApp</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {connected} connected
                    </p>
                </div>
                <button onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Account
                </button>
            </div>

            {/* Stats bar */}
            {accounts.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Accounts', value: accounts.length, color: 'text-slate-900 dark:text-white' },
                        { label: 'Connected', value: connected, color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Pending / Offline', value: accounts.length - connected, color: 'text-slate-500' },
                    ].map(s => (
                        <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                </div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-2xl">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">💬</div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No WhatsApp accounts yet</p>
                    <p className="text-sm text-slate-400 mb-5">Add a Baileys or Meta account to start messaging</p>
                    <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
                        Add Account
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {napnix.length > 0 && (
                        <section>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Napnix Accounts</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {napnix.map(a => <AccountCard key={a.id} account={a} onRefresh={refresh} />)}
                            </div>
                        </section>
                    )}
                    {tenants.length > 0 && (
                        <section>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tenant Accounts</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {tenants.map(a => <AccountCard key={a.id} account={a} onRefresh={refresh} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {showAdd && <AddModal onClose={() => setShowAdd(false)} onCreated={refresh} />}
        </div>
    );
}
