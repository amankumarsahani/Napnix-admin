import SearchableSelect from '../../../components/common/SearchableSelect';

const WorkflowNodeConfig = ({
    selectedNode,
    localLabel,
    setLocalLabel,
    localConfig,
    setLocalConfig,
    showNodeConfig,
    setShowNodeConfig,
    applyNodeConfig,
    isApplyingConfig,
    emailTemplates,
    documentTemplates
}) => {
    if (!showNodeConfig || !selectedNode) return null;

    return (
        <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Configure Node</h3>
                <button
                    onClick={() => setShowNodeConfig(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Label
                    </label>
                    <input
                        type="text"
                        value={localLabel}
                        onChange={(e) => setLocalLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    />
                </div>

                {/* Trigger-specific config: Lead Created */}
                {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'lead_created' || selectedNode.data.label === 'Lead Created') && (
                    <>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                Triggers when a new lead is created
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Filter by Source
                            </label>
                            <select
                                value={localConfig?.source_filter || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, source_filter: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">All Sources</option>
                                <option value="website">Website</option>
                                <option value="referral">Referral</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="cold_outreach">Cold Outreach</option>
                                <option value="advertisement">Advertisement</option>
                                <option value="other">Other</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Leave empty to trigger for all leads</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Filter by Initial Status
                            </label>
                            <select
                                value={localConfig?.status_filter || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, status_filter: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Filter by Client Type
                            </label>
                            <select
                                value={localConfig?.client_type_filter || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, client_type_filter: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">All Client Types</option>
                                <option value="individual">Individual</option>
                                <option value="business">Business</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Leave empty to trigger for all clients</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Filter by Source
                            </label>
                            <select
                                value={localConfig?.source_filter || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, source_filter: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                From Status
                            </label>
                            <select
                                value={localConfig?.from_status || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                            <p className="text-xs text-slate-400 mt-1">The status the lead is changing FROM</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                To Status
                            </label>
                            <select
                                value={localConfig?.to_status || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                            <p className="text-xs text-slate-400 mt-1">The status the lead is changing TO</p>
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                From Status
                            </label>
                            <select
                                value={localConfig?.from_status || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">Any Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                                <option value="churned">Churned</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">The status the client is changing FROM</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                To Status
                            </label>
                            <select
                                value={localConfig?.to_status || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">Any Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                                <option value="churned">Churned</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">The status the client is changing TO</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Filter by Client Type
                            </label>
                            <select
                                value={localConfig?.client_type_filter || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, client_type_filter: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic text-center p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                From Status
                            </label>
                            <select
                                value={localConfig?.from_status || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">Any Status</option>
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="resolved">Resolved</option>
                                <option value="converted">Converted</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                To Status
                            </label>
                            <select
                                value={localConfig?.to_status || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Schedule Type
                            </label>
                            <select
                                value={localConfig?.schedule_type || 'daily'}
                                onChange={(e) => setLocalConfig({ ...localConfig, schedule_type: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="once">One-time</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Time (24-hour format)
                            </label>
                            <input
                                type="time"
                                value={localConfig?.schedule_time || '09:00'}
                                onChange={(e) => setLocalConfig({ ...localConfig, schedule_time: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        {localConfig?.schedule_type === 'weekly' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Day of Week
                                </label>
                                <select
                                    value={localConfig?.day_of_week || 'monday'}
                                    onChange={(e) => setLocalConfig({ ...localConfig, day_of_week: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Day of Month
                                </label>
                                <select
                                    value={localConfig?.day_of_month || '1'}
                                    onChange={(e) => setLocalConfig({ ...localConfig, day_of_month: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                >
                                    {[...Array(28)].map((_, i) => (
                                        <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Limited to 28 to avoid issues with short months</p>
                            </div>
                        )}
                        {localConfig?.schedule_type === 'once' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={localConfig?.schedule_date || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, schedule_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Target Entities
                            </label>
                            <select
                                value={localConfig?.target_entity || 'all_leads'}
                                onChange={(e) => setLocalConfig({ ...localConfig, target_entity: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="all_leads">All Active Leads</option>
                                <option value="all_clients">All Active Clients</option>
                                <option value="new_leads">New Leads (last 7 days)</option>
                                <option value="inactive_leads">Inactive Leads (30+ days)</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Which entities to run this workflow on</p>
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
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Trigger automations based on real payment events.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Filter by Plan
                                </label>
                                <select
                                    value={localConfig?.plan_id || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, plan_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="">All Plans</option>
                                    <option value="starter">Starter Plan</option>
                                    <option value="growth">Growth Plan</option>
                                    <option value="business">Business Plan</option>
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Leave empty to trigger for all plans</p>
                            </div>
                            {selectedNode.data.triggerType === 'stripe_invoice_paid' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Minimum Amount (USD)
                                    </label>
                                    <input
                                        type="number"
                                        value={localConfig?.min_amount || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, min_amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="e.g. 50"
                                    />
                                </div>
                            )}
                        </>
                    )}

                {/* Trigger-specific config: Manual */}
                {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'manual' || selectedNode.data.label === 'Manual Trigger') && (
                    <>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600">
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                Manually triggered workflow
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Run this workflow on-demand from the workflows list
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Target Entity Type
                            </label>
                            <select
                                value={localConfig?.target_type || 'leads'}
                                onChange={(e) => setLocalConfig({ ...localConfig, target_type: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="leads">Leads</option>
                                <option value="clients">Clients</option>
                                <option value="selected">Selected Entities Only</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">When triggered, run on these entities</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Filter Query (Optional)
                            </label>
                            <input
                                type="text"
                                value={localConfig?.filter_query || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, filter_query: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="status:qualified AND source:website"
                            />
                            <p className="text-xs text-slate-400 mt-1">Filter entities before running</p>
                        </div>
                    </>
                )}

                {/* Action-specific config */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'send_email' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Email Template
                            </label>
                            <SearchableSelect
                                options={emailTemplates}
                                value={localConfig?.template_id || ''}
                                onChange={(val, template) => {
                                    if (val && template) {
                                        setLocalConfig({
                                            ...localConfig,
                                            template_id: parseInt(val),
                                            subject: template.subject,
                                            body: template.body || template.html_content || template.content
                                        });
                                    } else {
                                        setLocalConfig({ ...localConfig, template_id: null });
                                    }
                                }}
                                placeholder="Search email templates..."
                                emptyLabel="Custom (enter below)"
                                getOptionLabel={(t) => t.name || t.subject || 'Untitled'}
                                getOptionValue={(t) => t.id}
                                renderOption={(t) => (
                                    <span className="flex items-center gap-2">
                                        <span>{t.name}</span>
                                        {t.category && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400">{t.category}</span>}
                                    </span>
                                )}
                                hint={emailTemplates.length === 0 ? 'No templates found. Go to Templates to create one.' : 'Type to search or select a template'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                To Email (Recipient)
                            </label>
                            <input
                                type="text"
                                value={localConfig?.to_email || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, to_email: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="{{email}}"
                            />
                            <p className="text-xs text-slate-400 mt-1">Use {"{{email}}"} for the inquiry/lead email address</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Email Subject
                            </label>
                            <input
                                type="text"
                                value={localConfig?.subject || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, subject: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="Welcome {{contact_name}}!"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Email Body
                            </label>
                            <textarea
                                rows={4}
                                value={localConfig?.body || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, body: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="Hello {{contact_name}}, ..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Attach Document as PDF
                            </label>
                            <SearchableSelect
                                options={documentTemplates}
                                value={localConfig?.document_slug || ''}
                                onChange={(val, doc) => {
                                    if (val && doc) {
                                        setLocalConfig({
                                            ...localConfig,
                                            document_slug: val,
                                            attachment_filename: `NexSpire-${(doc.name || val).replace(/\s+/g, '-')}-{{slug}}.pdf`
                                        });
                                    } else {
                                        setLocalConfig({ ...localConfig, document_slug: '', attachment_filename: '' });
                                    }
                                }}
                                placeholder="Search document templates..."
                                emptyLabel="None (no attachment)"
                                getOptionLabel={(d) => `${d.name} (${d.category || 'general'})`}
                                getOptionValue={(d) => d.slug}
                                renderOption={(d) => (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>{d.name}</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400">{d.category}</span>
                                    </span>
                                )}
                                hint={localConfig?.document_slug
                                    ? undefined
                                    : 'Optionally attach a document template as a PDF file'
                                }
                            />
                            {localConfig?.document_slug && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                    This document will be rendered as PDF and attached to the email.
                                </p>
                            )}
                        </div>
                    </>
                )}

                {/* Action: Update Lead */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'update_lead' && (
                    <>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                Updates fields on the lead
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Update Status To
                            </label>
                            <select
                                value={localConfig?.new_status || ''}
                                onChange={(e) => setLocalConfig({
                                    ...localConfig,
                                    new_status: e.target.value,
                                    updates: { ...localConfig?.updates, status: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">-- No change --</option>
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                                <option value="proposal_sent">Proposal Sent</option>
                                <option value="negotiating">Negotiating</option>
                                <option value="won">Won</option>
                                <option value="lost">Lost</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Update Source To
                            </label>
                            <select
                                value={localConfig?.new_source || ''}
                                onChange={(e) => setLocalConfig({
                                    ...localConfig,
                                    new_source: e.target.value,
                                    updates: { ...localConfig?.updates, source: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">-- No change --</option>
                                <option value="website">Website</option>
                                <option value="referral">Referral</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="cold_outreach">Cold Outreach</option>
                                <option value="advertisement">Advertisement</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Add Tags (comma-separated)
                            </label>
                            <input
                                type="text"
                                value={localConfig?.add_tags || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, add_tags: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="hot-lead, follow-up"
                            />
                        </div>
                    </>
                )}

                {/* Action: Update Client */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'update_client' && (
                    <>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                Updates fields on the client
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Update Status To
                            </label>
                            <select
                                value={localConfig?.new_status || ''}
                                onChange={(e) => setLocalConfig({
                                    ...localConfig,
                                    new_status: e.target.value,
                                    updates: { ...localConfig?.updates, status: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">-- No change --</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                                <option value="churned">Churned</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Update Client Type To
                            </label>
                            <select
                                value={localConfig?.new_client_type || ''}
                                onChange={(e) => setLocalConfig({
                                    ...localConfig,
                                    new_client_type: e.target.value,
                                    updates: { ...localConfig?.updates, client_type: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">-- No change --</option>
                                <option value="individual">Individual</option>
                                <option value="business">Business</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Add Tags (comma-separated)
                            </label>
                            <input
                                type="text"
                                value={localConfig?.add_tags || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, add_tags: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    </>
                )}

                {/* Action: Update Inquiry */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'update_inquiry' && (
                    <>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                Updates the status of the inquiry
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Set Status to
                            </label>
                            <select
                                value={localConfig?.updates?.status || ''}
                                onChange={(e) => setLocalConfig({
                                    ...localConfig,
                                    updates: { ...localConfig.updates, status: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">-- No change --</option>
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="resolved">Resolved</option>
                                <option value="converted">Converted</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Action: Create Task */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'create_task' && (
                    <>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                                Creates a new task
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Task Title
                            </label>
                            <input
                                type="text"
                                value={localConfig?.title || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="Follow up with {{contact_name}}"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Task Description
                            </label>
                            <textarea
                                rows={2}
                                value={localConfig?.description || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="Task details..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Priority
                            </label>
                            <select
                                value={localConfig?.priority || 'medium'}
                                onChange={(e) => setLocalConfig({ ...localConfig, priority: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Due In
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={localConfig?.due_in_value || 1}
                                    onChange={(e) => setLocalConfig({ ...localConfig, due_in_value: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                />
                                <select
                                    value={localConfig?.due_in_unit || 'days'}
                                    onChange={(e) => setLocalConfig({ ...localConfig, due_in_unit: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {/* Action: Assign User */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'assign_user' && (
                    <>
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                            <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
                                Assigns an owner/user to the entity
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Assignment Method
                            </label>
                            <select
                                value={localConfig?.assignment_method || 'round_robin'}
                                onChange={(e) => setLocalConfig({ ...localConfig, assignment_method: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="round_robin">Round Robin</option>
                                <option value="least_busy">Least Busy</option>
                                <option value="specific_user">Specific User</option>
                                <option value="random">Random</option>
                            </select>
                        </div>
                        {localConfig?.assignment_method === 'specific_user' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    User ID or Email
                                </label>
                                <input
                                    type="text"
                                    value={localConfig?.specific_user || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, specific_user: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    placeholder="user@example.com"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Team/Department Filter
                            </label>
                            <input
                                type="text"
                                value={localConfig?.team_filter || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, team_filter: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="sales"
                            />
                            <p className="text-xs text-slate-400 mt-1">Only assign to users in this team</p>
                        </div>
                    </>
                )}

                {/* Action: Assign Inquiry */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'assign_inquiry' && (
                    <>
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                            <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
                                Assigns the inquiry to a specific user
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                User ID
                            </label>
                            <input
                                type="text"
                                value={localConfig?.user_id || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, user_id: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="User ID"
                            />
                        </div>
                    </>
                )}

                {/* Action: Add Note */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'add_note' && (
                    <>
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                                Adds a note to the entity
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Note Content
                            </label>
                            <textarea
                                rows={3}
                                value={localConfig?.content || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, content: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="Automated note: {{contact_name}} was qualified via workflow"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Note Type
                            </label>
                            <select
                                value={localConfig?.note_type || 'general'}
                                onChange={(e) => setLocalConfig({ ...localConfig, note_type: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="general">General</option>
                                <option value="call">Call Note</option>
                                <option value="meeting">Meeting Note</option>
                                <option value="system">System Note</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Activity Summary (Optional)
                            </label>
                            <input
                                type="text"
                                value={localConfig?.summary || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, summary: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="Automated Note"
                            />
                            <p className="text-xs text-slate-400 mt-1">This will show up in the activity timeline header.</p>
                        </div>
                    </>
                )}

                {/* Action: Send Notification */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'send_notification' && (
                    <>
                        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                            <p className="text-sm text-pink-700 dark:text-pink-400 font-medium">
                                Sends an in-app or push notification
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Notification Title
                            </label>
                            <input
                                type="text"
                                value={localConfig?.title || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="New lead assigned to you"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Notification Message
                            </label>
                            <textarea
                                rows={2}
                                value={localConfig?.message || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, message: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="{{contact_name}} from {{company}} needs follow-up"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Send To
                            </label>
                            <select
                                value={localConfig?.send_to || 'assigned_user'}
                                onChange={(e) => setLocalConfig({ ...localConfig, send_to: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="assigned_user">Assigned User</option>
                                <option value="all_admins">All Admins</option>
                                <option value="team">Specific Team</option>
                                <option value="specific_user">Specific User</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Action: Webhook */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'webhook' && (
                    <>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600">
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                Sends data to an external URL
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Webhook URL
                            </label>
                            <input
                                type="url"
                                value={localConfig?.url || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="https://api.example.com/webhook"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                HTTP Method
                            </label>
                            <select
                                value={localConfig?.method || 'POST'}
                                onChange={(e) => setLocalConfig({ ...localConfig, method: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="GET">GET</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Headers (JSON)
                            </label>
                            <textarea
                                rows={2}
                                value={localConfig?.headers_json || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, headers_json: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                                placeholder='{"Authorization": "Bearer xxx"}'
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Custom Payload (JSON)
                            </label>
                            <textarea
                                rows={3}
                                value={localConfig?.custom_payload || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, custom_payload: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                                placeholder="Leave empty to send entity data"
                            />
                            <p className="text-xs text-slate-400 mt-1">Leave empty to send all entity data automatically</p>
                        </div>
                    </>
                )}

                {/* Action: AI Assistant */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_assistant' && (
                    <>
                        <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg border border-brand-100 dark:border-brand-800">
                            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 mb-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="font-semibold text-sm">AI Assistant</span>
                            </div>
                            <p className="text-xs text-brand-600 dark:text-brand-400">
                                Use AI to analyze data, score leads, or generate content.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                AI Prompt / Instructions
                            </label>
                            <textarea
                                rows={4}
                                value={localConfig?.prompt || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, prompt: e.target.value })}
                                placeholder="e.g. Analyze this lead: {{name}} from {{company}}"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                            <p className="mt-1 text-[10px] text-slate-400">
                                Use {'{{variable}}'} to inject dynamic data.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                System Message
                            </label>
                            <input
                                type="text"
                                value={localConfig?.system_message || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, system_message: e.target.value })}
                                placeholder="e.g. You are an expert sales analyst."
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    AI Model
                                </label>
                                <select
                                    value={localConfig?.model || 'gpt-4o-mini'}
                                    onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                                >
                                    <optgroup label="Google Gemini (Free Tier)">
                                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (Latest)</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                                    </optgroup>
                                    <optgroup label="OpenAI">
                                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                                        <option value="gpt-4o">GPT-4o</option>
                                        <option value="o1-mini">o1 Mini (Reasoning)</option>
                                        <option value="o1-preview">o1 Preview</option>
                                    </optgroup>
                                    <optgroup label="Groq / Open Source (Speed)">
                                        <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                                        <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                                        <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                                    </optgroup>
                                    <optgroup label="xAI Grok">
                                        <option value="grok-beta">Grok Beta</option>
                                        <option value="grok-4">Grok 4 (Flagship)</option>
                                        <option value="grok-3-mini">Grok 3 Mini</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Store Result In
                                </label>
                                <input
                                    type="text"
                                    value={localConfig?.output_variable || 'ai_response'}
                                    onChange={(e) => setLocalConfig({ ...localConfig, output_variable: e.target.value })}
                                    placeholder="variable_name"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="strict_mode"
                                checked={localConfig?.strict_mode || false}
                                onChange={(e) => setLocalConfig({ ...localConfig, strict_mode: e.target.checked })}
                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <label htmlFor="strict_mode" className="text-sm text-slate-600 dark:text-slate-400">
                                Strict Mode (Fail workflow on AI error)
                            </label>
                        </div>
                    </>
                )}

                {/* AI Pick Topic Config */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_pick_topic' && (
                    <>
                        <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded-lg border border-pink-100 dark:border-pink-800">
                            <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300 mb-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span className="font-semibold text-sm">AI Pick Topic</span>
                            </div>
                            <p className="text-xs text-pink-600 dark:text-pink-400">
                                Uses AI to generate a blog topic with SEO keywords.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Blog Niche / Category
                            </label>
                            <input
                                type="text"
                                value={localConfig?.niche || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, niche: e.target.value })}
                                placeholder="e.g. Technology, CRM, Marketing"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                AI Model
                            </label>
                            <select
                                value={localConfig?.model || 'llama-3.3-70b-versatile'}
                                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            >
                                <optgroup label="Groq / Open Source (Fast)">
                                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Default)</option>
                                    <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                                    <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                                </optgroup>
                                <optgroup label="Google Gemini">
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                </optgroup>
                                <optgroup label="OpenAI">
                                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                                    <option value="gpt-4o">GPT-4o</option>
                                </optgroup>
                                <optgroup label="xAI Grok">
                                    <option value="grok-beta">Grok Beta</option>
                                    <option value="grok-4">Grok 4</option>
                                </optgroup>
                            </select>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs text-slate-500">
                            <strong>Outputs:</strong> blog_topic, blog_keywords[], blog_image_query, blog_outline[]
                        </div>
                    </>
                )}

                {/* AI Write Blog Config */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_write_blog' && (
                    <>
                        <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded-lg border border-pink-100 dark:border-pink-800">
                            <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300 mb-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="font-semibold text-sm">AI Write Blog</span>
                            </div>
                            <p className="text-xs text-pink-600 dark:text-pink-400">
                                Generates full blog content in HTML format.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Word Count
                                </label>
                                <input
                                    type="number"
                                    value={localConfig?.word_count || 1000}
                                    onChange={(e) => setLocalConfig({ ...localConfig, word_count: parseInt(e.target.value) || 1000 })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Tone
                                </label>
                                <select
                                    value={localConfig?.tone || 'professional'}
                                    onChange={(e) => setLocalConfig({ ...localConfig, tone: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                                >
                                    <option value="professional">Professional</option>
                                    <option value="casual">Casual</option>
                                    <option value="technical">Technical</option>
                                    <option value="friendly">Friendly</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                AI Model
                            </label>
                            <select
                                value={localConfig?.model || 'llama-3.3-70b-versatile'}
                                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            >
                                <optgroup label="Groq / Open Source (Fast)">
                                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Default)</option>
                                    <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                                    <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                                </optgroup>
                                <optgroup label="Google Gemini">
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                </optgroup>
                                <optgroup label="OpenAI">
                                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                                    <option value="gpt-4o">GPT-4o</option>
                                </optgroup>
                                <optgroup label="xAI Grok">
                                    <option value="grok-beta">Grok Beta</option>
                                    <option value="grok-4">Grok 4</option>
                                </optgroup>
                            </select>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs text-slate-500">
                            <strong>Uses:</strong> blog_topic, blog_keywords, blog_outline<br />
                            <strong>Outputs:</strong> blog_title, blog_excerpt, blog_content
                        </div>
                    </>
                )}

                {/* AI Fetch Image Config */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_fetch_image' && (
                    <>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-100 dark:border-orange-800">
                            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 mb-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-semibold text-sm">Fetch Image (Unsplash)</span>
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                Gets a relevant image from Unsplash based on the AI-generated query.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Query Override (Optional)
                            </label>
                            <input
                                type="text"
                                value={localConfig?.query || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, query: e.target.value })}
                                placeholder="Leave empty to use AI-generated query"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs text-slate-500">
                            <strong>Uses:</strong> blog_image_query<br />
                            <strong>Outputs:</strong> blog_image, blog_image_credit
                        </div>
                    </>
                )}

                {/* AI Post Blog Config */}
                {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_post_blog' && (
                    <>
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                <span className="font-semibold text-sm">Post Blog</span>
                            </div>
                            <p className="text-xs text-red-600 dark:text-red-400">
                                Publishes the generated blog to NexSpire Solutions website.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Category
                            </label>
                            <input
                                type="text"
                                value={localConfig?.category || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, category: e.target.value })}
                                placeholder="General"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Author
                            </label>
                            <input
                                type="text"
                                value={localConfig?.author || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, author: e.target.value })}
                                placeholder="AI Writer"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Publish Status
                            </label>
                            <select
                                value={localConfig?.status || 'draft'}
                                onChange={(e) => setLocalConfig({ ...localConfig, status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            >
                                <option value="draft">Draft (Review First)</option>
                                <option value="published">Published (Auto-Publish)</option>
                            </select>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs text-slate-500">
                            <strong>Uses:</strong> blog_title, blog_excerpt, blog_content, blog_image<br />
                            <strong>Outputs:</strong> blog_posted, blog_id, blog_slug
                        </div>
                    </>
                )}

                {selectedNode.type === 'action' && selectedNode.data.actionType === 'index_url' && (
                    <>
                        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800">
                            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 mb-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="font-semibold text-sm">Search Engine Indexing</span>
                            </div>
                            <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                Submits URLs to Google, Bing, Yandex for faster indexing.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                URL to Index (Optional)
                            </label>
                            <input
                                type="text"
                                value={localConfig?.url || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                                placeholder="https://yoursite.com/page or {{blog_slug}}"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">Leave blank to auto-detect from previous nodes (blog_slug, page_slug).</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Search Engines
                            </label>
                            <div className="space-y-2 mt-1">
                                {[
                                    { key: 'indexnow', label: 'IndexNow (Bing, Yandex, Naver)' },
                                    { key: 'google', label: 'Google Indexing API' },
                                    { key: 'websub', label: 'WebSub (RSS notification)' },
                                ].map(engine => (
                                    <label key={engine.key} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={(localConfig?.engines || ['indexnow', 'google', 'websub']).includes(engine.key)}
                                            onChange={(e) => {
                                                const current = localConfig?.engines || ['indexnow', 'google', 'websub'];
                                                const updated = e.target.checked ? [...current, engine.key] : current.filter(k => k !== engine.key);
                                                setLocalConfig({ ...localConfig, engines: updated });
                                            }}
                                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{engine.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs text-slate-500">
                            <strong>Auto-detects:</strong> blog_slug, page_slug, product_id<br />
                            <strong>Best after:</strong> Post Blog
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-1">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Credentials (optional — falls back to global settings)</label>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
                                    <input type="text" value={localConfig?.websiteUrl || ''} onChange={(e) => setLocalConfig({ ...localConfig, websiteUrl: e.target.value })} placeholder="https://yoursite.com (uses global if empty)" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IndexNow API Key</label>
                                    <input type="text" value={localConfig?.indexnowKey || ''} onChange={(e) => setLocalConfig({ ...localConfig, indexnowKey: e.target.value })} placeholder="Uses global key if empty" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Google Service Account JSON</label>
                                    <textarea value={localConfig?.googleServiceAccountJson || ''} onChange={(e) => setLocalConfig({ ...localConfig, googleServiceAccountJson: e.target.value })} placeholder='Paste service account JSON (uses global if empty)' rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-xs font-mono" />
                                    <p className="text-xs text-slate-500 mt-1">Required for Google Indexing API. Add the service account as a site owner in Google Search Console.</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {selectedNode.type === 'delay' && (
                    <>
                        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                            <p className="text-sm text-cyan-700 dark:text-cyan-400 font-medium">
                                Pauses workflow execution
                            </p>
                            <p className="text-xs text-cyan-600 dark:text-cyan-500 mt-1">
                                The workflow will wait before continuing to the next step
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Delay Type
                            </label>
                            <select
                                value={localConfig?.delay_type || 'duration'}
                                onChange={(e) => setLocalConfig({ ...localConfig, delay_type: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="duration">Wait for duration</option>
                                <option value="until_time">Wait until specific time</option>
                                <option value="until_day">Wait until day of week</option>
                            </select>
                        </div>

                        {(!localConfig?.delay_type || localConfig?.delay_type === 'duration') && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Duration
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={localConfig?.value || 1}
                                        onChange={(e) => setLocalConfig({ ...localConfig, value: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Unit
                                    </label>
                                    <select
                                        value={localConfig?.unit || 'hours'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, unit: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="minutes">Minutes</option>
                                        <option value="hours">Hours</option>
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {localConfig?.delay_type === 'until_time' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Wait Until Time
                                </label>
                                <input
                                    type="time"
                                    value={localConfig?.until_time || '09:00'}
                                    onChange={(e) => setLocalConfig({ ...localConfig, until_time: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">Wait until this time (next occurrence if already passed)</p>
                            </div>
                        )}

                        {localConfig?.delay_type === 'until_day' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Wait Until Day
                                    </label>
                                    <select
                                        value={localConfig?.until_day || 'monday'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, until_day: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        At Time
                                    </label>
                                    <input
                                        type="time"
                                        value={localConfig?.at_time || '09:00'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, at_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded">
                            <input
                                type="checkbox"
                                id="skip_weekends"
                                checked={localConfig?.skip_weekends || false}
                                onChange={(e) => setLocalConfig({ ...localConfig, skip_weekends: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300"
                            />
                            <label htmlFor="skip_weekends" className="text-sm text-slate-600 dark:text-slate-300">
                                Skip weekends (resume on Monday)
                            </label>
                        </div>
                    </>
                )}

                {selectedNode.type === 'condition' && (
                    <>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                Splits workflow based on condition
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                TRUE path continues, FALSE path stops or takes alternate route
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Field to Check
                            </label>
                            <select
                                value={localConfig?.field || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, field: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">-- Select Field --</option>
                                <optgroup label="Lead/Client Fields">
                                    <option value="status">Status</option>
                                    <option value="source">Source</option>
                                    <option value="email">Email</option>
                                    <option value="company">Company</option>
                                    <option value="contact_name">Contact Name</option>
                                    <option value="phone">Phone</option>
                                    <option value="client_type">Client Type</option>
                                </optgroup>
                                <optgroup label="Numeric Fields">
                                    <option value="value">Deal Value</option>
                                    <option value="score">Lead Score</option>
                                    <option value="days_since_created">Days Since Created</option>
                                    <option value="days_since_contact">Days Since Last Contact</option>
                                </optgroup>
                                <optgroup label="Custom">
                                    <option value="custom">Custom Field...</option>
                                </optgroup>
                            </select>
                        </div>
                        {localConfig?.field === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Custom Field Name
                                </label>
                                <input
                                    type="text"
                                    value={localConfig?.custom_field || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, custom_field: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    placeholder="custom_field_name"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Operator
                            </label>
                            <select
                                value={localConfig?.operator || 'equals'}
                                onChange={(e) => setLocalConfig({ ...localConfig, operator: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <optgroup label="Text Comparisons">
                                    <option value="equals">Equals</option>
                                    <option value="not_equals">Not Equals</option>
                                    <option value="contains">Contains</option>
                                    <option value="not_contains">Does Not Contain</option>
                                    <option value="starts_with">Starts With</option>
                                    <option value="ends_with">Ends With</option>
                                </optgroup>
                                <optgroup label="Numeric Comparisons">
                                    <option value="greater_than">Greater Than</option>
                                    <option value="less_than">Less Than</option>
                                    <option value="greater_or_equal">Greater or Equal</option>
                                    <option value="less_or_equal">Less or Equal</option>
                                </optgroup>
                                <optgroup label="Existence Checks">
                                    <option value="is_empty">Is Empty</option>
                                    <option value="is_not_empty">Is Not Empty</option>
                                    <option value="is_null">Is Null</option>
                                    <option value="is_not_null">Is Not Null</option>
                                </optgroup>
                                <optgroup label="List Checks">
                                    <option value="in_list">In List</option>
                                    <option value="not_in_list">Not In List</option>
                                </optgroup>
                            </select>
                        </div>
                        {!['is_empty', 'is_not_empty', 'is_null', 'is_not_null'].includes(localConfig?.operator) && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {['in_list', 'not_in_list'].includes(localConfig?.operator)
                                        ? 'Values (comma-separated)'
                                        : 'Value'}
                                </label>
                                <input
                                    type="text"
                                    value={localConfig?.value || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, value: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    placeholder={['in_list', 'not_in_list'].includes(localConfig?.operator)
                                        ? 'qualified, proposal_sent, won'
                                        : 'qualified'}
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded">
                            <input
                                type="checkbox"
                                id="case_insensitive"
                                checked={localConfig?.case_insensitive || false}
                                onChange={(e) => setLocalConfig({ ...localConfig, case_insensitive: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300"
                            />
                            <label htmlFor="case_insensitive" className="text-sm text-slate-600 dark:text-slate-300">
                                Case insensitive comparison
                            </label>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mt-2">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Branch Paths:</p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-slate-600 dark:text-slate-400">TRUE - Condition met</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-xs text-slate-600 dark:text-slate-400">FALSE - Not met</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                    <p className="font-medium mb-1">Available Variables:</p>
                    <code className="block bg-slate-100 dark:bg-slate-700 p-2 rounded text-xs">
                        {'{{id}}, {{email}}, {{contact_name}}, {{company}}, {{status}}, {{source}}, {{last_email_subject}}, {{last_email_body}}'}
                    </code>
                </div>

                {/* Generic / No Settings Fallback */}
                {!['trigger', 'action', 'condition', 'delay'].includes(selectedNode.type) ||
                    (selectedNode.type === 'action' && !['send_email', 'update_lead', 'update_client', 'update_inquiry', 'create_task', 'assign_user', 'assign_inquiry', 'add_note', 'send_notification', 'webhook', 'ai_assistant', 'ai_pick_topic', 'ai_write_blog', 'ai_fetch_image', 'ai_post_blog', 'index_url'].includes(selectedNode.data.actionType)) ? (
                    <div className="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center">
                        <p className="text-sm text-slate-500">No specific configuration available for this node type.</p>
                        <p className="text-[10px] text-slate-400 mt-2">ID: {selectedNode.id}</p>
                    </div>
                ) : null}

                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={applyNodeConfig}
                        disabled={isApplyingConfig}
                        className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
                    >
                        {isApplyingConfig ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Applying...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Apply Configuration</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default WorkflowNodeConfig;
