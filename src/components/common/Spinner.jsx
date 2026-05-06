const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
};

export default function Spinner({ size = 'lg', className }) {
    return (
        <div className={`animate-spin rounded-full border-b-2 border-brand-600 ${sizes[size] || sizes.lg} ${className || ''}`} />
    );
}

export function FullPageSpinner({ size = 'lg' }) {
    return (
        <div className="flex items-center justify-center h-64">
            <Spinner size={size} />
        </div>
    );
}
