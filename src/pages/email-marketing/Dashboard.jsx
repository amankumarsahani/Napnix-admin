import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiMail, FiUsers, FiSend, FiTrendingUp, FiMousePointer, FiBarChart2 } from '../../components/icons/FeatherIcons';
import { nmAnalyticsAPI } from '../../api/nexmail';

export default function EmailMarketingDashboard() {
    const navigate = useNavigate();

    const { data: dashData, isLoading: loading } = useQuery({
        queryKey: ['nexmail-dashboard'],
        queryFn: async () => {
            const [dashRes, volumeRes, growthRes] = await Promise.allSettled([
                nmAnalyticsAPI.getDashboard(),
                nmAnalyticsAPI.getSendVolume(30),
                nmAnalyticsAPI.getGrowth(90)
            ]);
            return {
                stats: dashRes.status === 'fulfilled' && dashRes.value?.data ? dashRes.value.data : { contacts: { total: 0, subscribed: 0 }, campaigns: { total: 0, sent: 0, active: 0 }, emails_30d: { total_sent: 0, open_rate: 0, click_rate: 0, total_bounced: 0 } },
                sendVolume: volumeRes.status === 'fulfilled' && volumeRes.value?.data ? volumeRes.value.data : [],
                growth: growthRes.status === 'fulfilled' && growthRes.value?.data ? growthRes.value.data : [],
            };
        },
    });

    const stats = dashData?.stats || { contacts: { total: 0, subscribed: 0 }, campaigns: { total: 0, sent: 0, active: 0 }, emails_30d: { total_sent: 0, open_rate: 0, click_rate: 0, total_bounced: 0 } };
    const sendVolume = dashData?.sendVolume || [];
    const growth = dashData?.growth || [];

    const cards = [
        { title: 'Total Contacts', value: (stats.contacts?.total || 0).toLocaleString(), icon: <FiUsers />, color: 'indigo', path: '/email-marketing/contacts' },
        { title: 'Campaigns Sent', value: stats.campaigns?.sent || 0, icon: <FiSend />, color: 'emerald', path: '/email-marketing/campaigns' },
        { title: 'Emails Sent (30d)', value: (stats.emails_30d?.total_sent || 0).toLocaleString(), icon: <FiMail />, color: 'blue' },
        { title: 'Avg Open Rate', value: `${stats.emails_30d?.open_rate || 0}%`, icon: <FiTrendingUp />, color: 'amber' },
        { title: 'Avg Click Rate', value: `${stats.emails_30d?.click_rate || 0}%`, icon: <FiMousePointer />, color: 'purple' },
        { title: 'Bounced', value: stats.emails_30d?.total_bounced || 0, icon: <FiBarChart2 />, color: 'rose' },
    ];

    const colorMap = {
        indigo: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
        rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600',
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">NexMail Dashboard</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Email marketing analytics</p></div>
                <button onClick={() => navigate('/email-marketing/campaigns/new')} className="btn btn-primary flex items-center gap-2"><FiSend className="w-4 h-4" /> New Campaign</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map(card => (
                    <div key={card.title} onClick={() => card.path && navigate(card.path)} className={`bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 ${card.path ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
                        <div className="flex items-center justify-between">
                            <div><p className="text-xs text-slate-500 uppercase tracking-wide">{card.title}</p><p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p></div>
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}><div className="text-lg">{card.icon}</div></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Send Volume (30 days)</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={sendVolume}>
                            <defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice?.(5) || v} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: 8 }} />
                            <Area type="monotone" dataKey="sent" stroke="#6366f1" fill="url(#gs)" strokeWidth={2} name="Sent" />
                            <Area type="monotone" dataKey="opened" stroke="#10b981" fill="none" strokeWidth={2} name="Opened" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Subscriber Growth</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={growth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: 8 }} />
                            <Bar dataKey="subscribed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Subscribed" />
                            <Bar dataKey="unsubscribed" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Unsubscribed" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                        { label: 'New Campaign', path: '/email-marketing/campaigns/new', icon: '📨' },
                        { label: 'Import Contacts', path: '/email-marketing/contacts', icon: '📋' },
                        { label: 'Build Template', path: '/email-marketing/templates/new', icon: '🎨' },
                        { label: 'New Automation', path: '/email-marketing/automations/new', icon: '⚡' },
                        { label: 'SMTP Setup', path: '/email-marketing/smtp', icon: '⚙️' },
                    ].map(a => (
                        <button key={a.label} onClick={() => navigate(a.path)} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors text-left">
                            <span className="text-2xl">{a.icon}</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{a.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
