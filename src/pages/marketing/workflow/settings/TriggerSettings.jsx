import toast from 'react-hot-toast';
import { LABEL_CLS, CONTROL_CLS, HINT_CLS } from './controls';

export default function TriggerSettings({ selectedNode, localConfig, setLocalConfig, id, isNew, waAccounts }) {
    return (
        <>
                        {/* Trigger-specific config: Lead Created */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'lead_created' || selectedNode.data.label === 'Lead Created') && (
                            <>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                        Triggers when a new lead is created
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Source
                                    </label>
                                    <select
                                        value={localConfig?.source_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, source_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All Sources</option>
                                        <option value="website">Website</option>
                                        <option value="referral">Referral</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="cold_outreach">Cold Outreach</option>
                                        <option value="advertisement">Advertisement</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <p className={HINT_CLS}>Leave empty to trigger for all leads</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Initial Status
                                    </label>
                                    <select
                                        value={localConfig?.status_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, status_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="proposal_sent">Proposal Sent</option>
                                        <option value="negotiating">Negotiating</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Client Created */}
                        {selectedNode.type === 'trigger' && selectedNode.data.triggerType === 'client_created' && (
                            <>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                        Triggers when a new client is created
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Client Type
                                    </label>
                                    <select
                                        value={localConfig?.client_type_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, client_type_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All Client Types</option>
                                        <option value="individual">Individual</option>
                                        <option value="business">Business</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                    <p className={HINT_CLS}>Leave empty to trigger for all clients</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Source
                                    </label>
                                    <select
                                        value={localConfig?.source_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, source_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All Sources</option>
                                        <option value="conversion">Lead Conversion</option>
                                        <option value="direct">Direct Signup</option>
                                        <option value="referral">Referral</option>
                                        <option value="import">Imported</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Lead Status Changed */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'lead_status_changed' || selectedNode.data.label === 'Lead Status Changed') && (
                            <>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                        Triggers when a lead's status changes
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        From Status
                                    </label>
                                    <select
                                        value={localConfig?.from_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="proposal_sent">Proposal Sent</option>
                                        <option value="negotiating">Negotiating</option>
                                        <option value="won">Won</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                    <p className={HINT_CLS}>The status the lead is changing FROM</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        To Status
                                    </label>
                                    <select
                                        value={localConfig?.to_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="proposal_sent">Proposal Sent</option>
                                        <option value="negotiating">Negotiating</option>
                                        <option value="won">Won</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                    <p className={HINT_CLS}>The status the lead is changing TO</p>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Client Status Changed */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'client_status_changed' || selectedNode.data.label === 'Client Status Changed') && (
                            <>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                        Triggers when a client's status changes
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        From Status
                                    </label>
                                    <select
                                        value={localConfig?.from_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="churned">Churned</option>
                                    </select>
                                    <p className={HINT_CLS}>The status the client is changing FROM</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        To Status
                                    </label>
                                    <select
                                        value={localConfig?.to_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="churned">Churned</option>
                                    </select>
                                    <p className={HINT_CLS}>The status the client is changing TO</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Client Type
                                    </label>
                                    <select
                                        value={localConfig?.client_type_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, client_type_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All Client Types</option>
                                        <option value="individual">Individual</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Inquiry Created */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'inquiry_created' || selectedNode.data.label === 'Inquiry Created') && (
                            <>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                        Triggers when a new inquiry is submitted
                                    </p>
                                </div>
                                <div className="text-xs text-fg-muted mt-2 italic text-center p-4 border border-dashed border-border-strong rounded-lg">
                                    No additional filters needed for this trigger.
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Inquiry Status Updated */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'inquiry_status_updated' || selectedNode.data.label === 'Inquiry Status Updated') && (
                            <>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                        Triggers when an inquiry's status changes
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        From Status
                                    </label>
                                    <select
                                        value={localConfig?.from_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="converted">Converted</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        To Status
                                    </label>
                                    <select
                                        value={localConfig?.to_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="converted">Converted</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Scheduled */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'scheduled' || selectedNode.data.label === 'Scheduled') && (
                            <>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">
                                        Triggers on a scheduled time
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Schedule Type
                                    </label>
                                    <select
                                        value={localConfig?.schedule_type || 'daily'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, schedule_type: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="once">One-time</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Time (24-hour format)
                                    </label>
                                    <input
                                        type="time"
                                        value={localConfig?.schedule_time || '09:00'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, schedule_time: e.target.value })}
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                {localConfig?.schedule_type === 'weekly' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Day of Week
                                        </label>
                                        <select
                                            value={localConfig?.day_of_week || 'monday'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, day_of_week: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            <option value="monday">Monday</option>
                                            <option value="tuesday">Tuesday</option>
                                            <option value="wednesday">Wednesday</option>
                                            <option value="thursday">Thursday</option>
                                            <option value="friday">Friday</option>
                                            <option value="saturday">Saturday</option>
                                            <option value="sunday">Sunday</option>
                                        </select>
                                    </div>
                                )}
                                {localConfig?.schedule_type === 'monthly' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Day of Month
                                        </label>
                                        <select
                                            value={localConfig?.day_of_month || '1'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, day_of_month: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            {[...Array(28)].map((_, i) => (
                                                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                                            ))}
                                        </select>
                                        <p className={HINT_CLS}>Limited to 28 to avoid issues with short months</p>
                                    </div>
                                )}
                                {localConfig?.schedule_type === 'once' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={localConfig?.schedule_date || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, schedule_date: e.target.value })}
                                            className={CONTROL_CLS}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className={LABEL_CLS}>
                                        Target Entities
                                    </label>
                                    <select
                                        value={localConfig?.target_entity || 'all_leads'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, target_entity: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="all_leads">All Active Leads</option>
                                        <option value="all_clients">All Active Clients</option>
                                        <option value="new_leads">New Leads (last 7 days)</option>
                                        <option value="inactive_leads">Inactive Leads (30+ days)</option>
                                    </select>
                                    <p className={HINT_CLS}>Which entities to run this workflow on</p>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Stripe Events */}
                        {selectedNode.type === 'trigger' && (
                            ['stripe_payment_received', 'stripe_subscription_created', 'stripe_subscription_cancelled', 'stripe_invoice_paid'].includes(selectedNode.data.triggerType) ||
                            selectedNode.data.label.toLowerCase().includes('stripe')
                        ) && (
                                <>
                                    <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                                        <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
                                            Stripe Event: {selectedNode.data.label}
                                        </p>
                                        <p className="text-xs text-fg-muted mt-1">
                                            Trigger automations based on real payment events.
                                        </p>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Filter by Plan
                                        </label>
                                        <select
                                            value={localConfig?.plan_id || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, plan_id: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            <option value="">All Plans</option>
                                            <option value="starter">Starter Plan</option>
                                            <option value="growth">Growth Plan</option>
                                            <option value="business">Business Plan</option>
                                        </select>
                                        <p className={HINT_CLS}>Leave empty to trigger for all plans</p>
                                    </div>
                                    {selectedNode.data.triggerType === 'stripe_invoice_paid' && (
                                        <div>
                                            <label className={LABEL_CLS}>
                                                Minimum Amount (USD)
                                            </label>
                                            <input
                                                type="number"
                                                value={localConfig?.min_amount || ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, min_amount: e.target.value })}
                                                className={CONTROL_CLS}
                                                placeholder="e.g. 50"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                        {/* Trigger-specific config: Incoming Webhook */}
                        {selectedNode.type === 'trigger' && selectedNode.data.triggerType === 'webhook_received' && (
                            <>
                                <div className="p-3 bg-surface-3 rounded-lg border border-border-strong">
                                    <p className="text-sm text-fg font-medium">Incoming Webhook</p>
                                    <p className="text-xs text-fg-muted mt-1">
                                        Any app can start this workflow by POSTing JSON to the URL below. Its fields become variables, e.g. {'{{email}}'}.
                                    </p>
                                </div>
                                {localConfig?.webhook_secret ? (
                                    <div>
                                        <label className={LABEL_CLS}>Webhook URL</label>
                                        {isNew ? (
                                            <p className="text-xs text-amber-600">Save the workflow first; the URL includes its ID.</p>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input readOnly value={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api')}/workflows/hooks/${id}/${localConfig.webhook_secret}`} className="flex-1 min-w-0 px-3 py-2 border border-border-strong rounded-lg bg-surface-2 text-fg text-xs font-mono" />
                                                <button type="button" onClick={() => { navigator.clipboard.writeText(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api')}/workflows/hooks/${id}/${localConfig.webhook_secret}`); toast.success('Webhook URL copied'); }} className="px-3 py-2 text-xs font-medium rounded-lg border border-border-strong text-fg">Copy</button>
                                            </div>
                                        )}
                                        <p className="text-xs text-fg-muted mt-1">Treat this URL like a password. The workflow must be active.</p>
                                    </div>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => setLocalConfig({ ...localConfig, webhook_secret: crypto.randomUUID().replace(/-/g, '') })}
                                    className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-border-strong text-fg hover:bg-surface-2"
                                >
                                    {localConfig?.webhook_secret ? 'Regenerate secret (old URL stops working)' : 'Generate webhook URL'}
                                </button>
                            </>
                        )}

                        {/* Trigger-specific config: Manual */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'manual' || selectedNode.data.label === 'Manual Trigger') && (
                            <>
                                <div className="p-3 bg-surface-3 rounded-lg border border-border-strong">
                                    <p className="text-sm text-fg font-medium">
                                        Manually triggered workflow
                                    </p>
                                    <p className="text-xs text-fg-muted mt-1">
                                        Run this workflow on-demand from the workflows list
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Target Entity Type
                                    </label>
                                    <select
                                        value={localConfig?.target_type || 'leads'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, target_type: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="leads">Leads</option>
                                        <option value="clients">Clients</option>
                                        <option value="selected">Selected Entities Only</option>
                                    </select>
                                    <p className={HINT_CLS}>When triggered, run on these entities</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter Query (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.filter_query || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, filter_query: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="status:qualified AND source:website"
                                    />
                                    <p className={HINT_CLS}>Filter entities before running</p>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: WhatsApp Message Received */}
                        {selectedNode.type === 'trigger' && selectedNode.data.triggerType === 'whatsapp_message_received' && (
                            <>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                        Triggers when a WhatsApp message is received
                                    </p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                                        Available in next nodes: {'{{from_phone}}'}, {'{{from_name}}'}, {'{{message_text}}'}, {'{{account_id}}'}
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Account (Optional)
                                    </label>
                                    <select
                                        value={localConfig?.account_id_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, account_id_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All accounts</option>
                                        {waAccounts.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.label} {a.phone ? `(${a.phone})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className={HINT_CLS}>Leave empty to trigger for messages on any account</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Keyword Filter (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.keyword_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, keyword_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="e.g. pricing, help, demo"
                                    />
                                    <p className={HINT_CLS}>Only trigger if message contains this word (comma-separated for multiple)</p>
                                </div>
                            </>
                        )}
        </>
    );
}
