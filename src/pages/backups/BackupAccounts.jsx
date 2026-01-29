import React, { useState, useEffect } from 'react';
import { FiHardDrive, FiPlus, FiCheckCircle, FiRefreshCw, FiTrash2, FiKey, FiFolder } from 'react-icons/fi';
import serverService from '../../api/admin';
import toast from 'react-hot-toast';

const BackupAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        account_name: '',
        credentials_json: '',
        folder_id: ''
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const json = JSON.parse(formData.credentials_json);
            const res = await serverService.createBackupAccount({
                ...formData,
                credentials_json: json
            });
            if (res.success) {
                toast.success('Backup account added');
                setIsModalOpen(false);
                fetchAccounts();
            }
        } catch (error) {
            toast.error(error instanceof SyntaxError ? 'Invalid JSON format' : 'Failed to add account');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Backup Infrastructure</h1>
                    <p className="text-gray-500">Manage Google Drive accounts for automated backups</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                    <FiPlus /> Add GDrive Account
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <FiRefreshCw className="animate-spin text-4xl text-green-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {accounts.map(account => (
                        <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                    <FiHardDrive size={24} />
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {account.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800">{account.account_name}</h3>

                            <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiFolder className="text-gray-400" />
                                    <span className="truncate">Folder: {account.folder_id || 'Root'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiRefreshCw className="text-gray-400" />
                                    <span>Used for: <strong>{account.usage_count}</strong> backups</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Account Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl scale-in">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <FiKey className="text-amber-500" />
                            Connect Google Drive Account
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Label</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g. My Primary GDrive"
                                    onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Account Credentials (JSON)</label>
                                <textarea
                                    required rows={8}
                                    className="w-full px-4 py-2 rounded-lg border font-mono text-xs focus:ring-2 focus:ring-green-500"
                                    placeholder='Paste the content of your Google Service Account JSON file here...'
                                    onChange={e => setFormData({ ...formData, credentials_json: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Folder ID (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-green-500"
                                    placeholder="Google Drive Folder ID"
                                    onChange={e => setFormData({ ...formData, folder_id: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                                >
                                    Save Account
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
