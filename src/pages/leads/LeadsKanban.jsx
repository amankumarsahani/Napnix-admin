import { useState } from 'react';

const initialColumns = {
    new: { id: 'new', title: 'New Leads', color: 'bg-blue-500' },
    contacted: { id: 'contacted', title: 'In Discussion', color: 'bg-amber-500' },
    qualified: { id: 'qualified', title: 'Qualified', color: 'bg-purple-500' },
    won: { id: 'won', title: 'Closed Won', color: 'bg-emerald-500' },
};

export default function LeadsKanban({ leads = [], onUpdateStatus }) {
    // Group leads by status
    const getLeadsByStatus = (status) => {
        return leads.filter(lead => lead.status?.toLowerCase() === status);
    };

    return (
        <div className="flex overflow-x-auto gap-6 pb-6 h-[calc(100vh-250px)]">
            {Object.values(initialColumns).map((col) => {
                const colLeads = getLeadsByStatus(col.id);
                const totalValue = colLeads.reduce((sum, lead) => sum + (parseFloat(lead.estimatedValue) || 0), 0);

                return (
                    <div key={col.id} className="min-w-[320px] max-w-[320px] flex flex-col">
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${col.color}`}></span>
                                <h3 className="font-bold text-slate-700">{col.title}</h3>
                                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{colLeads.length}</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-400">Rs.{totalValue.toLocaleString()}</span>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 bg-slate-100/50 rounded-2xl p-2 md:p-3 overflow-y-auto custom-scrollbar border border-slate-200/50 space-y-3">
                            {colLeads.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lead.company}</span>
                                        <div className="flex gap-1">
                                            {lead.score > 0 && (
                                                <div
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${lead.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                        lead.score >= 50 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-rose-100 text-rose-700'
                                                        }`}
                                                >
                                                    {lead.score}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1 group-hover:text-brand-600 transition-colors">{lead.contactName}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        <span className="truncate">{lead.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                        <span className="font-bold text-slate-700">Rs.{parseFloat(lead.estimatedValue || 0).toLocaleString()}</span>
                                        <div className="flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-brand-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-brand-600">
                                                {lead.contactName[0]}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {colLeads.length === 0 && (
                                <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                                    No leads
                                </div>
                            )}

                            {/* Quick Add Button */}
                            <button className="w-full py-2 flex items-center justify-center gap-2 text-slate-500 hover:text-brand-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 text-sm font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Deal
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
