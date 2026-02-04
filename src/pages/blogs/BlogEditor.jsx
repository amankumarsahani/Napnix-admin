import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BlogService } from '../../api/blogs';
import { FiArrowLeft, FiSave, FiImage, FiType } from '../../components/icons/FeatherIcons';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';


export default function BlogEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: '',
        author: 'Nexspire Admin',
        image: '',
        featured: false,
        status: 'published',
        read_time: 5
    });

    useEffect(() => {
        if (isEditMode) {
            fetchBlog();
        }
    }, [id]);

    const fetchBlog = async () => {
        try {
            setFetching(true);
            const response = await BlogService.getById(id);
            if (response.success && response.blog) {
                setFormData(response.blog);
            } else {
                toast.error('Blog not found');
                navigate('/blogs');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load blog details');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-generate slug from title
        if (name === 'title' && !isEditMode) {
            const slug = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, slug: slug }));
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.slug) {
            toast.error('Title and Slug are required');
            return;
        }

        try {
            setLoading(true);
            if (isEditMode) {
                await BlogService.update(id, formData);
                toast.success('Blog updated successfully');
            } else {
                await BlogService.create(formData);
                toast.success('Blog created successfully');
            }
            navigate('/blogs');
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.error || 'Failed to save blog');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/blogs')}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <FiArrowLeft />
                    <span>Back to Blogs</span>
                </button>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/blogs')}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <FiSave />
                        )}
                        <span>{isEditMode ? 'Update Blog' : 'Publish Blog'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Main Content Form */}
                <div className="col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <FiType />
                            Content Details
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Blog Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter an engaging title..."
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Slug (URL) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange} // Allow manual edit if needed
                                placeholder="my-blog-post-url"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Excerpt
                            </label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Short summary for preview cards..."
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Main Content
                            </label>
                            <div className="prose dark:prose-invert max-w-none">
                                <CKEditor
                                    editor={ClassicEditor}
                                    data={formData.content}
                                    onChange={(event, editor) => {
                                        const data = editor.getData();
                                        setFormData({ ...formData, content: data });
                                    }}
                                    config={{
                                        toolbar: [
                                            'heading', '|',
                                            'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|',
                                            'undo', 'redo'
                                        ],
                                        placeholder: 'Start writing your amazing blog post...'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Options */}
                <div className="col-span-1 space-y-6">
                    {/* Publishing Options */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Publishing</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="featured"
                                name="featured"
                                checked={formData.featured}
                                onChange={handleChange}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="featured" className="text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                                Mark as Featured Post
                            </label>
                        </div>
                    </div>

                    {/* Meta Data */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Meta Data</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="Technology, Guide..."
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Author
                            </label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Read Time (min)
                            </label>
                            <input
                                type="number"
                                name="read_time"
                                value={formData.read_time}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Feature Image */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <FiImage />
                            Feature Image
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Image URL
                            </label>
                            <input
                                type="text"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {formData.image && (
                            <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
