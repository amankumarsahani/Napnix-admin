import { useState } from 'react';
import { FiActivity, FiPlus } from '../../components/icons/FeatherIcons';

export default function Automations() {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Automations</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create automated email sequences and drip campaigns</p>
                </div>
                <button className="btn btn-primary flex items-center gap-2"><FiPlus /> New Automation</button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
            ) : automations.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <FiActivity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No automations yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Set up welcome series, abandoned cart emails, and re-engagement flows</p>
                    <button className="btn btn-primary mx-auto">Create Automation</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {automations.map((a) => (
                        <div key={a.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{a.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">Trigger: {a.trigger_type} &middot; {a.entry_count} enrolled</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{a.status}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
