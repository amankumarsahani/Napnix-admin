import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { whatsappApi } from '../../api/whatsapp';

const STATUS_COLORS = {
    connected:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    disconnected: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    pending_qr:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    reconnecting: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const STATUS_DOT = {
    connected:    'bg-emerald-500',
    disconnected: 'bg-slate-400',
    pending_qr:   'bg-amber-500 animate-pulse',
    reconnecting: 'bg-blue-500 animate-pulse',
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

        const startStream = async () => {
            try {
                const resp = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const reader = resp.body.getReader();
                readerRef.current = reader;
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done || cancelled) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (!line.startsWith('data:')) continue;
                        try {
                            const event = JSON.parse(line.slice(5).trim());
                            if (event.type === 'qr' && event.qr) {
                                const dataUrl = await QRCode.toDataURL(event.qr, { width: 256, margin: 2 });
                                if (!cancelled) setQrDataUrl(dataUrl);
                                setStatus('pending_qr');
                            }
                            if (event.type === 'connected') {
                                setStatus('connected');
                                onConnected();
                                setTimeout(onClose, 1500);
                            }
                            if (event.type === 'disconnected') {
                                setStatus('disconnected');
                            }
                        } catch (_) {}
                    }
                }
            } catch (err) {
                if (!cancelled) setStatus('error');
            }
        };

        startStream();

        return () => {
            cancelled = true;
            readerRef.current?.cancel();
        };
    }, [account.session_id]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Scan QR Code</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                    Open WhatsApp → Linked Devices → Link a Device
                </p>

                <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-5 min-h-[272px]">
                    {status === 'connected' ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="font-semibold text-emerald-600">Connected!</p>
                        </div>
                    ) : qrDataUrl ? (
                        <img src={qrDataUrl} alt="WhatsApp QR" className="rounded-lg" width={256} height={256} />
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <div className="w-10 h-10 border-2 border-slate-300 border-t-brand-500 rounded-full animate-spin" />
                            <p className="text-sm">
                                {status === 'error' ? 'Connection failed — try again' : 'Waiting for QR…'}
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ── Meta Credentials Modal ────────────────────────────────
function MetaModal({ account, onClose, onSaved }) {
    const [token, setToken] = useState('');
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [wabaId, setWabaId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!token || !phoneNumberId) return toast.error('Token and Phone Number ID required');
        setLoading(true);
        try {
            const result = await whatsappApi.saveMetaCredentials(account.id, { token, phoneNumberId, wabaId });
            toast.success(`Connected: ${result.phone || 'Meta account'}`);
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Meta Cloud API</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                    Enter your WhatsApp Business API credentials from Meta Developer Console.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                            Access Token *
                        </label>
                        <input
                            type="password"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            placeholder="EAAxxxxxxx..."
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                            Phone Number ID *
                        </label>
                        <input
                            type="text"
                            value={phoneNumberId}
                            onChange={e => setPhoneNumberId(e.target.value)}
                            placeholder="1234567890123456"
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                            WhatsApp Business Account ID (optional)
                        </label>
                        <input
                            type="text"
                            value={wabaId}
                            onChange={e => setWabaId(e.target.value)}
                            placeholder="For template management"
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Verifying…' : 'Save & Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Add Account Modal ─────────────────────────────────────
function AddAccountModal({ onClose, onCreated }) {
    const [channel, setChannel] = useState('baileys');
    const [label, setLabel] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!label.trim()) return toast.error('Label required');
        setLoading(true);
        try {
            const result = await whatsappApi.createAccount({ channel, label });
            toast.success('Account created');
            onCreated(result);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add WhatsApp Account</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                    Choose channel type and give this account a label.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                            Channel Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'baileys', title: 'Baileys', desc: 'Personal/business number via QR scan. No Meta approval needed.' },
                                { value: 'meta', title: 'Meta API', desc: 'Official WhatsApp Business API. Requires Meta developer access.' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setChannel(opt.value)}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                                        channel === opt.value
                                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <p className={`text-sm font-semibold mb-1 ${channel === opt.value ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-white'}`}>
                                        {opt.title}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                            Label
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder="e.g. Support, Sales, Marketing"
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating…' : 'Create Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Account Card ──────────────────────────────────────────
function AccountCard({ account, onRefresh }) {
    const [modal, setModal] = useState(null); // 'qr' | 'meta' | null
    const queryClient = useQueryClient();

    const disconnectMutation = useMutation({
        mutationFn: () => whatsappApi.disconnectAccount(account.id),
        onSuccess: () => {
            toast.success('Disconnected');
            onRefresh();
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: () => whatsappApi.deleteAccount(account.id),
        onSuccess: () => {
            toast.success('Account deleted');
            queryClient.invalidateQueries(['whatsapp-accounts']);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
    });

    const handleConnect = async () => {
        try {
            await whatsappApi.connectAccount(account.id);
            setModal('qr');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to start session');
        }
    };

    const isConnected = account.status === 'connected';

    return (
        <>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                            account.channel === 'baileys' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}>
                            {account.channel === 'baileys' ? 'B' : 'M'}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{account.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {account.channel === 'baileys' ? 'Baileys (Personal)' : 'Meta Cloud API'}
                            </p>
                        </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[account.status] || STATUS_COLORS.disconnected}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[account.status] || STATUS_DOT.disconnected}`} />
                        {account.status?.replace('_', ' ') || 'disconnected'}
                    </span>
                </div>

                {/* Phone */}
                {account.phone && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 font-mono">
                        {account.phone}
                    </div>
                )}

                {/* Owner info */}
                {account.owner_type === 'tenant' && (
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                        Tenant: <span className="font-medium text-slate-600 dark:text-slate-300">{account.owner_id}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    {account.owner_type === 'napnix' && (
                        <>
                            {!isConnected ? (
                                <button
                                    onClick={account.channel === 'baileys' ? handleConnect : () => setModal('meta')}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                                >
                                    {account.channel === 'baileys' ? 'Scan QR' : 'Enter Credentials'}
                                </button>
                            ) : (
                                <>
                                    {account.channel === 'meta' && (
                                        <button
                                            onClick={() => setModal('meta')}
                                            className="flex-1 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            Update Creds
                                        </button>
                                    )}
                                    <button
                                        onClick={() => disconnectMutation.mutate()}
                                        disabled={disconnectMutation.isPending}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
                                    >
                                        Disconnect
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    <button
                        onClick={() => {
                            if (confirm(`Delete "${account.label}"?`)) deleteMutation.mutate();
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
                        title="Delete account"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {modal === 'qr' && (
                <QRModal
                    account={account}
                    onClose={() => setModal(null)}
                    onConnected={onRefresh}
                />
            )}
            {modal === 'meta' && (
                <MetaModal
                    account={account}
                    onClose={() => setModal(null)}
                    onSaved={onRefresh}
                />
            )}
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────
export default function WhatsAppSettings() {
    const [showAdd, setShowAdd] = useState(false);
    const queryClient = useQueryClient();

    const { data: accounts = [], isLoading, error } = useQuery({
        queryKey: ['whatsapp-accounts'],
        queryFn: whatsappApi.getAccounts,
        staleTime: 30 * 1000,
        refetchInterval: 15 * 1000,
    });

    const refresh = () => queryClient.invalidateQueries(['whatsapp-accounts']);

    const napnixAccounts = accounts.filter(a => a.owner_type === 'napnix');
    const tenantAccounts = accounts.filter(a => a.owner_type === 'tenant');

    if (error) {
        return (
            <div className="p-6 text-center text-rose-500">
                Failed to load WhatsApp accounts: {error.message}
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">WhatsApp</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Manage Baileys sessions and Meta Cloud API accounts
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Account
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 animate-pulse h-40" />
                    ))}
                </div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-semibold mb-1">No WhatsApp accounts</p>
                    <p className="text-sm text-slate-400 mb-4">Add a Baileys or Meta account to get started</p>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
                    >
                        Add Account
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {napnixAccounts.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                                Napnix Accounts
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {napnixAccounts.map(a => (
                                    <AccountCard key={a.id} account={a} onRefresh={refresh} />
                                ))}
                            </div>
                        </section>
                    )}

                    {tenantAccounts.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                                Tenant Accounts
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {tenantAccounts.map(a => (
                                    <AccountCard key={a.id} account={a} onRefresh={refresh} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {showAdd && (
                <AddAccountModal
                    onClose={() => setShowAdd(false)}
                    onCreated={refresh}
                />
            )}
        </div>
    );
}
