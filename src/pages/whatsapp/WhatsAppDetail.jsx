import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { whatsappApi } from '../../api/whatsapp';

const STATUS_CONFIG = {
    connected:    { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20', label: 'Connected' },
    disconnected: { dot: 'bg-slate-400', badge: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20', label: 'Disconnected' },
    pending_qr:   { dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20', label: 'Awaiting Scan' },
    reconnecting: { dot: 'bg-blue-400 animate-pulse', badge: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20', label: 'Reconnecting' },
};

function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 9 }) {
    const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-pink-500'];
    const color = colors[(name || '?').charCodeAt(0) % colors.length];
    return (
        <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {initials}
        </div>
    );
}

// ── Conversation list ─────────────────────────────────────
function ConversationList({ accountId, selectedId, onSelect }) {
    const { data: convs = [], isLoading } = useQuery({
        queryKey: ['whatsapp-convs', accountId],
        queryFn: () => whatsappApi.getConversations(accountId),
        refetchInterval: 5000,
    });

    if (isLoading) return (
        <div className="flex flex-col gap-2 p-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
    );

    if (!convs.length) return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <div className="text-3xl mb-3">💬</div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No conversations yet</p>
            <p className="text-xs mt-1">Messages will appear here</p>
        </div>
    );

    return (
        <div className="overflow-y-auto flex-1">
            {convs.map(c => (
                <button key={c.id} onClick={() => onSelect(c)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-100 dark:border-slate-800 ${selectedId === c.id ? 'bg-violet-50 dark:bg-violet-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <Avatar name={c.contact_name || c.contact_phone} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {c.contact_name || c.contact_phone || c.contact_jid}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">{formatTime(c.last_message_at)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-slate-400 truncate">{c.last_message || 'No messages'}</p>
                            {c.unread_count > 0 && (
                                <span className="ml-2 bg-violet-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                                    {c.unread_count > 9 ? '9+' : c.unread_count}
                                </span>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

// ── Message thread ────────────────────────────────────────
function MessageThread({ conversation, account }) {
    const [text, setText] = useState('');
    const bottomRef = useRef(null);
    const queryClient = useQueryClient();

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['whatsapp-msgs', conversation.id],
        queryFn: () => whatsappApi.getMessages(conversation.id),
        refetchInterval: 3000,
    });

    const sendMutation = useMutation({
        mutationFn: (msg) => whatsappApi.sendMessage(conversation.id, msg),
        onSuccess: () => {
            setText('');
            queryClient.invalidateQueries(['whatsapp-msgs', conversation.id]);
            queryClient.invalidateQueries(['whatsapp-convs', account.id]);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to send'),
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSend = () => {
        if (!text.trim()) return;
        if (account.status !== 'connected') return toast.error('Account not connected');
        sendMutation.mutate(text.trim());
    };

    return (
        <div className="flex flex-col h-full">
            {/* Thread header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <Avatar name={conversation.contact_name || conversation.contact_phone} size={9} />
                <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {conversation.contact_name || conversation.contact_phone || conversation.contact_jid}
                    </p>
                    <p className="text-xs text-slate-400">{conversation.contact_phone || conversation.contact_jid?.replace('@s.whatsapp.net', '')}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 text-sm">No messages yet</div>
                ) : messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
                            msg.direction === 'outbound'
                                ? 'bg-violet-600 text-white rounded-br-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                        }`}>
                            <p className="text-sm leading-relaxed break-words">{msg.body || `[${msg.media_type}]`}</p>
                            <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-[10px] ${msg.direction === 'outbound' ? 'text-violet-200' : 'text-slate-400'}`}>
                                    {formatTime(msg.sent_at)}
                                </span>
                                {msg.direction === 'outbound' && (
                                    <svg className={`w-3 h-3 ${msg.status === 'read' ? 'text-blue-300' : 'text-violet-300'}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18 7l-8 8-4-4-1.5 1.5L10 18 19.5 8.5z"/>
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-end gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                        placeholder={account.status === 'connected' ? 'Type a message…' : 'Account not connected'}
                        disabled={account.status !== 'connected'}
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none disabled:opacity-50"
                        style={{ maxHeight: 120, overflowY: 'auto' }}
                    />
                    <button onClick={handleSend} disabled={!text.trim() || sendMutation.isPending || account.status !== 'connected'}
                        className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 shrink-0">
                        {sendMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
            </div>
        </div>
    );
}

// ── Main detail page ──────────────────────────────────────
export default function WhatsAppDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedConv, setSelectedConv] = useState(null);

    const { data: account, isLoading } = useQuery({
        queryKey: ['whatsapp-account', id],
        queryFn: () => whatsappApi.getStatus(id),
        refetchInterval: 10000,
    });

    const disconnectMutation = useMutation({
        mutationFn: () => whatsappApi.disconnectAccount(id),
        onSuccess: () => { toast.success('Disconnected'); queryClient.invalidateQueries(['whatsapp-account', id]); },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
    });

    if (isLoading) return (
        <div className="flex items-center justify-center -m-6 h-[calc(100vh-64px)]">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!account) return (
        <div className="flex items-center justify-center -m-6 h-[calc(100vh-64px)] text-slate-400">Account not found</div>
    );

    const cfg = STATUS_CONFIG[account.status] || STATUS_CONFIG.disconnected;

    return (
        <div className="flex flex-col -m-6 h-[calc(100vh-64px)]">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/whatsapp')}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${account.channel === 'baileys' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                            {account.channel === 'baileys' ? '⚡' : 'M'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-slate-900 dark:text-white">{account.label}</h1>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                    {cfg.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {account.phone || (account.channel === 'baileys' ? 'Not connected' : 'Meta API')}
                                {account.owner_id ? ` · Tenant: ${account.owner_id}` : ' · Napnix'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {account.status === 'connected' && (
                        <button onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}
                            className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:border-rose-300 transition-colors disabled:opacity-50">
                            Disconnect
                        </button>
                    )}
                    {account.status !== 'connected' && account.channel === 'baileys' && (
                        <button onClick={() => navigate('/whatsapp')}
                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                            Connect Number
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Conversations sidebar */}
                <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversations</p>
                    </div>
                    <ConversationList
                        accountId={id}
                        selectedId={selectedConv?.id}
                        onSelect={setSelectedConv}
                    />
                </div>

                {/* Message thread */}
                <div className="flex-1 bg-slate-50 dark:bg-slate-950">
                    {selectedConv ? (
                        <MessageThread conversation={selectedConv} account={account} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                            <div className="text-5xl mb-4">💬</div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Select a conversation</p>
                            <p className="text-sm mt-1">Messages will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
