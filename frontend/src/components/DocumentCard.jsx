import { ChevronRight, FileText, ReceiptText } from 'lucide-react';

export const DocumentStatus = {
    PENDING: 'PENDING',
    SIGNED: 'SIGNED',
    INVALIDATED: 'INVALIDATED',
};

// Status badge configurations
const statusBadgeConfig = {
    PENDING: {
        label: 'Pendiente',
        classes: 'bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning border border-warning/30 dark:border-warning/40',
    },
    SIGNED: {
        label: 'Firmado',
        classes: 'bg-surface dark:bg-surface-alt text-text-secondary dark:text-text-muted border border-border/50 dark:border-border-dark/50',
    },
    INVALIDATED: {
        label: 'Invalidado',
        classes: 'bg-error/10 dark:bg-error/20 text-error dark:text-error border border-error/30 dark:border-error/40',
    },
};

/**
 * Maps API status values to badge configuration
 * @param {string} status - Status from API
 * @returns {Object} Badge configuration
 */
export function getStatusBadge(status) {
    const normalizedStatus = status?.toUpperCase();
    return statusBadgeConfig[normalizedStatus] || statusBadgeConfig.PENDING;
}

export default function DocumentCard({
    title,
    subtitle,
    status,
    amount,
    type = 'receipt', // 'receipt' or 'document'
    onClick,
    className = ''
}) {
    const Icon = type === 'receipt' ? ReceiptText : FileText;

    return (
        <div
            onClick={onClick}
            className={`
                bg-background dark:bg-surface rounded-[20px] p-5
                border border-transparent dark:border-border
                shadow-card hover:shadow-card-hover
                transition-all duration-200
                cursor-pointer flex items-center gap-4
                ${className}
            `}
        >
            {/* Document Icon Box */}
            <div className="bg-surface-alt dark:bg-surface-alt p-3 rounded-2xl text-text-primary">
                <Icon size={24} strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-[17px] font-bold text-text-primary truncate">
                        {title}
                    </h3>
                    {status && (
                        <span className={`${getStatusBadge(status).classes} px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors`}>
                            {getStatusBadge(status).label}
                        </span>
                    )}
                </div>
                <div className="flex items-end justify-between">
                    <p className="text-[13px] text-text-secondary font-medium transition-colors">
                        {subtitle}
                    </p>
                    {amount && (
                        <p className="text-[15px] font-bold text-text-primary transition-colors">
                            {amount}
                        </p>
                    )}
                </div>
            </div>

            <div className="text-text-muted/40">
                <ChevronRight size={20} strokeWidth={2.5} />
            </div>
        </div>
    );
}
