import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import toast from 'react-hot-toast';
import { blogsAPI } from '../../api';

// Lazy load CKEditor to prevent build failures if not installed
let CKEditorComponent = null;
let ClassicEditorBuild = null;

try {
    const CKEditorModule = await import('@ckeditor/ckeditor5-react');
    const ClassicModule = await import('@ckeditor/ckeditor5-build-classic');
    CKEditorComponent = CKEditorModule.CKEditor;
    ClassicEditorBuild = ClassicModule.default;
} catch (e) {
    // CKEditor not installed, will use fallback textarea
    console.log('CKEditor not available, using textarea fallback');
}

// Rich text editor component with fallback
const RichTextEditor = ({ value, onChange }) => {
    if (CKEditorComponent && ClassicEditorBuild) {
        return (
            <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                <CKEditorComponent
                    editor={ClassicEditorBuild}
                    data={value}
                    config={{
                        toolbar: [
                            'heading', '|',
                            'bold', 'italic', 'link', '|',
                            'bulletedList', 'numberedList', '|',
                            'blockQuote', 'insertTable', '|',
                            'undo', 'redo'
                        ],
                        placeholder: 'Write your blog content here...'
                    }}
                    onChange={(event, editor) => {
                        onChange(editor.getData());
                    }}
                />
            </div>
        );
    }

    // Fallback textarea if CKEditor is not available
    return (
        <div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={10}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                placeholder="<p>Your blog content here...</p> (HTML supported)"
            />
            <p className="text-xs text-amber-600 mt-1">
                ⚠️ Install CKEditor for rich text editing: npm install @ckeditor/ckeditor5-react @ckeditor/ckeditor5-build-classic
            </p>
        </div>
    );
};

export default function BlogsList() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: '',
        author: '',
        image: '',
        featured: false,
        status: 'draft',
        read_time: ''
    });

    // Predefined categories + dynamic from existing blogs
    const defaultCategories = ['Technology', 'Business', 'Design', 'Development', 'AI & ML', 'Cloud', 'Mobile'];

    const availableCategories = useMemo(() => {
        const existingCategories = blogs
            .map(b => b.category)
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i);
        return [...new Set([...defaultCategories, ...existingCategories])].sort();
    }, [blogs]);

    useEffect(() => {
        loadBlogs();
    }, []);

    const loadBlogs = async () => {
        try {
            setLoading(true);
            const response = await blogsAPI.getAll();
            setBlogs(response.blogs || []);
        } catch (error) {
            console.error('Error loading blogs:', error);
            toast.error('Failed to load blogs');
        } finally {
            setLoading(false);
        }
    };

    const filteredBlogs = useMemo(() => {
        return blogs.filter(blog => {
            const matchesSearch = blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                blog.category?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || blog.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [blogs, searchQuery, statusFilter]);

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const openCreateModal = () => {
        setEditingBlog(null);
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            category: '',
            author: '',
            image: '',
            featured: false,
            status: 'draft',
            read_time: ''
        });
        setShowModal(true);
    };

    const openEditModal = (blog) => {
        setEditingBlog(blog);
        setFormData({
            title: blog.title || '',
            slug: blog.slug || '',
            excerpt: blog.excerpt || '',
            content: blog.content || '',
            category: blog.category || '',
            author: blog.author || '',
            image: blog.image || '',
            featured: blog.featured || false,
            status: blog.status || 'draft',
            read_time: blog.read_time || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.slug) {
            toast.error('Title and slug are required');
            return;
        }

        setSaving(true);
        try {
            if (editingBlog) {
                await blogsAPI.update(editingBlog.id, formData);
                toast.success('Blog updated successfully');
            } else {
                await blogsAPI.create(formData);
                toast.success('Blog created successfully');
            }
            setShowModal(false);
            loadBlogs();
        } catch (error) {
            console.error('Error saving blog:', error);
            toast.error(error.response?.data?.message || 'Failed to save blog');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this blog?')) return;

        try {
            await blogsAPI.delete(id);
            toast.success('Blog deleted successfully');
            loadBlogs();
        } catch (error) {
            console.error('Error deleting blog:', error);
            toast.error('Failed to delete blog');
        }
    };

    const toggleStatus = async (blog) => {
        const newStatus = blog.status === 'published' ? 'draft' : 'published';
        try {
            await blogsAPI.update(blog.id, { ...blog, status: newStatus });
            toast.success(`Blog ${newStatus === 'published' ? 'published' : 'unpublished'}`);
            loadBlogs();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const toggleFeatured = async (blog) => {
        try {
            await blogsAPI.update(blog.id, { ...blog, featured: !blog.featured });
            toast.success(`Blog ${!blog.featured ? 'featured' : 'unfeatured'}`);
            loadBlogs();
        } catch (error) {
            toast.error('Failed to update featured status');
        }
    };

    // Handle image file upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploading(true);

        try {
            // Create FormData for upload
            const uploadData = new FormData();
            uploadData.append('file', file);

            // Try to upload to backend
            const response = await blogsAPI.uploadImage(uploadData);
            if (response.url) {
                setFormData({ ...formData, image: response.url });
                toast.success('Image uploaded successfully');
            }
        } catch (error) {
            console.error('Upload error:', error);
            // Fallback: Use base64 for local preview if upload fails
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData({ ...formData, image: event.target.result });
                toast.success('Image loaded (local preview)');
            };
            reader.readAsDataURL(file);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Blog Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Create, edit, and manage your blog posts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadBlogs}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">New Blog Post</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search blogs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none pr-10"
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{blogs.length}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Total Posts</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-bold text-emerald-600">{blogs.filter(b => b.status === 'published').length}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Published</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-bold text-amber-600">{blogs.filter(b => b.status === 'draft').length}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Drafts</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-bold text-brand-600">{blogs.filter(b => b.featured).length}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Featured</div>
                </div>
            </div>

            {/* Blogs Grid */}
            {filteredBlogs.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No blogs found</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Get started by creating a new blog post.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBlogs.map((blog) => (
                        <div key={blog.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-200 group">
                            {/* Image Section with proper fallback */}
                            <div className="aspect-video bg-slate-100 dark:bg-slate-700 overflow-hidden relative">
                                {blog.image ? (
                                    <img
                                        src={blog.image}
                                        alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 ${blog.image ? 'hidden' : ''}`}>
                                    <svg className="w-16 h-16 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                {/* Status overlay */}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border backdrop-blur-sm ${blog.status === 'published'
                                        ? 'bg-emerald-100/90 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-100/90 text-amber-700 border-amber-200'
                                        }`}>
                                        {blog.status === 'published' ? 'Published' : 'Draft'}
                                    </span>
                                    {blog.featured && (
                                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-brand-100/90 text-brand-700 border border-brand-200 backdrop-blur-sm">
                                            ★ Featured
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-5">
                                {blog.category && (
                                    <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 mb-3">
                                        {blog.category}
                                    </span>
                                )}
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                                    {blog.title}
                                </h3>
                                {blog.excerpt && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                                        {blog.excerpt}
                                    </p>
                                )}
                                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-semibold">
                                            {(blog.author || 'A')[0].toUpperCase()}
                                        </div>
                                        <span>{blog.author || 'Unknown'}</span>
                                    </div>
                                    <span>{blog.read_time || '5 min read'}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                        onClick={() => openEditModal(blog)}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(blog)}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                    >
                                        {blog.status === 'published' ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button
                                        onClick={() => toggleFeatured(blog)}
                                        className={`p-2 rounded-lg transition-colors ${blog.featured
                                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        title={blog.featured ? 'Remove from featured' : 'Add to featured'}
                                    >
                                        <svg className="w-5 h-5" fill={blog.featured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(blog.id)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-transparent dark:border-slate-700">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                                {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Image Upload Section */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cover Image</label>
                                <div className="flex gap-4">
                                    <div className="w-40 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0 relative">
                                        {formData.image ? (
                                            <img
                                                src={formData.image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = '';
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.image}
                                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                placeholder="https://example.com/image.jpg"
                                                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Upload
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500">Enter an image URL or upload a file (max 5MB)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                title: e.target.value,
                                                slug: !editingBlog ? generateSlug(e.target.value) : formData.slug
                                            });
                                        }}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="e.g. 10 Tips for Better Design"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Slug *</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="10-tips-for-better-design"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Excerpt</label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="A brief summary of your blog post..."
                                />
                            </div>

                            {/* Rich Text Editor for Content */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Content</label>
                                <RichTextEditor
                                    value={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Category Dropdown */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                    <div className="relative">
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                                        >
                                            <option value="">Select Category</option>
                                            {availableCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500 dark:text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Author</label>
                                    <input
                                        type="text"
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Read Time</label>
                                    <input
                                        type="text"
                                        value={formData.read_time}
                                        onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                                        placeholder="5 min read"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                                    <div className="relative">
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500 dark:text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.featured}
                                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Featured Post</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-6 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-brand-500/25 hover:bg-brand-700 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving && (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                {editingBlog ? 'Update Blog' : 'Create Blog'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
