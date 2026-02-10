export default function Button({
    children,
    variant = 'primary',
    type = 'button',
    onClick,
    icon: Icon,
    className = '',
    ...props
}) {
    const baseClasses = 'flex items-center justify-center gap-2 px-6 py-3.5 font-semibold transition-all duration-200 cursor-pointer text-base';

    const variants = {
        primary: 'bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:translate-y-[-1px]',
        secondary: 'bg-transparent text-text-primary border border-border rounded-xl hover:bg-surface',
        text: 'bg-transparent text-primary hover:underline font-medium',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseClasses} ${variants[variant]} ${className}`}
            {...props}
        >
            <span>{children}</span>
            {Icon && <Icon size={20} strokeWidth={2.5} />}
        </button>
    );
}
