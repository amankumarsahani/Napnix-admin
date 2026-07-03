import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { portfolioAPI } from '../../api';
import { FiPlus, FiSearch, FiEdit2, FiTrash2 } from '../../components/icons/FeatherIcons';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function PortfolioList() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmState, setConfirmState] = useState({ isOpen: false });

    useEffect(() => {
        fetchProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const params = { status: 'all' };
            if (searchTerm) params.search = searchTerm;
            const response = await portfolioAPI.getAll(params);
            if (response.success) setProjects(response.projects || []);
        } catch {
            toast.error('Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmState({
            isOpen: true,
            title: 'Delete Project',
            message: 'Are you sure you want to delete this project? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                setConfirmState({ isOpen: false });
                try {
                    await portfolioAPI.delete(id);
                    toast.success('Project deleted');
                    fetchProjects();
                } catch {
                    toast.error('Failed to delete project');
                }
            },
        });
    };

    const handleFeatureToggle = async (project) => {
        try {
            await portfolioAPI.update(project.id, { featured: !project.featured });
            toast.success(`Project ${!project.featured ? 'featured' : 'unfeatured'}`);
            fetchProjects();
        } catch {
            toast.error('Failed to update project');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Portfolio</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage the projects shown on the agency website</p>
                </div>
                <Link
                    to="/portfolio/new"
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                >
                    <FiPlus />
                    <span>Add Project</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {projects.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No projects found.
                                    </td>
                                </tr>
                            ) : (
                                projects.map((project) => (
                                    <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {project.image_url ? (
                                                    <img src={project.image_url} alt={project.title} className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white font-bold text-sm">
                                                        {project.title?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{project.title}</h3>
                                                    <p className="text-xs text-slate-500 truncate max-w-[220px]">{project.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                {project.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{project.sort_order}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-medium ${project.status === 'published'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                                </span>
                                                {project.featured && (
                                                    <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                                                        FEATURED
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleFeatureToggle(project)}
                                                    className={`p-2 rounded-lg transition-colors ${project.featured
                                                        ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                                        : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                        }`}
                                                    title={project.featured ? 'Remove from featured' : 'Mark as featured'}
                                                >
                                                    <div className="h-4 w-4">★</div>
                                                </button>
                                                <Link
                                                    to={`/portfolio/${project.id}/edit`}
                                                    className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(project.id)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false })}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmText={confirmState.confirmText}
            />
        </div>
    );
}
