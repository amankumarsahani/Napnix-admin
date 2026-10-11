import { LABEL_CLS, CONTROL_CLS, HINT_CLS } from './controls';

export default function FlowSettings({ selectedNode, localConfig, setLocalConfig }) {
    return (
        <>
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
                                    <label className={LABEL_CLS}>
                                        Delay Type
                                    </label>
                                    <select
                                        value={localConfig?.delay_type || 'duration'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, delay_type: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="duration">Wait for duration</option>
                                        <option value="until_time">Wait until specific time</option>
                                        <option value="until_day">Wait until day of week</option>
                                    </select>
                                </div>

                                {(!localConfig?.delay_type || localConfig?.delay_type === 'duration') && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className={LABEL_CLS}>
                                                Duration
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={localConfig?.value || 1}
                                                onChange={(e) => setLocalConfig({ ...localConfig, value: parseInt(e.target.value) })}
                                                className={CONTROL_CLS}
                                            />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLS}>
                                                Unit
                                            </label>
                                            <select
                                                value={localConfig?.unit || 'hours'}
                                                onChange={(e) => setLocalConfig({ ...localConfig, unit: e.target.value })}
                                                className={CONTROL_CLS}
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
                                        <label className={LABEL_CLS}>
                                            Wait Until Time
                                        </label>
                                        <input
                                            type="time"
                                            value={localConfig?.until_time || '09:00'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, until_time: e.target.value })}
                                            className={CONTROL_CLS}
                                        />
                                        <p className={HINT_CLS}>Wait until this time (next occurrence if already passed)</p>
                                    </div>
                                )}

                                {localConfig?.delay_type === 'until_day' && (
                                    <>
                                        <div>
                                            <label className={LABEL_CLS}>
                                                Wait Until Day
                                            </label>
                                            <select
                                                value={localConfig?.until_day || 'monday'}
                                                onChange={(e) => setLocalConfig({ ...localConfig, until_day: e.target.value })}
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
                                        <div>
                                            <label className={LABEL_CLS}>
                                                At Time
                                            </label>
                                            <input
                                                type="time"
                                                value={localConfig?.at_time || '09:00'}
                                                onChange={(e) => setLocalConfig({ ...localConfig, at_time: e.target.value })}
                                                className={CONTROL_CLS}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-2 p-2 bg-surface-3 rounded">
                                    <input
                                        type="checkbox"
                                        id="skip_weekends"
                                        checked={localConfig?.skip_weekends || false}
                                        onChange={(e) => setLocalConfig({ ...localConfig, skip_weekends: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <label htmlFor="skip_weekends" className="text-sm text-fg-muted">
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
                                    <label className={LABEL_CLS}>
                                        Field to Check
                                    </label>
                                    <select
                                        value={localConfig?.field || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, field: e.target.value })}
                                        className={CONTROL_CLS}
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
                                        <label className={LABEL_CLS}>
                                            Custom Field Name
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.custom_field || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, custom_field: e.target.value })}
                                            className={CONTROL_CLS}
                                            placeholder="custom_field_name"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className={LABEL_CLS}>
                                        Operator
                                    </label>
                                    <select
                                        value={localConfig?.operator || 'equals'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, operator: e.target.value })}
                                        className={CONTROL_CLS}
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
                                        <label className={LABEL_CLS}>
                                            {['in_list', 'not_in_list'].includes(localConfig?.operator)
                                                ? 'Values (comma-separated)'
                                                : 'Value'}
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.value || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, value: e.target.value })}
                                            className={CONTROL_CLS}
                                            placeholder={['in_list', 'not_in_list'].includes(localConfig?.operator)
                                                ? 'qualified, proposal_sent, won'
                                                : 'qualified'}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-2 p-2 bg-surface-3 rounded">
                                    <input
                                        type="checkbox"
                                        id="case_insensitive"
                                        checked={localConfig?.case_insensitive || false}
                                        onChange={(e) => setLocalConfig({ ...localConfig, case_insensitive: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <label htmlFor="case_insensitive" className="text-sm text-fg-muted">
                                        Case insensitive comparison
                                    </label>
                                </div>
                                <div className="p-3 bg-surface-2 rounded-lg border border-border mt-2">
                                    <p className="text-xs font-medium text-fg-muted mb-2">Branch Paths:</p>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="text-xs text-fg-muted">TRUE - Condition met</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-xs text-fg-muted">FALSE - Not met</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="text-xs text-fg-muted mt-4">
                            <p className="font-medium mb-1">Available Variables:</p>
                            <code className="block bg-surface-3 p-2 rounded text-xs">
                                {'{{id}}, {{email}}, {{contact_name}}, {{company}}, {{status}}, {{source}}, {{last_email_subject}}, {{last_email_body}}'}
                            </code>
                        </div>
        </>
    );
}
