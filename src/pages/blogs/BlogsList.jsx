import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { blogsAPI } from '../../api';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiClock } from '../../components/icons/FeatherIcons';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function BlogsList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmState, setConfirmState] = useState({ isOpen: false });
    const { currentPage, totalPages, totalItems, pageSize, goToPage, setPagination, resetPage } = usePagination(10);

    const { data: response, isLoading: loading } = useQuery({
        queryKey: ['blogs', { page: currentPage, search: searchTerm }],
        queryFn: () => {
            const params = { page: currentPage, limit: pageSize };
            if (searchTerm) params.search = searchTerm;
            return blogsAPI.getAll(params);
        },
    });

    const blogs = response?.success ? (response.blogs || []) : [];

    if (response?.pagination && response.pagination.totalPages !== totalPages) {
        setPagination(response.pagination);
    }

    const handleDelete = (id) => {
        setConfirmState({
            isOpen: true,
            title: 'Delete Blog',
            message: 'Are you sure you want to delete this blog? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                setConfirmState({ isOpen: false });
                try {
                    await blogsAPI.delete(id);
                    toast.success('Blog deleted successfully');
                    queryClient.invalidateQueries({ queryKey: ['blogs'] });
                } catch (error) {
                    toast.error('Failed to delete blog');
                }
            },
        });
    };

    const handleFeatureToggle = async (blog) => {
        try {
            await blogsAPI.update(blog.id, { featured: !blog.featured });
            toast.success(`Blog ${!blog.featured ? 'featured' : 'unfeatured'} successfully`);
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
        } catch (error) {
            toast.error('Failed to update blog status');
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        resetPage();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Blogs</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your blog posts and content</p>
                </div>
                <Link
                    to="/blogs/new"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <FiPlus />
                    <span>Create Blog</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search blogs..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {blogs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No blogs found.
                                    </td>
                                </tr>
                            ) : (
                                blogs.map((blog) => (
                                    <tr key={blog.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {blog.image && (
                                                    <img
                                                        src={blog.image}
                                                        alt={blog.title}
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{blog.title}</h3>
                                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{blog.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                {blog.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {blog.author}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-medium ${blog.status === 'published'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                                                </span>
                                                {blog.featured && (
                                                    <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                        FEATURED
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(blog.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleFeatureToggle(blog)}
                                                    className={`p-2 rounded-lg transition-colors ${blog.featured
                                                        ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                                        : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                        }`}
                                                    title={blog.featured ? "Remove from featured" : "Mark as featured"}
                                                >
                                                    <div className="h-4 w-4">★</div>
                                                </button>
                                                <Link
                                                    to={`/blogs/${blog.id}/edit`}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(blog.id)}
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
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={goToPage} />
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
