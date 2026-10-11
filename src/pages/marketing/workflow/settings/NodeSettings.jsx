import { LABEL_CLS, CONTROL_CLS } from './controls';
import TriggerSettings from './TriggerSettings';
import ActionSettings from './ActionSettings';
import AiActionSettings from './AiActionSettings';
import FlowSettings from './FlowSettings';
import ChannelSettings from './ChannelSettings';

/** Per-node settings form. Edits flow through setLocalConfig; the editor debounces them into the canvas. */
export default function NodeSettings({ selectedNode, localConfig, setLocalConfig, id, isNew, emailTemplates, documentTemplates, waAccounts }) {
    const common = { selectedNode, localConfig, setLocalConfig };
    return (
        <>
            <TriggerSettings {...common} id={id} isNew={isNew} waAccounts={waAccounts} />
            <ActionSettings {...common} emailTemplates={emailTemplates} documentTemplates={documentTemplates} />
            <AiActionSettings {...common} />
            <FlowSettings {...common} />
            <ChannelSettings {...common} waAccounts={waAccounts} />

                        {/* Node settings shared by every action: retry + error handling */}
                        {(selectedNode.type === 'action' || selectedNode.type === 'whatsapp') && (
                            <div className="pt-3 mt-1 border-t border-border space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">If this step fails</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Retries</label>
                                        <input type="number" min={0} max={5} value={localConfig?.retry_count || 0} onChange={(e) => setLocalConfig({ ...localConfig, retry_count: parseInt(e.target.value) || 0 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Wait (sec)</label>
                                        <input type="number" min={1} max={60} value={localConfig?.retry_delay_seconds || 5} onChange={(e) => setLocalConfig({ ...localConfig, retry_delay_seconds: parseInt(e.target.value) || 5 })} className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>After retries run out</label>
                                    <select value={localConfig?.on_error || 'stop'} onChange={(e) => setLocalConfig({ ...localConfig, on_error: e.target.value })} className={CONTROL_CLS}>
                                        <option value="stop">Stop the workflow</option>
                                        <option value="continue">Continue to next steps</option>
                                        <option value="branch">Follow the red "error" connection</option>
                                    </select>
                                    <p className="text-xs text-fg-muted mt-1">The error message is available as {'{{last_error.message}}'}.</p>
                                </div>
                            </div>
                        )}

                        {/* Generic / No Settings Fallback */}
                        {!['trigger', 'action', 'condition', 'delay', 'whatsapp'].includes(selectedNode.type) ||
                            (selectedNode.type === 'action' && !['send_email', 'update_lead', 'update_client', 'update_inquiry', 'create_task', 'assign_user', 'assign_inquiry', 'add_note', 'send_notification', 'webhook', 'ai_assistant', 'ai_pick_topic', 'ai_write_blog', 'ai_fetch_image', 'ai_post_blog', 'index_url', 'keyword_research', 'gsc_opportunities', 'http_request', 'ai_agent', 'loop_items'].includes(selectedNode.data.actionType)) ? (
                            <div className="p-4 border border-dashed border-border-strong rounded-lg text-center">
                                <p className="text-sm text-fg-muted">No specific configuration available for this node type.</p>
                                <p className="text-[10px] text-fg-subtle mt-2">ID: {selectedNode.id}</p>
                            </div>
                        ) : null}
        </>
    );
}
