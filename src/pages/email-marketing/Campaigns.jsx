import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSend, FiPlus, FiSearch } from '../../components/icons/FeatherIcons';
import { nmCampaignsAPI } from '../../api/nexmail';

export default function Campaigns() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => { fetchCampaigns(); }, [page]);

    const fetchCampaigns = async () => {
        try {
            const res = await nmCampaignsAPI.getAll({ page, limit: 20 });
            setCampaigns(res.data || []);
        } catch (e) {
            console.error('Fetch campaigns error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Delete this campaign?')) return;
        try {
            await nmCampaignsAPI.delete(id);
            toast.success('Campaign deleted');
            fetchCampaigns();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to delete');
        }
    };

    const statusColors = { draft: 'bg-slate-100 text-slate-700', scheduled: 'bg-blue-100 text-blue-700', queued: 'bg-amber-100 text-amber-700', sending: 'bg-indigo-100 text-indigo-700', sent: 'bg-emerald-100 text-emerald-700', paused: 'bg-orange-100 text-orange-700', failed: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-500' };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Campaigns</h1><p className="text-sm text-slate-500 mt-1">{campaigns.length} campaigns</p></div>
                <button onClick={() => navigate('/email-marketing/campaigns/new')} className="btn btn-primary flex items-center gap-2"><FiPlus className="w-4 h-4" /> New Campaign</button>
            </div>

            {campaigns.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <FiSend className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No campaigns yet</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Create your first campaign</p>
                    <button onClick={() => navigate('/email-marketing/campaigns/new')} className="btn btn-primary">Create Campaign</button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Campaign</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Sent</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Opens</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Clicks</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Created</th>
                            <th className="py-3 px-4"></th>
                        </tr></thead>
                        <tbody>
                            {campaigns.map(c => (
                                <tr key={c.id} onClick={() => navigate(`/email-marketing/campaigns/${c.id}`)} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                                    <td className="py-3 px-4"><p className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</p><p className="text-xs text-slate-500">{c.subject_a}</p></td>
                                    <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status] || statusColors.draft}`}>{c.status}</span></td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{c.total_sent || 0}</td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{c.total_opened || 0}{c.total_sent > 0 ? ` (${Math.round((c.total_opened / c.total_sent) * 100)}%)` : ''}</td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{c.total_clicked || 0}</td>
                                    <td className="py-3 px-4 text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                                    <td className="py-3 px-4"><button onClick={(e) => handleDelete(c.id, e)} className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100">&times;</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
