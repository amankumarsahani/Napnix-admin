import { useState } from 'react';
import { FiTrash2 } from '../../components/icons/FeatherIcons';

const TenantDangerZone = ({ tenant, onDelete, deleteLoading }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteOptions, setDeleteOptions] = useState({ dropDatabase: false });
    const [confirmText, setConfirmText] = useState('');

    const handleDelete = () => {
        onDelete(confirmText, deleteOptions);
    };

    return (
        <>
            <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-900/30 p-6">
                <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                    <FiTrash2 className="w-5 h-5" />
                    Danger Zone
                </h3>
                <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">
                    Permanently delete this tenant and all associated data. This action is irreversible.
                </p>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                    Delete Tenant
                </button>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-semibold text-rose-600 mb-4">Confirm Permanent Deletion</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Type <strong>{tenant.slug}</strong> to confirm deletion of <strong>{tenant.name}</strong>.
                        </p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 mb-4"
                            placeholder={tenant.slug}
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-6">
                            <input
                                type="checkbox"
                                checked={deleteOptions.dropDatabase}
                                onChange={(e) => setDeleteOptions(prev => ({ ...prev, dropDatabase: e.target.checked }))}
                                className="rounded border-slate-300 text-rose-600"
                            />
                            Drop database ({tenant.db_name})
                        </label>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading || confirmText !== tenant.slug}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TenantDangerZone;
