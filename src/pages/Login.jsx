import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { Button, Field, Input } from '../components/ui';

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

// Dead controls removed: "Forgot password?" linked to "#" and "Remember me" was never read.
export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    const onSubmit = async data => {
        setLoading(true);
        const result = await login(data.email, data.password);
        if (result.success) {
            toast.success('Welcome back');
            navigate('/dashboard', { replace: true });
        } else {
            toast.error(result.message || 'Invalid credentials');
        }
        setLoading(false);
    };

    return (
        <main className="grid min-h-dvh place-items-center bg-canvas p-4">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex items-center gap-3">
                    <img src="/napnix-mark.png" alt="" className="size-10 rounded-sm" />
                    <div>
                        <h1 className="text-xl font-semibold text-fg">Napnix Admin</h1>
                        <p className="text-sm text-fg-muted">Sign in to continue</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-md border border-border bg-surface p-5">
                    <Field label="Email" error={errors.email?.message}>
                        <Input type="email" autoComplete="username" placeholder="you@company.com" data-autofocus {...register('email')} />
                    </Field>
                    <Field label="Password" error={errors.password?.message}>
                        <div className="relative">
                            <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="pr-10" {...register('password')} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(s => !s)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                aria-pressed={showPassword}
                                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-fg-subtle hover:text-fg"
                            >
                                {showPassword ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
                            </button>
                        </div>
                    </Field>
                    <Button variant="primary" type="submit" loading={loading} className="w-full">Sign in</Button>
                </form>
            </div>
        </main>
    );
}
