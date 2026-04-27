import { useParams, useNavigate } from 'react-router-dom';

export default function ContactDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/email-marketing/contacts')} className="text-slate-400 hover:text-slate-600">&larr;</button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Detail</h1>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">Contact #{id} details will be displayed here.</p>
            </div>
        </div>
    );
}
