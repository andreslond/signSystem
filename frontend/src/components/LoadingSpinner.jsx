import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner Component
 * Displays a centered loading spinner with optional text
 */
export default function LoadingSpinner({ text = 'Cargando...', size = 'medium' }) {
    const sizeClasses = {
        small: 'w-5 h-5',
        medium: 'w-8 h-8',
        large: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 
                className={`animate-spin text-primary ${sizeClasses[size]}`} 
                size={24}
            />
            {text && (
                <p className="text-sm text-text-muted font-medium animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}

/**
 * LoadingOverlay Component
 * Full-screen loading overlay with spinner
 */
export function LoadingOverlay({ text = 'Cargando...' }) {
    return (
        <div className="fixed inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 
                    className="animate-spin text-primary w-10 h-10" 
                    size={40}
                />
                <p className="text-sm text-text-muted font-medium">
                    {text}
                </p>
            </div>
        </div>
    );
}
