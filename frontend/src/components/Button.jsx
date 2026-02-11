import { Loader2 } from 'lucide-react';

export default function Button({
    children,
    variant = 'primary',
    type = 'button',
    onClick,
    icon: Icon,
    className = '',
    loading = false,
    disabled = false,
    ...props
}) {
    const baseClasses = 'flex items-center justify-center gap-2 px-6 py-3.5 font-semibold transition-all duration-200 text-base disabled:opacity-70 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary text-white rounded-xl shadow-lg shadow-primary/20 enabled:hover:translate-y-[-1px] cursor-pointer',
        secondary: 'bg-transparent text-text-primary border border-border rounded-xl enabled:hover:bg-surface cursor-pointer',
        text: 'bg-transparent text-primary enabled:hover:underline font-medium cursor-pointer',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClasses} ${variants[variant]} ${className}`}
            {...props}
        >
            {loading ? (
                <Loader2 className="animate-spin" size={20} strokeWidth={2.5} />
            ) : (
                <>
                    <span>{children}</span>
                    {Icon && <Icon size={20} strokeWidth={2.5} />}
                </>
            )}
        </button>
    );
}
