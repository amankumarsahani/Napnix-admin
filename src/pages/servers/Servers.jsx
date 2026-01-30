import React, { useState, useEffect } from 'react';
import serverService from '../../api/admin';

// Inline SVG icon components (Feather-style)
const FiServer = ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
);

const FiPlus = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const FiCheckCircle = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const FiRefreshCw = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);

const FiDatabase = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
);

const FiCloud = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
    </svg>
);
import toast from 'react-hot-toast';

const Servers = () => {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [testingId, setTestingId] = useState(null);
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
            const res = await serverService.getAllServers();
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
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await serverService.createServer(formData);
            if (res.success) {
                toast.success('Server added successfully');
                setIsModalOpen(false);
                fetchServers();
            }
        } catch (_error) {
            toast.error('Failed to add server');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Server Management</h1>
                    <p className="text-gray-500">Distribute your tenants across multiple servers</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <FiPlus /> Add Server
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <FiRefreshCw className="animate-spin text-4xl text-indigo-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servers.map(server => (
                        <div key={server.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    <FiServer size={24} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${server.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {server.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    {server.is_primary && (
                                        <span className="mt-1 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                            Primary
                                        </span>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800">{server.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{server.hostname}</p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiDatabase className="text-gray-400" />
                                    <span>Tenants: <strong>{server.tenant_count || 0}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiCheckCircle className="text-green-500" />
                                    <span>Running: <strong>{server.running_count || 0}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiCloud className="text-sky-500" />
                                    <span className="truncate">Tunnel: {server.cloudflare_tunnel_id || 'N/A'}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleTestConnection(server.id)}
                                disabled={testingId === server.id}
                                className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                {testingId === server.id ? (
                                    <FiRefreshCw className="animate-spin" />
                                ) : (
                                    <FiRefreshCw />
                                )}
                                Test Connection
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Server Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl scale-in">
                        <h2 className="text-2xl font-bold mb-6">Add New Server</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Server-2"
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hostname (via CF Tunnel)</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. ssh2.domain.com"
                                    onChange={e => setFormData({ ...formData, hostname: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cloudflare Tunnel ID</label>
                                <input
                                    type="text" required
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Tunnel UUID"
                                    onChange={e => setFormData({ ...formData, cloudflare_tunnel_id: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Add Server
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
