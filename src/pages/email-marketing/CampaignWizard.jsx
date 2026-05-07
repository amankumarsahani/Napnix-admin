import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiChevronRight, FiSend, FiUsers, FiLayout, FiAlertTriangle, FiCheckCircle } from '../../components/icons/FeatherIcons';
import { nmCampaignsAPI, nmListsAPI, nmTemplatesAPI } from '../../api/nexmail';

const STEPS = ['Setup', 'Audience', 'Content', 'Spam Check', 'Schedule'];

export default function CampaignWizard() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [campaign, setCampaign] = useState({
        name: '', type: 'regular', subject_a: '', subject_b: '',
        from_name: '', from_email: '', reply_to: '',
        list_id: null, segment_filter: null,
        template_id_a: null, html_content_a: '',
        ab_split_pct: 50, ab_winner_metric: 'open_rate', ab_winner_wait_hours: 4,
        scheduled_at: null, send_now: true
    });
    const [lists, setLists] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [estimatedCount, setEstimatedCount] = useState(null);
    const [spamResult, setSpamResult] = useState(null);
    const [checkingSpam, setCheckingSpam] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    const update = (k, v) => setCampaign(p => ({ ...p, [k]: v }));

    useEffect(() => {
        nmListsAPI.getAll().then(r => setLists(r.data || [])).catch(() => {});
        nmTemplatesAPI.getAll({ status: 'active' }).then(r => setTemplates(r.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (step === 1) {
            nmCampaignsAPI.estimateAudience({ list_id: campaign.list_id, segment_filter: campaign.segment_filter })
                .then(r => setEstimatedCount(r.count))
                .catch(() => setEstimatedCount(null));
        }
    }, [step, campaign.list_id]);

    useEffect(() => {
        if (step === 3) runSpamCheck();
    }, [step]);

    const runSpamCheck = async () => {
        setCheckingSpam(true);
        try {
            const res = await nmTemplatesAPI.checkSpam({
                subject: campaign.subject_a,
                html_content: campaign.html_content_a || undefined,
                from_email: campaign.from_email
            });
            setSpamResult(res.data);
        } catch (e) {
            setSpamResult(null);
            toast.error('Spam check failed');
        } finally {
            setCheckingSpam(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 0: return campaign.name && campaign.subject_a;
            case 1: return true;
            case 2: return campaign.html_content_a || campaign.template_id_a;
            case 3: return spamResult ? spamResult.score >= 20 : false;
            default: return true;
        }
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            const res = await nmCampaignsAPI.create(campaign);
            const campaignId = res.campaignId;

            if (campaign.send_now) {
                try {
                    await nmCampaignsAPI.send(campaignId);
                    toast.success('Campaign created and queued for sending!');
                } catch (e) {
                    toast.error(e.response?.data?.error || 'Created but failed to send');
                    if (e.response?.data?.spam_score !== undefined) {
                        setSpamResult({ score: e.response.data.spam_score, rating: e.response.data.rating, issues: e.response.data.issues || [], suggestions: e.response.data.suggestions || [] });
                        setStep(3);
                        setSaving(false);
                        return;
                    }
                }
            } else {
                toast.success('Campaign created and scheduled!');
            }
            navigate('/email-marketing/campaigns');
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to create campaign');
        } finally {
            setSaving(false);
        }
    };

    const scoreColor = (score) => {
        if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-200' };
        if (score >= 60) return { bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-200' };
        if (score >= 40) return { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-200' };
        return { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-200' };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/email-marketing/campaigns')} className="text-slate-400 hover:text-slate-600">&larr;</button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Campaign</h1>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 overflow-x-auto">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => i <= step && setStep(i)} disabled={i > step}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 cursor-pointer' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">{i + 1}</span>{s}
                        </button>
                        {i < STEPS.length - 1 && <FiChevronRight className="text-slate-300 w-4 h-4 flex-shrink-0" />}
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 min-h-[400px]">
                {step === 0 && (
                    <div className="space-y-4 max-w-lg">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Campaign Setup</h2>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1">Campaign Name *</label><input type="text" value={campaign.name} onChange={e => update('name', e.target.value)} placeholder="May Newsletter" className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 focus:outline-none" /></div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1">Subject Line *</label><input type="text" value={campaign.subject_a} onChange={e => update('subject_a', e.target.value)} placeholder="{{first_name}}, check out what's new!" className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 focus:outline-none" /><p className="text-xs text-slate-400 mt-1">Use {'{{first_name}}'} for personalization</p></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-slate-600 mb-1">From Name</label><input type="text" value={campaign.from_name} onChange={e => update('from_name', e.target.value)} placeholder="Your Company" className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-slate-600 mb-1">From Email</label><input type="email" value={campaign.from_email} onChange={e => update('from_email', e.target.value)} placeholder="hello@yourdomain.com" className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 focus:outline-none" /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                            <div className="flex gap-3">{[{ v: 'regular', l: 'Regular' }, { v: 'ab_test', l: 'A/B Test' }].map(t => (
                                <button key={t.v} onClick={() => update('type', t.v)} className={`flex-1 p-3 rounded-lg border-2 ${campaign.type === t.v ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-600'}`}><p className="text-sm font-medium text-slate-900 dark:text-white">{t.l}</p></button>
                            ))}</div>
                        </div>
                        {campaign.type === 'ab_test' && <div><label className="block text-sm font-medium text-slate-600 mb-1">Subject B</label><input type="text" value={campaign.subject_b} onChange={e => update('subject_b', e.target.value)} placeholder="Alternative subject" className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 focus:outline-none" /></div>}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Audience</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={() => { update('list_id', null); }} className={`p-4 rounded-lg border-2 text-left ${!campaign.list_id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-600'}`}>
                                <FiUsers className="w-6 h-6 text-brand-600 mb-2" /><p className="text-sm font-medium text-slate-900 dark:text-white">All Contacts</p><p className="text-xs text-slate-500 mt-1">Send to everyone subscribed</p>
                            </button>
                            {lists.map(l => (
                                <button key={l.id} onClick={() => update('list_id', l.id)} className={`p-4 rounded-lg border-2 text-left ${campaign.list_id === l.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-600'}`}>
                                    <FiLayout className="w-5 h-5 text-brand-600 mb-1" /><p className="text-sm font-medium text-slate-900 dark:text-white">{l.name}</p><p className="text-xs text-slate-500">{l.contact_count || 0} contacts</p>
                                </button>
                            ))}
                        </div>
                        {estimatedCount !== null && <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4"><p className="text-sm font-medium text-brand-700">Estimated recipients: <span className="text-lg font-bold">{estimatedCount.toLocaleString()}</span></p></div>}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Content</h2>
                        {templates.length > 0 && <div><p className="text-sm font-medium text-slate-600 mb-2">Choose a template:</p><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{templates.map(t => (
                            <button key={t.id} onClick={() => update('template_id_a', t.id)} className={`p-3 rounded-lg border-2 text-left ${campaign.template_id_a === t.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 dark:border-slate-600'}`}>
                                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{t.name}</p><p className="text-[10px] text-slate-400">{t.category}</p>
                            </button>
                        ))}</div></div>}
                        <div className="flex items-center gap-4"><hr className="flex-1" /><span className="text-xs text-slate-400">or</span><hr className="flex-1" /></div>
                        <div><label className="block text-sm font-medium text-slate-600 mb-1">Custom HTML</label><textarea value={campaign.html_content_a} onChange={e => update('html_content_a', e.target.value)} rows={10} placeholder="<h1>Hello {{first_name}}!</h1>" className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 font-mono text-xs resize-y focus:ring-2 focus:ring-brand-500 focus:outline-none" /></div>
                        <button onClick={() => navigate('/email-marketing/templates/new')} className="text-sm text-brand-600 hover:text-brand-700 font-medium">Open Template Builder →</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Spam & Deliverability Check</h2>
                        {checkingSpam ? (
                            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div><span className="ml-3 text-sm text-slate-500">Analyzing email content...</span></div>
                        ) : spamResult ? (
                            <>
                                <div className="flex items-center gap-6">
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center ring-8 ${scoreColor(spamResult.score).ring}`}>
                                        <div className="text-center"><p className={`text-3xl font-bold ${scoreColor(spamResult.score).text}`}>{spamResult.score}</p><p className="text-[10px] text-slate-500">/100</p></div>
                                    </div>
                                    <div>
                                        <p className={`text-xl font-bold ${scoreColor(spamResult.score).text}`}>{spamResult.rating}</p>
                                        <p className="text-sm text-slate-500 mt-1">{spamResult.issueCount} issue{spamResult.issueCount !== 1 ? 's' : ''} found</p>
                                        {spamResult.score < 20 && <p className="text-sm text-red-600 font-medium mt-1">Campaign blocked — fix critical issues before sending</p>}
                                    </div>
                                </div>

                                {spamResult.issues.length > 0 && (
                                    <div className="bg-white dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                        <div className="p-3 border-b border-slate-200 dark:border-slate-600"><p className="text-sm font-semibold text-slate-900 dark:text-white">Issues Found</p></div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {spamResult.issues.map((issue, i) => (
                                                <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 mt-0.5 ${issue.severity === 'critical' ? 'bg-red-100 text-red-700' : issue.severity === 'high' ? 'bg-orange-100 text-orange-700' : issue.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{issue.severity}</span>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">{issue.message}</p>
                                                    <span className="text-xs text-slate-400 ml-auto flex-shrink-0">-{issue.penalty}pts</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {spamResult.suggestions.length > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Suggestions</p>
                                        <ul className="space-y-1">{spamResult.suggestions.map((s, i) => <li key={i} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2"><FiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{s}</li>)}</ul>
                                    </div>
                                )}

                                {spamResult.deliverabilityTips && (
                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Deliverability Tips</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {spamResult.deliverabilityTips.map((t, i) => (
                                                <div key={i} className="text-xs"><span className="font-bold text-slate-600 dark:text-slate-400">{t.category}:</span> <span className="text-slate-500">{t.tip}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button onClick={runSpamCheck} className="text-sm text-brand-600 hover:text-brand-700 font-medium">Re-check Score →</button>

                                <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <label className="text-sm font-medium text-slate-600">Send test email:</label>
                                    <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com" className="flex-1 max-w-xs px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                                    <button onClick={async () => { if (!testEmail) return; try { toast.success('Test email functionality ready (create campaign first)'); } catch (e) { toast.error('Failed'); } }} className="btn btn-secondary text-sm">Send Test</button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16 text-slate-400">
                                <FiAlertTriangle className="w-8 h-8 mx-auto mb-2" />
                                <p>Unable to check spam score. Make sure you have content in the previous step.</p>
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4 max-w-lg">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Schedule</h2>
                        <div className="space-y-3">
                            {[{ v: true, l: 'Send Now', d: 'Start sending immediately' }, { v: false, l: 'Schedule', d: 'Pick a date and time' }].map(o => (
                                <button key={String(o.v)} onClick={() => update('send_now', o.v)} className={`w-full p-4 rounded-lg border-2 text-left ${campaign.send_now === o.v ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-600'}`}>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{o.l}</p><p className="text-xs text-slate-500">{o.d}</p>
                                </button>
                            ))}
                        </div>
                        {!campaign.send_now && <div><label className="block text-sm font-medium text-slate-600 mb-1">Send Date & Time</label><input type="datetime-local" value={campaign.scheduled_at || ''} onChange={e => update('scheduled_at', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 focus:outline-none" /></div>}
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mt-4">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Summary</h3>
                            <div className="space-y-1 text-sm text-slate-600">
                                <p><b>Name:</b> {campaign.name}</p><p><b>Subject:</b> {campaign.subject_a}</p>
                                <p><b>Audience:</b> {campaign.list_id ? `List #${campaign.list_id}` : 'All contacts'}{estimatedCount !== null ? ` (~${estimatedCount})` : ''}</p>
                                {spamResult && <p><b>Spam Score:</b> <span className={scoreColor(spamResult.score).text}>{spamResult.score}/100 ({spamResult.rating})</span></p>}
                                <p><b>Schedule:</b> {campaign.send_now ? 'Immediately' : campaign.scheduled_at || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/email-marketing/campaigns')} className="btn btn-secondary">{step === 0 ? 'Cancel' : 'Back'}</button>
                {step < STEPS.length - 1 ? (
                    <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">Next <FiChevronRight className="w-4 h-4" /></button>
                ) : (
                    <button onClick={handleCreate} disabled={saving} className="btn btn-primary flex items-center gap-2 disabled:opacity-50"><FiSend className="w-4 h-4" /> {saving ? 'Creating...' : campaign.send_now ? 'Create & Send' : 'Schedule'}</button>
                )}
            </div>
        </div>
    );
}
