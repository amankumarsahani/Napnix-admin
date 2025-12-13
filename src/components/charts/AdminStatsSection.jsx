/**
 * Admin Stats Dashboard Section
 * Shows charts and statistics for admin users
 */
import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../api';
import { LeadStatusChart, InquiryStatusChart, ConversionRateCard } from './DashboardCharts';
import toast from 'react-hot-toast';

export default function AdminStatsSection() {
    const [leadStats, setLeadStats] = useState(null);
    const [inquiryStats, setInquiryStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [leadsRes, inquiriesRes] = await Promise.all([
                dashboardAPI.getLeadStats(),
                dashboardAPI.getInquiryStats()
            ]);
            setLeadStats(leadsRes);
            setInquiryStats(inquiriesRes?.data || inquiriesRes);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Don't show error toast - might not have permission
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-2xl h-80 animate-pulse bg-slate-100"></div>
                    <div className="glass-panel p-6 rounded-2xl h-80 animate-pulse bg-slate-100"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Conversion Rates */}
            <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Conversion Overview</h3>
                <ConversionRateCard inquiryStats={inquiryStats} leadStats={leadStats} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lead Status Chart */}
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Leads by Status</h3>
                        <span className="text-sm text-slate-500">
                            Total: {leadStats?.total || 0}
                        </span>
                    </div>
                    <LeadStatusChart data={leadStats} />
                </div>

                {/* Inquiry Status Chart */}
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Inquiries by Status</h3>
                        <span className="text-sm text-slate-500">
                            Total: {inquiryStats?.total || 0}
                        </span>
                    </div>
                    <InquiryStatusChart data={inquiryStats} />
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium uppercase">New Leads</p>
                    <p className="text-2xl font-bold text-brand-600">{leadStats?.newLeads || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium uppercase">Qualified</p>
                    <p className="text-2xl font-bold text-purple-600">{leadStats?.qualified || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium uppercase">Won</p>
                    <p className="text-2xl font-bold text-emerald-600">{leadStats?.won || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium uppercase">Total Value</p>
                    <p className="text-2xl font-bold text-amber-600">
                        ${(leadStats?.totalValue || 0).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
