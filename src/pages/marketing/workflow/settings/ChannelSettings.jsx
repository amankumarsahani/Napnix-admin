import { LABEL_CLS, CONTROL_CLS } from './controls';

export default function ChannelSettings({ selectedNode, localConfig, setLocalConfig, waAccounts }) {
    return (
        <>
                        {/* Action: Send WhatsApp / Reply on WhatsApp */}
                        {selectedNode.type === 'whatsapp' && (
                            <>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-1">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                        <span className="font-semibold text-sm">
                                            {selectedNode.data.actionType === 'send_whatsapp_reply' ? 'Reply on WhatsApp' : 'Send WhatsApp Message'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        {selectedNode.data.actionType === 'send_whatsapp_reply'
                                            ? 'Replies to the person who sent the incoming message. Use {{from_phone}} to reply back.'
                                            : 'Sends a WhatsApp message via a connected account. Use {{variable}} to inject dynamic data.'}
                                    </p>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        WhatsApp Account
                                    </label>
                                    <select
                                        value={localConfig?.account_id || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, account_id: parseInt(e.target.value) || '' })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Select connected account…</option>
                                        {waAccounts.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.label} {a.phone ? `(${a.phone})` : ''} — {a.channel === 'baileys' ? 'Personal' : 'Meta API'}
                                            </option>
                                        ))}
                                    </select>
                                    {waAccounts.length === 0 && (
                                        <p className="text-xs text-amber-500 mt-1">No connected accounts. Go to WhatsApp settings to connect one.</p>
                                    )}
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        To Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.to_phone || (selectedNode.data.actionType === 'send_whatsapp_reply' ? '{{from_phone}}' : '{{phone}}')}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-sm font-mono"
                                        placeholder={selectedNode.data.actionType === 'send_whatsapp_reply' ? '{{from_phone}}' : '{{phone}} or +919876543210'}
                                    />
                                    <p className="text-[10px] text-fg-subtle mt-1">
                                        {selectedNode.data.actionType === 'send_whatsapp_reply'
                                            ? 'Use {{from_phone}} to reply to the sender'
                                            : 'Lead variables: {{phone}}, {{contact_phone}}'}
                                    </p>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        Message
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={localConfig?.message || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, message: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder={selectedNode.data.actionType === 'send_whatsapp_reply'
                                            ? 'Hi {{from_name}}, {{ai_reply}}'
                                            : 'Hi {{name}}, {{wa_message}}'}
                                    />
                                    <div className="mt-1.5 p-2 bg-surface-2 rounded text-[10px] text-fg-muted space-y-0.5">
                                        {selectedNode.data.actionType === 'send_whatsapp_reply' ? (
                                            <>
                                                <div><strong className="text-fg-muted">Incoming message:</strong> {'{{from_name}}'}, {'{{from_phone}}'}, {'{{message_text}}'}</div>
                                                <div><strong className="text-fg-muted">AI output:</strong> {'{{ai_reply}}'} (set in AI node's "Store Result In" field)</div>
                                            </>
                                        ) : (
                                            <>
                                                <div><strong className="text-fg-muted">Lead variables:</strong> {'{{name}}'}, {'{{email}}'}, {'{{phone}}'}, {'{{company}}'}</div>
                                                <div><strong className="text-fg-muted">AI output:</strong> {'{{wa_message}}'}, {'{{wa_followup}}'}, {'{{ai_response}}'}</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Loop Over Items */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'loop_items' && (
                            <>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    <span className="font-semibold text-sm text-indigo-700 dark:text-indigo-300">Loop Over Items</span>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                        Runs every node connected after this one once per item. Inside the loop use {'{{item}}'}, {'{{item.title}}'}, {'{{item_index}}'}.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Items</label>
                                    <input type="text" value={localConfig?.items || ''} onChange={(e) => setLocalConfig({ ...localConfig, items: e.target.value })} placeholder="{{keyword_suggestions}}" className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-sm font-mono" />
                                    <p className="text-xs text-fg-muted mt-1">A list from an earlier node, or one value per line.</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Max Items</label>
                                    <input type="number" min={1} max={200} value={localConfig?.max_items || 50} onChange={(e) => setLocalConfig({ ...localConfig, max_items: parseInt(e.target.value) || 50 })} className={CONTROL_CLS} />
                                </div>
                            </>
                        )}
        </>
    );
}
