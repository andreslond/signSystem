import { useEffect, useState } from 'react';

export default function Modal({
    isOpen,
    onClose,
    children,
    title,
    variant = 'center', // 'center' or 'drawer'
    className = ''
}) {
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setShouldRender(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    const isDrawer = variant === 'drawer';

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className={`
                    relative bg-surface dark:bg-surface w-full max-w-[440px] mx-auto transition-all duration-300 transform
                    ${isDrawer
                        ? 'rounded-t-[32px] p-8 pb-10 shadow-card-hover translate-y-0'
                        : 'rounded-[24px] p-6 m-4 shadow-card'}
                    ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
                    ${className}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {isDrawer && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-border rounded-full" />
                )}

                {title && (
                    <h2 className="text-xl font-bold text-text-primary mb-4">
                        {title}
                    </h2>
                )}
                {children}
            </div>
        </div>
    );
}
