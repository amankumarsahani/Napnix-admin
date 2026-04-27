import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';
import { FiSend, FiMail, FiMousePointer, FiTrendingUp } from '../../components/icons/FeatherIcons';
import { nmCampaignsAPI } from '../../api/nexmail';

export default function CampaignDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        try {
            const [campRes, analyticsRes, recipientRes] = await Promise.allSettled([
                nmCampaignsAPI.getById(id),
                nmCampaignsAPI.getAnalytics(id),
                nmCampaignsAPI.getRecipients(id, { limit: 50 })
            ]);
            if (campRes.status === 'fulfilled') setCampaign(campRes.value.data);
            if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
            if (recipientRes.status === 'fulfilled') setRecipients(recipientRes.value.data || []);
        } catch (e) {
            console.error('Campaign detail error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        try {
            if (action === 'pause') await nmCampaignsAPI.pause(id);
            else if (action === 'resume') await nmCampaignsAPI.resume(id);
            else if (action === 'send') await nmCampaignsAPI.send(id);
            toast.success(`Campaign ${action}ed`);
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.error || `Failed to ${action}`);
        }
    };

    const statusColors = { draft: 'bg-slate-100 text-slate-600', queued: 'bg-amber-100 text-amber-700', sending: 'bg-indigo-100 text-indigo-700', sent: 'bg-emerald-100 text-emerald-700', paused: 'bg-orange-100 text-orange-700', failed: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-500', scheduled: 'bg-blue-100 text-blue-700', opened: 'bg-indigo-100 text-indigo-700', clicked: 'bg-purple-100 text-purple-700', bounced: 'bg-red-100 text-red-700' };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    if (!campaign) return <div className="text-center py-20 text-slate-500">Campaign not found</div>;

    const funnelData = analytics ? [
        { name: 'Sent', value: parseInt(analytics.total) || 0, fill: '#6366f1' },
        { name: 'Delivered', value: parseInt(analytics.delivered) || 0, fill: '#3b82f6' },
        { name: 'Opened', value: parseInt(analytics.unique_opens) || 0, fill: '#10b981' },
        { name: 'Clicked', value: parseInt(analytics.unique_clicks) || 0, fill: '#8b5cf6' },
    ] : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/email-marketing/campaigns')} className="text-slate-400 hover:text-slate-600 text-lg">&larr;</button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{campaign.name}</h1>
                        <p className="text-sm text-slate-500 mt-1">Subject: {campaign.subject_a}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && <button onClick={() => handleAction('send')} className="btn btn-primary text-sm">Send Now</button>}
                    {campaign.status === 'sending' && <button onClick={() => handleAction('pause')} className="btn btn-secondary text-sm">Pause</button>}
                    {campaign.status === 'paused' && <button onClick={() => handleAction('resume')} className="btn btn-primary text-sm">Resume</button>}
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColors[campaign.status] || 'bg-slate-100'}`}>{campaign.status}</span>
                </div>
            </div>

            {analytics && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {[
                            { l: 'Sent', v: analytics.total, c: 'indigo' },
                            { l: 'Delivered', v: analytics.delivered, c: 'blue' },
                            { l: 'Opened', v: analytics.unique_opens, s: `${analytics.open_rate}%`, c: 'emerald' },
                            { l: 'Clicked', v: analytics.unique_clicks, s: `${analytics.click_rate}%`, c: 'purple' },
                            { l: 'Bounced', v: analytics.bounced, s: `${analytics.bounce_rate}%`, c: 'rose' },
                            { l: 'Unsubs', v: analytics.unsubscribed, c: 'amber' },
                        ].map(s => (
                            <div key={s.l} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] text-slate-500 uppercase">{s.l}</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{s.v || 0}</p>
                                {s.s && <p className={`text-xs text-${s.c}-600 font-medium`}>{s.s}</p>}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Delivery Funnel</h2>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={funnelData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} /><Tooltip />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#6366f1" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Campaign Info</h2>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-slate-500">From:</span> <span className="text-slate-900 dark:text-white">{campaign.from_name} &lt;{campaign.from_email}&gt;</span></p>
                                <p><span className="text-slate-500">Type:</span> <span className="text-slate-900 dark:text-white">{campaign.type}</span></p>
                                <p><span className="text-slate-500">Created:</span> <span className="text-slate-900 dark:text-white">{new Date(campaign.created_at).toLocaleString()}</span></p>
                                {campaign.started_at && <p><span className="text-slate-500">Started:</span> <span className="text-slate-900 dark:text-white">{new Date(campaign.started_at).toLocaleString()}</span></p>}
                                {campaign.completed_at && <p><span className="text-slate-500">Completed:</span> <span className="text-slate-900 dark:text-white">{new Date(campaign.completed_at).toLocaleString()}</span></p>}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white mr-4">Recipients</h2>
                    {['all', 'sent', 'opened', 'clicked', 'bounced', 'failed'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 text-xs rounded-full ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{s === 'all' ? 'All' : s}</button>
                    ))}
                </div>
                {recipients.length === 0 ? (
                    <div className="text-center py-12 text-sm text-slate-400">No recipient data yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500">Email</th>
                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500">Status</th>
                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500">Opens</th>
                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500">Clicks</th>
                                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500">Sent At</th>
                            </tr></thead>
                            <tbody>
                                {recipients.filter(r => statusFilter === 'all' || r.status === statusFilter).map(r => (
                                    <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700/50">
                                        <td className="py-2 px-4 text-sm">{r.email}</td>
                                        <td className="py-2 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[r.status] || 'bg-slate-100'}`}>{r.status}</span></td>
                                        <td className="py-2 px-4 text-sm text-slate-600">{r.open_count || 0}</td>
                                        <td className="py-2 px-4 text-sm text-slate-600">{r.click_count || 0}</td>
                                        <td className="py-2 px-4 text-xs text-slate-500">{r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
