import { LABEL_CLS, CONTROL_CLS, HINT_CLS } from './controls';
import SearchableSelect from './SearchableSelect';

export default function ActionSettings({ selectedNode, localConfig, setLocalConfig, emailTemplates, documentTemplates }) {
    return (
        <>
                        {/* Action-specific config */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'send_email' && (
                            <>
                                <div>
                                    <label className={LABEL_CLS}>
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
                                                {t.category && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-fg-muted">{t.category}</span>}
                                            </span>
                                        )}
                                        hint={emailTemplates.length === 0 ? 'No templates found. Go to Templates to create one.' : 'Type to search or select a template'}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        To Email (Recipient)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.to_email || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_email: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="{{email}}"
                                    />
                                    <p className={HINT_CLS}>Use {"{{email}}"} for the inquiry/lead email address</p>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        Email Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.subject || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, subject: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Welcome {{contact_name}}!"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Email Body
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={localConfig?.body || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, body: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Hello {{contact_name}}, ..."
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
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
                                                    attachment_filename: `Napnix-${(doc.name || val).replace(/\s+/g, '-')}-{{slug}}.pdf`
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
                                                <svg className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>{d.name}</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-fg-muted">{d.category}</span>
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
                                    <label className={LABEL_CLS}>
                                        Update Status To
                                    </label>
                                    <select
                                        value={localConfig?.new_status || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_status: e.target.value,
                                            updates: { ...localConfig?.updates, status: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
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
                                    <label className={LABEL_CLS}>
                                        Update Source To
                                    </label>
                                    <select
                                        value={localConfig?.new_source || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_source: e.target.value,
                                            updates: { ...localConfig?.updates, source: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
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
                                    <label className={LABEL_CLS}>
                                        Add Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.add_tags || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, add_tags: e.target.value })}
                                        className={CONTROL_CLS}
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
                                    <label className={LABEL_CLS}>
                                        Update Status To
                                    </label>
                                    <select
                                        value={localConfig?.new_status || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_status: e.target.value,
                                            updates: { ...localConfig?.updates, status: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
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
                                    <label className={LABEL_CLS}>
                                        Update Client Type To
                                    </label>
                                    <select
                                        value={localConfig?.new_client_type || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_client_type: e.target.value,
                                            updates: { ...localConfig?.updates, client_type: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">-- No change --</option>
                                        <option value="individual">Individual</option>
                                        <option value="business">Business</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Add Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.add_tags || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, add_tags: e.target.value })}
                                        className={CONTROL_CLS}
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
                                    <label className={LABEL_CLS}>
                                        Set Status to
                                    </label>
                                    <select
                                        value={localConfig?.updates?.status || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            updates: { ...localConfig.updates, status: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
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
                                    <label className={LABEL_CLS}>
                                        Task Title
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.title || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Follow up with {{contact_name}}"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Task Description
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={localConfig?.description || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, description: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Task details..."
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Priority
                                    </label>
                                    <select
                                        value={localConfig?.priority || 'medium'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, priority: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Due In
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={localConfig?.due_in_value || 1}
                                            onChange={(e) => setLocalConfig({ ...localConfig, due_in_value: parseInt(e.target.value) })}
                                            className={CONTROL_CLS}
                                        />
                                        <select
                                            value={localConfig?.due_in_unit || 'days'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, due_in_unit: e.target.value })}
                                            className={CONTROL_CLS}
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
                                    <label className={LABEL_CLS}>
                                        Assignment Method
                                    </label>
                                    <select
                                        value={localConfig?.assignment_method || 'round_robin'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, assignment_method: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="round_robin">Round Robin</option>
                                        <option value="least_busy">Least Busy</option>
                                        <option value="specific_user">Specific User</option>
                                        <option value="random">Random</option>
                                    </select>
                                </div>
                                {localConfig?.assignment_method === 'specific_user' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            User ID or Email
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.specific_user || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, specific_user: e.target.value })}
                                            className={CONTROL_CLS}
                                            placeholder="user@example.com"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className={LABEL_CLS}>
                                        Team/Department Filter
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.team_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, team_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="sales"
                                    />
                                    <p className={HINT_CLS}>Only assign to users in this team</p>
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
                                    <label className={LABEL_CLS}>
                                        User ID
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.user_id || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, user_id: e.target.value })}
                                        className={CONTROL_CLS}
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
                                    <label className={LABEL_CLS}>
                                        Note Content
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={localConfig?.content || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, content: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Automated note: {{contact_name}} was qualified via workflow"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Note Type
                                    </label>
                                    <select
                                        value={localConfig?.note_type || 'general'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, note_type: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="general">General</option>
                                        <option value="call">Call Note</option>
                                        <option value="meeting">Meeting Note</option>
                                        <option value="system">System Note</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Activity Summary (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.summary || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, summary: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Automated Note"
                                    />
                                    <p className={HINT_CLS}>This will show up in the activity timeline header.</p>
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
                                    <label className={LABEL_CLS}>
                                        Notification Title
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.title || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="New lead assigned to you"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Notification Message
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={localConfig?.message || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, message: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="{{contact_name}} from {{company}} needs follow-up"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Send To
                                    </label>
                                    <select
                                        value={localConfig?.send_to || 'assigned_user'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, send_to: e.target.value })}
                                        className={CONTROL_CLS}
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
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        Sends data to an external URL
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Webhook URL
                                    </label>
                                    <input
                                        type="url"
                                        value={localConfig?.url || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="https://api.example.com/webhook"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        HTTP Method
                                    </label>
                                    <select
                                        value={localConfig?.method || 'POST'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, method: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="PATCH">PATCH</option>
                                        <option value="GET">GET</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Headers (JSON)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={localConfig?.headers_json || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, headers_json: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                                        placeholder='{"Authorization": "Bearer xxx"}'
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Custom Payload (JSON)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={localConfig?.custom_payload || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, custom_payload: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                                        placeholder="Leave empty to send entity data"
                                    />
                                    <p className={HINT_CLS}>Leave empty to send all entity data automatically</p>
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
                                    <label className={LABEL_CLS}>
                                        AI Prompt / Instructions
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={localConfig?.prompt || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, prompt: e.target.value })}
                                        placeholder="e.g. Analyze this lead: {{name}} from {{company}}"
                                        className={CONTROL_CLS}
                                    />
                                    <p className="mt-1 text-[10px] text-fg-subtle">
                                        Use {'{{variable}}'} to inject dynamic data.
                                    </p>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        System Message
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.system_message || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, system_message: e.target.value })}
                                        placeholder="e.g. You are an expert sales analyst."
                                        className={CONTROL_CLS}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>
                                            AI Model
                                        </label>
                                        <select
                                            value={localConfig?.model || 'gpt-4o-mini'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                            className={CONTROL_CLS}
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
                                        <label className={LABEL_CLS}>
                                            Store Result In
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.output_variable || 'ai_response'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, output_variable: e.target.value })}
                                            placeholder="variable_name"
                                            className={CONTROL_CLS}
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
                                    <label htmlFor="strict_mode" className="text-sm text-fg-muted">
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
                                    <label className={LABEL_CLS}>
                                        Blog Niche / Category
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.niche || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, niche: e.target.value })}
                                        placeholder="Default: CRM, lead follow-up and sales process for Indian service businesses"
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Brand Context / Instructions
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={localConfig?.brand_context || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, brand_context: e.target.value })}
                                        placeholder="Real facts about Napnix the writer may use (products, audience, real customer stories) plus any extra instructions. Leave empty to use the default Napnix context."
                                        className={CONTROL_CLS}
                                    />
                                    <p className="text-[11px] text-fg-muted mt-1">
                                        Passed to AI Write Blog too. The AI only states facts written here; it never invents stats, quotes or clients.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        AI Model
                                    </label>
                                    <select
                                        value={localConfig?.model || 'llama-3.3-70b-versatile'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                        className={CONTROL_CLS}
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
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
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
                                        <label className={LABEL_CLS}>
                                            Word Count
                                        </label>
                                        <input
                                            type="number"
                                            value={localConfig?.word_count || 1000}
                                            onChange={(e) => setLocalConfig({ ...localConfig, word_count: parseInt(e.target.value) || 1000 })}
                                            className={CONTROL_CLS}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Tone
                                        </label>
                                        <select
                                            value={localConfig?.tone || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, tone: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            <option value="">Auto (rotate styles)</option>
                                            <option value="professional">Professional</option>
                                            <option value="casual">Casual</option>
                                            <option value="technical">Technical</option>
                                            <option value="friendly">Friendly</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        AI Model
                                    </label>
                                    <select
                                        value={localConfig?.model || 'llama-3.3-70b-versatile'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                        className={CONTROL_CLS}
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
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
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
                                    <label className={LABEL_CLS}>
                                        Query Override (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.query || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, query: e.target.value })}
                                        placeholder="Leave empty to use AI-generated query"
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Uses:</strong> blog_image_query<br />
                                    <strong>Outputs:</strong> blog_image, blog_image_credit
                                </div>
                            </>
                        )}
        </>
    );
}
