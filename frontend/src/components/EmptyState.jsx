import { FileText, RefreshCw } from 'lucide-react';

/**
 * EmptyState Component
 * Displays a friendly message when there's no content to show
 */
export default function EmptyState({
    icon: Icon = FileText,
    title,
    description,
    actionLabel,
    onAction,
    className = ''
}) {
    return (
        <div 
            className={`
                flex flex-col items-center justify-center py-16 px-6 
                text-center gap-4
                ${className}
            `}
        >
            <div className="bg-surface dark:bg-surface-alt p-4 rounded-full">
                <Icon 
                    size={48} 
                    strokeWidth={1} 
                    className="text-text-muted/40"
                />
            </div>
            
            <div className="flex flex-col gap-2 max-w-sm">
                {title && (
                    <h3 className="text-lg font-bold text-text-primary">
                        {title}
                    </h3>
                )}
                
                {description && (
                    <p className="text-sm text-text-secondary leading-relaxed">
                        {description}
                    </p>
                )}
            </div>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="
                        flex items-center gap-2
                        mt-2 px-5 py-2.5
                        bg-primary text-white
                        rounded-xl font-medium text-sm
                        hover:bg-primary/90
                        transition-all duration-200
                        shadow-md hover:shadow-lg
                    "
                >
                    <RefreshCw size={16} />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

/**
 * EmptyDocumentState - Specialized empty state for documents
 */
export function EmptyDocumentState({ onRetry }) {
    return (
        <EmptyState
            icon={FileText}
            title="No hay documentos"
            description="Aún no tienes documentos para revisar. Tus documentos aparecerán aquí cuando estén disponibles."
            actionLabel="Reintentar"
            onAction={onRetry}
        />
    );
}

/**
 * EmptyPendingState - Specialized empty state for pending documents
 */
export function EmptyPendingState({ onRetry }) {
    return (
        <EmptyState
            icon={FileText}
            title="Sin documentos pendientes"
            description="¡Genial! No tienes documentos pendientes por firmar en este momento."
            actionLabel="Reintentar"
            onAction={onRetry}
        />
    );
}

/**
 * EmptySignedState - Specialized empty state for signed documents
 */
export function EmptySignedState({ onRetry }) {
    return (
        <EmptyState
            icon={FileText}
            title="Sin documentos firmados"
            description="Aún no has firmado ningún documento. Tus documentos firmados aparecerán aquí."
            actionLabel="Reintentar"
            onAction={onRetry}
        />
    );
}
