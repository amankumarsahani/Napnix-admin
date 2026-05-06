import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' }
    });

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const onSubmit = async (data) => {
        setLoading(true);

        const result = await login(data.email, data.password);

        if (result.success) {
            toast.success('Welcome back!');
            navigate('/dashboard', { replace: true });
        } else {
            toast.error(result.message || 'Invalid credentials');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div
                className="hidden lg:flex lg:w-[45%] bg-slate-900 relative flex-col items-center justify-center p-12 overflow-hidden"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            >
                <div className="relative z-10 flex flex-col items-center max-w-sm">
                    <div className="w-16 h-16 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3 text-center">Nexspire</h1>
                    <p className="text-slate-400 text-base leading-relaxed text-center">
                        Multi-tenant business management platform for modern teams.
                    </p>

                    <div className="w-96 h-64 relative">
                        <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <rect x="40" y="50" width="240" height="140" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
                            <rect x="40" y="50" width="240" height="28" rx="8" fill="#1e293b"/>
                            <rect x="40" y="70" width="240" height="2" fill="#334155"/>
                            <circle cx="56" cy="64" r="4" fill="#ef4444" opacity="0.8"/>
                            <circle cx="70" cy="64" r="4" fill="#eab308" opacity="0.8"/>
                            <circle cx="84" cy="64" r="4" fill="#22c55e" opacity="0.8"/>
                            <rect x="40" y="72" width="56" height="118" fill="#0f172a"/>
                            <rect x="48" y="84" width="40" height="6" rx="3" fill="#334155"/>
                            <rect x="48" y="96" width="32" height="6" rx="3" fill="#6366f1" opacity="0.8"/>
                            <rect x="48" y="108" width="36" height="6" rx="3" fill="#334155"/>
                            <rect x="48" y="120" width="28" height="6" rx="3" fill="#334155"/>
                            <rect x="48" y="132" width="34" height="6" rx="3" fill="#334155"/>
                            <rect x="112" y="140" width="16" height="36" rx="3" fill="#6366f1" opacity="0.6"/>
                            <rect x="134" y="120" width="16" height="56" rx="3" fill="#6366f1" opacity="0.8"/>
                            <rect x="156" y="130" width="16" height="46" rx="3" fill="#6366f1" opacity="0.5"/>
                            <rect x="178" y="108" width="16" height="68" rx="3" fill="#6366f1"/>
                            <rect x="200" y="124" width="16" height="52" rx="3" fill="#6366f1" opacity="0.7"/>
                            <rect x="222" y="138" width="16" height="38" rx="3" fill="#6366f1" opacity="0.4"/>
                            <rect x="108" y="82" width="52" height="28" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.5"/>
                            <rect x="166" y="82" width="52" height="28" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.5"/>
                            <rect x="224" y="82" width="52" height="28" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="0.5"/>
                            <rect x="114" y="90" width="24" height="5" rx="2" fill="#e2e8f0" opacity="0.6"/>
                            <rect x="114" y="99" width="16" height="4" rx="2" fill="#6366f1" opacity="0.5"/>
                            <rect x="172" y="90" width="20" height="5" rx="2" fill="#e2e8f0" opacity="0.6"/>
                            <rect x="172" y="99" width="28" height="4" rx="2" fill="#22c55e" opacity="0.5"/>
                            <rect x="230" y="90" width="26" height="5" rx="2" fill="#e2e8f0" opacity="0.6"/>
                            <rect x="230" y="99" width="18" height="4" rx="2" fill="#eab308" opacity="0.5"/>
                            <g transform="translate(245, 30)">
                                <rect width="64" height="32" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
                                <rect x="8" y="8" width="20" height="4" rx="2" fill="#e2e8f0" opacity="0.5"/>
                                <rect x="8" y="16" width="48" height="3" rx="1.5" fill="#334155"/>
                                <rect x="8" y="23" width="32" height="3" rx="1.5" fill="#334155"/>
                            </g>
                        </svg>
                    </div>
                </div>

                <div className="absolute bottom-8 text-center">
                    <p className="text-slate-500 text-xs">&copy; {new Date().getFullYear()} Nexspire Solutions</p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-[55%] bg-white dark:bg-slate-950 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nexspire</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Sign in
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                            Enter your credentials to access the admin panel.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                {...register('email')}
                                className={`block w-full px-3.5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 transition-colors ${errors.email ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                placeholder="you@company.com"
                            />
                            {errors.email && (
                                <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Password
                                </label>
                                <a href="#" className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium">
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    className={`block w-full px-3.5 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 transition-colors ${errors.password ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 dark:bg-slate-800"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                                Remember me
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        Nexspire Admin Portal
                    </p>
                </div>
            </div>
        </div>
    );
}
