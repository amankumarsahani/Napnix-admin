import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiLayout, FiPlus, FiSearch, FiCopy } from '../../components/icons/FeatherIcons';
import { nmTemplatesAPI } from '../../api/nexmail';

export default function Templates() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    const { data: templates = [], isLoading: loading } = useQuery({
        queryKey: ['nexmail-templates', { search }],
        queryFn: async () => {
            const res = await nmTemplatesAPI.getAll({ search: search || undefined });
            return res.data || [];
        },
    });

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Delete this template?')) return;
        try {
            await nmTemplatesAPI.delete(id);
            toast.success('Template deleted');
            queryClient.invalidateQueries({ queryKey: ['nexmail-templates'] });
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    const handleClone = async (id, e) => {
        e.stopPropagation();
        try {
            const res = await nmTemplatesAPI.clone(id);
            toast.success('Template cloned');
            navigate(`/email-marketing/templates/${res.templateId}/edit`);
        } catch (e) {
            toast.error('Failed to clone');
        }
    };

    const statusColors = { draft: 'bg-slate-100 text-slate-600', active: 'bg-emerald-100 text-emerald-700', archived: 'bg-amber-100 text-amber-700' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Email Templates</h1><p className="text-sm text-slate-500 mt-1">{templates.length} templates</p></div>
                <button onClick={() => navigate('/email-marketing/templates/new')} className="btn btn-primary flex items-center gap-2"><FiPlus className="w-4 h-4" /> New Template</button>
            </div>

            <div className="relative max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
            ) : templates.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <FiLayout className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">{search ? 'No templates match your search' : 'No templates yet'}</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Create your first email template</p>
                    {!search && <button onClick={() => navigate('/email-marketing/templates/new')} className="btn btn-primary mx-auto">Create Template</button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <div key={t.id} onClick={() => navigate(`/email-marketing/templates/${t.id}/edit`)} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="h-36 bg-slate-50 dark:bg-slate-700 flex items-center justify-center relative">
                                <FiLayout className="w-8 h-8 text-slate-300" />
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => handleClone(t.id, e)} className="w-7 h-7 rounded bg-white dark:bg-slate-600 shadow text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-brand-50" title="Clone"><FiCopy className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => handleDelete(t.id, e)} className="w-7 h-7 rounded bg-white dark:bg-slate-600 shadow text-red-500 flex items-center justify-center hover:bg-red-50" title="Delete">&times;</button>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{t.name}</h3>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[t.status] || statusColors.draft}`}>{t.status}</span>
                                </div>
                                <p className="text-xs text-slate-500">{t.category} &middot; v{t.version} &middot; {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : ''}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
