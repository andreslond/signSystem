import { ChevronRight, FileText, ReceiptText, Clock, CheckCircle } from 'lucide-react';

export const DocumentStatus = {
    PENDING: 'PENDING',
    SIGNED: 'SIGNED',
    INVALIDATED: 'INVALIDATED',
};

// Status badge configurations
const statusBadgeConfig = {
    PENDING: {
        label: 'Pendiente',
        classes: 'bg-red-50 dark:bg-red-900/30 text-primary ring-primary/20',
    },
    SIGNED: {
        label: 'Firmado',
        classes: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-green-600/20',
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

/**
 * Format date as DD/MM/YYYY
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Calculate days remaining until deadline or days overdue
 * @param {string} deadline - ISO date string
 * @returns {Object} Object with text and isExpired flag
 */
const getDaysInfo = (deadline) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return { 
            text: `Vencido hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`, 
            isExpired: true 
        };
    } else if (diffDays === 0) {
        return { text: 'Vence hoy', isExpired: false };
    } else if (diffDays === 1) {
        return { text: 'Vence mañana', isExpired: false };
    } else {
        return { text: `${diffDays} días restantes`, isExpired: false };
    }
};

/**
 * Format amount as COP currency
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string
 */
const formatAmount = (amount) => {
    if (amount == null) return null;
    const num = typeof amount === 'string' 
        ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) 
        : amount;
    if (isNaN(num)) return null;
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
};

export default function DocumentCard({
    title,
    subtitle,
    status,
    amount,
    type = 'receipt',
    onClick,
    className = '',
    deadline,
    signedAt
}) {
    const Icon = type === 'receipt' ? ReceiptText : FileText;
    const isPending = status === 'PENDING';
    const daysInfo = isPending ? getDaysInfo(deadline) : null;
    const formattedAmount = formatAmount(amount);
    
    return (
        <div
            onClick={onClick}
            className={`
                group flex flex-col gap-3 rounded-2xl bg-surface dark:bg-surface-alt p-4 shadow-sm 
                border border-gray-100 dark:border-gray-700 hover:border-primary/40 dark:hover:border-primary/30 
                transition-all cursor-pointer active:scale-[0.98]
                ${className}
            `}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <Icon size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                            {title || 'Cuenta de cobro'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {subtitle || 'Sin período'}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {formattedAmount && (
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {formattedAmount}
                        </span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${
                        isPending 
                            ? 'bg-red-50 dark:bg-red-900/30 text-primary ring-primary/20'
                            : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-green-600/20'
                    }`}>
                        {isPending ? 'Pendiente' : 'Firmado'}
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    {isPending ? (
                        <>
                            <Clock size={14} />
                            <span>Esperando firma</span>
                            {daysInfo && (
                                <span className={daysInfo.isExpired ? 'text-red-500 font-medium' : 'text-orange-500 font-medium'}>
                                    • {daysInfo.text}
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <CheckCircle size={14} className="text-green-600" />
                            <span>Firmado el {signedAt ? formatDate(signedAt) : ''}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center text-primary font-bold text-sm group-hover:underline">
                    {isPending ? 'Ver detalle' : 'Ver documento'}
                    <ChevronRight size={16} className="ml-1" />
                </div>
            </div>
        </div>
    );
}
