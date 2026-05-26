import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { mobileAppAdminAPI } from '../../api/admin';

export default function MobileApp() {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        version_name: '',
        build_number: '',
        release_notes: '',
        file: null
    });

    const { data: release = null, isLoading: loading } = useQuery({
        queryKey: ['mobileAppRelease'],
        queryFn: async () => {
            const response = await mobileAppAdminAPI.getCurrentRelease();
            return response.release || null;
        },
    });

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!form.file) {
            toast.error('Choose an APK file first');
            return;
        }

        const payload = new FormData();
        payload.append('file', form.file);
        payload.append('version_name', form.version_name);
        payload.append('build_number', form.build_number);
        payload.append('release_notes', form.release_notes);

        setUploading(true);
        try {
            await mobileAppAdminAPI.uploadRelease(payload);
            setForm({
                version_name: '',
                build_number: '',
                release_notes: '',
                file: null
            });
            const fileInput = document.getElementById('mobile-apk-file');
            if (fileInput) fileInput.value = '';
            toast.success('APK uploaded successfully');
            queryClient.invalidateQueries({ queryKey: ['mobileAppRelease'] });
        } catch (error) {
            console.error('Failed to upload APK:', error);
            toast.error(error?.response?.data?.error || 'Failed to upload APK');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Android Distribution</p>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Mobile App APK</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                            Upload a new APK from Napnix Admin. The previous published APK is replaced immediately, and every tenant CRM gets the updated Android download link.
                        </p>
                    </div>
                    {release?.download_url && (
                        <a
                            href={release.download_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                        >
                            <span>Download Current APK</span>
                        </a>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Current Release</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">The APK currently visible across all NexCRM tenants.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ) : release ? (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Version</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{release.version_name || 'Not set'}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Build</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{release.build_number || 'Not set'}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">File</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 break-all">{release.original_file_name || 'android.apk'}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Uploaded</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                                        {release.uploaded_at ? new Date(release.uploaded_at).toLocaleString() : 'Unknown'}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Release Notes</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">
                                    {release.release_notes || 'No release notes added.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No APK has been published yet.</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Upload the first Android build from the form on the right.</p>
                        </div>
                    )}
                </section>

                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Publish New APK</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Uploading a new file deletes the previously published APK from registry storage.</p>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">APK File</label>
                            <input
                                id="mobile-apk-file"
                                type="file"
                                accept=".apk,application/vnd.android.package-archive"
                                onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                                className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Version Name</label>
                                <input
                                    type="text"
                                    value={form.version_name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, version_name: e.target.value }))}
                                    placeholder="e.g. 2.4.0"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Build Number</label>
                                <input
                                    type="text"
                                    value={form.build_number}
                                    onChange={(e) => setForm((prev) => ({ ...prev, build_number: e.target.value }))}
                                    placeholder="e.g. 240"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Release Notes</label>
                            <textarea
                                rows="6"
                                value={form.release_notes}
                                onChange={(e) => setForm((prev) => ({ ...prev, release_notes: e.target.value }))}
                                placeholder="What changed in this build?"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium shadow-sm"
                        >
                            {uploading ? 'Uploading...' : 'Upload and Publish'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
