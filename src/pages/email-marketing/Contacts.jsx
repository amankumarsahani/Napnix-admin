import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUsers, FiSearch, FiPlus, FiUpload } from '../../components/icons/FeatherIcons';
import { nmContactsAPI } from '../../api/nexmail';
import Pagination from '../../components/common/Pagination';

export default function Contacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ email: '', first_name: '', last_name: '', phone: '', company: '' });
    const [importData, setImportData] = useState('');
    const limit = 25;

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await nmContactsAPI.getAll({ page, limit, search, status: statusFilter || undefined });
            setContacts(res.data || []);
            setTotal(res.total || 0);
        } catch (e) {
            console.error('Fetch contacts error:', e);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => { fetchContacts(); }, [fetchContacts]);

    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const handleAdd = async () => {
        if (!addForm.email) return toast.error('Email is required');
        try {
            await nmContactsAPI.create(addForm);
            toast.success('Contact added');
            setShowAdd(false);
            setAddForm({ email: '', first_name: '', last_name: '', phone: '', company: '' });
            fetchContacts();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to add contact');
        }
    };

    const handleImport = async () => {
        try {
            const lines = importData.trim().split('\n').filter(l => l.trim());
            if (lines.length === 0) return toast.error('No data to import');

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const emailIdx = headers.findIndex(h => h === 'email' || h === 'e-mail');
            if (emailIdx === -1) return toast.error('CSV must have an "email" column');

            const parsed = lines.slice(1).map(line => {
                const cols = line.split(',').map(c => c.trim());
                const obj = {};
                headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
                return obj;
            }).filter(c => c.email);

            const res = await nmContactsAPI.import({ contacts: parsed });
            toast.success(`Imported: ${res.imported}, Skipped: ${res.skipped}`);
            setShowImport(false);
            setImportData('');
            fetchContacts();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Import failed');
        }
    };

    const scoreColor = (score) => {
        if (score >= 70) return 'text-emerald-600 bg-emerald-50';
        if (score >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    const statusBadge = (status) => {
        const colors = { subscribed: 'bg-emerald-100 text-emerald-700', unsubscribed: 'bg-slate-100 text-slate-600', bounced: 'bg-red-100 text-red-700', complained: 'bg-orange-100 text-orange-700', pending: 'bg-amber-100 text-amber-700' };
        return colors[status] || 'bg-slate-100 text-slate-600';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contacts</h1><p className="text-sm text-slate-500 mt-1">{total.toLocaleString()} total contacts</p></div>
                <div className="flex gap-2">
                    <button onClick={() => setShowImport(true)} className="btn btn-secondary flex items-center gap-2"><FiUpload className="w-4 h-4" /> Import</button>
                    <button onClick={() => setShowAdd(true)} className="btn btn-primary flex items-center gap-2"><FiPlus className="w-4 h-4" /> Add</button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="text" placeholder="Search by email, name, company..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="flex gap-1">
                        {['', 'subscribed', 'unsubscribed', 'bounced'].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs rounded-full font-medium ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                {s || 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : contacts.length === 0 ? (
                    <div className="text-center py-20">
                        <FiUsers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">{search ? 'No contacts match your search' : 'No contacts yet'}</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">Import from CSV or add manually</p>
                        {!search && <button onClick={() => setShowImport(true)} className="btn btn-primary">Import Contacts</button>}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Score</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Source</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Emails</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Opens</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Added</th>
                                </tr></thead>
                                <tbody>
                                    {contacts.map(c => (
                                        <tr key={c.id} onClick={() => navigate(`/email-marketing/contacts/${c.id}`)} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                                            <td className="py-3 px-4">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{c.email}</p>
                                                <p className="text-xs text-slate-500">{[c.first_name, c.last_name].filter(Boolean).join(' ')}{c.company ? ` · ${c.company}` : ''}</p>
                                            </td>
                                            <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(c.status)}`}>{c.status}</span></td>
                                            <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreColor(c.email_score)}`}>{c.email_score}</span></td>
                                            <td className="py-3 px-4 text-xs text-slate-500">{c.source?.replace('_', ' ')}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{c.email_count || 0}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{c.open_count || 0}</td>
                                            <td className="py-3 px-4 text-xs text-slate-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {total > limit && <div className="p-4 border-t border-slate-200 dark:border-slate-700"><Pagination currentPage={page} totalItems={total} itemsPerPage={limit} onPageChange={setPage} /></div>}
                    </>
                )}
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add Contact</h2>
                        <div className="space-y-3">
                            {[{ k: 'email', label: 'Email *', type: 'email', ph: 'john@example.com' }, { k: 'first_name', label: 'First Name', ph: 'John' }, { k: 'last_name', label: 'Last Name', ph: 'Doe' }, { k: 'phone', label: 'Phone', ph: '+1234567890' }, { k: 'company', label: 'Company', ph: 'Acme Inc' }].map(f => (
                                <div key={f.k}><label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label><input type={f.type || 'text'} value={addForm[f.k]} onChange={e => setAddForm({ ...addForm, [f.k]: e.target.value })} placeholder={f.ph} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6"><button onClick={() => setShowAdd(false)} className="btn btn-secondary flex-1">Cancel</button><button onClick={handleAdd} className="btn btn-primary flex-1">Add Contact</button></div>
                    </div>
                </div>
            )}

            {showImport && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowImport(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-xl w-full" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Import Contacts</h2>
                        <p className="text-xs text-slate-500 mb-4">Paste CSV data below. First row must be headers. Required: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">email</code> column.</p>
                        <textarea value={importData} onChange={e => setImportData(e.target.value)} rows={10} placeholder={"email,first_name,last_name,company\njohn@example.com,John,Doe,Acme\njane@example.com,Jane,Smith,Globex"}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
                        <div className="flex gap-3 mt-4"><button onClick={() => setShowImport(false)} className="btn btn-secondary flex-1">Cancel</button><button onClick={handleImport} className="btn btn-primary flex-1">Import</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
