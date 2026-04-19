import React, { useState, useEffect } from 'react';
import {
    FiServer, FiPlus, FiCheckCircle, FiRefreshCw, FiDatabase, FiCloud, FiEdit2
} from '../../components/icons/FeatherIcons';
import serverService from '../../api/admin';
import toast from 'react-hot-toast';

const Servers = () => {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [testingId, setTestingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        hostname: '',
        ssh_user: 'admin',
        cloudflare_tunnel_id: '',
        db_host: 'localhost',
        is_active: true
    });

    const fetchServers = async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            const res = await serverService.getAllServers(params);
            if (res.success) setServers(res.data);
        } catch (_error) {
            toast.error('Failed to load servers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const handleTestConnection = async (id) => {
        setTestingId(id);
        try {
            const res = await serverService.testConnection(id);
            if (res.success) {
                toast.success(`Server ${id} is reachable! (PM2 v${res.version})`);
            } else {
                toast.error(`Connection failed: ${res.message}`);
            }
        } catch (_error) {
            toast.error('Connection test failed');
        } finally {
            setTestingId(null);
        }
    };

    const handleEdit = (server) => {
        setEditingId(server.id);
        setFormData({
            name: server.name,
            hostname: server.hostname,
            ssh_user: server.ssh_user,
            cloudflare_tunnel_id: server.cloudflare_tunnel_id,
            db_host: server.db_host,
            is_active: server.is_active
        });
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (server) => {
        try {
            const newStatus = !server.is_active;
            const res = await serverService.updateServer(server.id, { is_active: newStatus });
            if (res.success) {
                toast.success(`Server ${newStatus ? 'activated' : 'deactivated'}`);
                fetchServers();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            name: '',
            hostname: '',
            ssh_user: 'admin',
            cloudflare_tunnel_id: '',
            db_host: 'localhost',
            is_active: true
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (editingId) {
                res = await serverService.updateServer(editingId, formData);
            } else {
                res = await serverService.createServer(formData);
            }

            if (res.success) {
                toast.success(`Server ${editingId ? 'updated' : 'added'} successfully`);
                closeModal();
                fetchServers();
            }
        } catch (_error) {
            toast.error(`Failed to ${editingId ? 'update' : 'add'} server`);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Server Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Distribute your tenants across multiple servers</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                >
                    <FiPlus /> Add Server
                </button>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Search servers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <FiRefreshCw className="animate-spin text-4xl text-indigo-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servers.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-4">
                                <FiServer className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Servers Configured</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-sm">
                                Add your first server to start deploying tenants. You'll need the Cloudflare Tunnel ID and credentials.
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                <FiPlus /> Add First Server
                            </button>
                        </div>
                    ) : (
                        servers.map(server => (
                            <div key={server.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <FiServer size={24} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(server)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${server.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                                                    }`}
                                                title={server.is_active ? 'Deactivate (Maintenance Mode)' : 'Activate'}
                                            >
                                                <span
                                                    className={`${server.is_active ? 'translate-x-5' : 'translate-x-1'
                                                        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                                                />
                                            </button>
                                            <span className={`text-xs font-medium ${server.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                                                {server.is_active ? 'Active' : 'Maintenance'}
                                            </span>
                                        </div>
                                        {server.is_primary && (
                                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{server.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-mono">{server.hostname}</p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <FiDatabase className="text-slate-400" />
                                        <span>Tenants: <strong>{server.tenant_count || 0}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <FiCheckCircle className="text-green-500" />
                                        <span>Running: <strong>{server.running_count || 0}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <FiCloud className="text-sky-500" />
                                        <span className="truncate max-w-[150px]" title={server.cloudflare_tunnel_id}>
                                            Tunnel: {server.cloudflare_tunnel_id?.substring(0, 8)}...
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleTestConnection(server.id)}
                                        disabled={testingId === server.id}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                    >
                                        {testingId === server.id ? <FiRefreshCw className="animate-spin" /> : <FiRefreshCw />}
                                        Test
                                    </button>
                                    <button
                                        onClick={() => handleEdit(server)}
                                        className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                                        title="Edit Server"
                                    >
                                        <FiEdit2 />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Add/Edit Server Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl scale-in border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Server' : 'Add New Server'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500"
                                    placeholder="e.g. Server-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hostname (via CF Tunnel)</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500"
                                    placeholder="e.g. ssh2.domain.com"
                                    value={formData.hostname}
                                    onChange={e => setFormData({ ...formData, hostname: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cloudflare Tunnel ID</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500"
                                    placeholder="Tunnel UUID"
                                    value={formData.cloudflare_tunnel_id}
                                    onChange={e => setFormData({ ...formData, cloudflare_tunnel_id: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                                >
                                    {editingId ? 'Save Changes' : 'Add Server'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Servers;