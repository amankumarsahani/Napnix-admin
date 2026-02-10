import React, { useState, useEffect } from 'react';
import { FiHardDrive, FiPlus, FiCheckCircle, FiRefreshCw, FiTrash2, FiKey, FiFolder, FiEdit2 } from '../../components/icons/FeatherIcons';
import serverService from '../../api/admin';
import toast from 'react-hot-toast';

const BackupAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        account_name: '',
        credentials_json: '',
        folder_id: '',
        subject_email: ''
    });

    const fetchAccounts = async () => {
        try {
            const res = await serverService.getAllBackupAccounts();
            if (res.success) setAccounts(res.data);
        } catch (_error) {
            toast.error('Failed to load backup accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this backup account?')) return;
        try {
            const res = await serverService.deleteBackupAccount(id);
            if (res.success) {
                toast.success('Account deleted');
                fetchAccounts();
            }
        } catch (error) {
            toast.error('Failed to delete account');
        }
    };

    const [editingId, setEditingId] = useState(null);

    const handleEdit = (account) => {
        let credentials = account.credentials_json || {};
        if (typeof credentials === 'string') {
            try {
                credentials = JSON.parse(credentials);
            } catch (e) {
                console.error('Failed to parse credentials:', e);
            }
        }

        setFormData({
            account_name: account.account_name,
            credentials_json: JSON.stringify(credentials, null, 2),
            folder_id: account.folder_id || '',
            subject_email: account.subject_email || ''
        });
        setEditingId(account.id);
        setIsModalOpen(true);
    };

    const handleOpenCreate = () => {
        setFormData({
            account_name: '',
            credentials_json: '',
            folder_id: '',
            subject_email: ''
        });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const json = JSON.parse(formData.credentials_json);
            const payload = { ...formData, credentials_json: json };

            let res;
            if (editingId) {
                res = await serverService.updateBackupAccount(editingId, payload);
            } else {
                res = await serverService.createBackupAccount(payload);
            }

            if (res.success) {
                toast.success(editingId ? 'Account updated' : 'Backup account added');
                setIsModalOpen(false);
                fetchAccounts();
            }
        } catch (error) {
            toast.error(error instanceof SyntaxError ? 'Invalid JSON format' : 'Failed to save account');
        }
    };

    const handleRunBackup = async () => {
        if (!confirm('Are you sure you want to trigger a manual backup for ALL tenants? This might affect performance.')) return;

        const toastId = toast.loading('Starting backup process...');
        try {
            const res = await serverService.triggerManualBackup();
            if (res.success) {
                toast.success('Backup started in background', { id: toastId });
            }
        } catch (error) {
            toast.error('Failed to start backup', { id: toastId });
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Backup Infrastructure</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage Google Drive accounts for automated backups</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRunBackup}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <FiRefreshCw /> Run Backup Now
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                        <FiPlus /> Add GDrive Account
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <FiRefreshCw className="animate-spin text-4xl text-green-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {accounts.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full mb-4">
                                <FiHardDrive className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Backup Accounts</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
                                Connect a Google Drive Service Account to enable automated database backups.
                            </p>
                            <button
                                onClick={handleOpenCreate}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                <FiPlus /> Connect First Account
                            </button>
                        </div>
                    ) : (
                        accounts.map(account => (
                            <div key={account.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 relative group">
                                <div className="absolute top-6 right-6 flex gap-2">
                                    <button
                                        onClick={() => handleEdit(account)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                        title="Edit Account"
                                    >
                                        <FiEdit2 />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                        title="Delete Account"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                        <FiHardDrive size={24} />
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${account.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {account.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{account.account_name}</h3>

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <FiFolder className="text-gray-400 dark:text-gray-500" />
                                        <span className="truncate">Folder: {account.folder_id || 'Root'}</span>
                                    </div>
                                    {account.subject_email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <FiKey className="text-gray-400 dark:text-gray-500" />
                                            <span className="truncate">Impersonating: {account.subject_email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <FiRefreshCw className="text-gray-400 dark:text-gray-500" />
                                        <span>Used for: <strong className="text-gray-900 dark:text-white">{account.usage_count}</strong> backups</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Add/Edit Account Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-8 shadow-2xl scale-in border border-slate-100 dark:border-slate-700">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                            <FiKey className="text-amber-500" />
                            {editingId ? 'Edit Google Drive Account' : 'Connect Google Drive Account'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Label</label>
                                <input
                                    type="text" required
                                    value={formData.account_name}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-500"
                                    placeholder="e.g. My Primary GDrive"
                                    onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service Account Credentials (JSON)</label>
                                <textarea
                                    required rows={8}
                                    value={formData.credentials_json}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-500"
                                    placeholder='Paste the content of your Google Service Account JSON file here...'
                                    onChange={e => setFormData({ ...formData, credentials_json: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Folder ID (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.folder_id}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-500"
                                        placeholder="Google Drive Folder ID"
                                        onChange={e => setFormData({ ...formData, folder_id: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Use a Shared Drive ID or leave blank to root</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Impersonate Email (Workspace Only)</label>
                                    <input
                                        type="email"
                                        value={formData.subject_email}
                                        className={`w-full px-4 py-2 rounded-lg border ${formData.subject_email && formData.subject_email.endsWith('@gmail.com') ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500' : 'border-slate-300 dark:border-slate-600 focus:border-green-500 focus:ring-green-500'} bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 placeholder-slate-500`}
                                        placeholder="admin@company.com"
                                        onChange={e => setFormData({ ...formData, subject_email: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Leave blank for standard Service Account access. Required <b>only</b> for Domain-Wide Delegation.</p>
                                    {formData.subject_email && formData.subject_email.endsWith('@gmail.com') && (
                                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            ⚠️ Personal @gmail.com accounts do not support impersonation.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                                >
                                    {editingId ? 'Update Account' : 'Save Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


export default BackupAccounts;
