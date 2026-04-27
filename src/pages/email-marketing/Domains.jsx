import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Domains() {
    const [domains, setDomains] = useState([]);
    const [newDomain, setNewDomain] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const statusColors = { pending: 'bg-amber-100 text-amber-700', verified: 'bg-emerald-100 text-emerald-700', failed: 'bg-red-100 text-red-700' };
    const checkIcon = (verified) => verified ? <span className="text-emerald-500">&#10003;</span> : <span className="text-red-400">&#10007;</span>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sending Domains</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verify domains for better deliverability (SPF, DKIM, DMARC)</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn btn-primary">Add Domain</button>
            </div>

            {domains.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4 text-2xl">🔐</div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No domains configured</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-md mx-auto">Add your sending domain to set up SPF, DKIM, and DMARC records for improved email deliverability and sender reputation.</p>
                    <button onClick={() => setShowAdd(true)} className="btn btn-primary">Add Domain</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {domains.map(d => (
                        <div key={d.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.domain}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[d.status]}`}>{d.status}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toast.success('Verification started')} className="btn btn-secondary text-xs">Re-verify</button>
                                    <button onClick={() => toast.success('Domain removed')} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">{checkIcon(d.spf_verified)}<span className="text-sm text-slate-700 dark:text-slate-300">SPF Record</span></div>
                                <div className="flex items-center gap-2">{checkIcon(d.dkim_verified)}<span className="text-sm text-slate-700 dark:text-slate-300">DKIM Record</span></div>
                                <div className="flex items-center gap-2">{checkIcon(d.dmarc_verified)}<span className="text-sm text-slate-700 dark:text-slate-300">DMARC Record</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAdd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add Sending Domain</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Domain</label>
                            <input type="text" value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="yourdomain.com"
                                className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mb-2">After adding, you'll need to create DNS records:</p>
                            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                                <li>SPF TXT record on your domain</li>
                                <li>DKIM TXT record (nexmail._domainkey)</li>
                                <li>DMARC TXT record (_dmarc)</li>
                            </ul>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowAdd(false)} className="btn btn-secondary flex-1">Cancel</button>
                            <button onClick={() => { toast.success('Domain added! Configure DNS records.'); setShowAdd(false); setNewDomain(''); }} className="btn btn-primary flex-1">Add Domain</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
