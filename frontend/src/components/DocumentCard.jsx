import { ChevronRight, FileText, ReceiptText } from 'lucide-react';

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

    const statusBadge = {
        signed: {
            label: 'Firmado',
            classes: 'bg-[#f2f4f7] text-[#475467]'
        },
        pending: {
            label: 'Pendiente',
            classes: 'bg-[#fffaeb] text-[#b54708]'
        }
    };

    return (
        <div
            onClick={onClick}
            className={`
                bg-white rounded-[20px] p-5
                border border-transparent
                shadow-sm hover:shadow-md
                transition-all duration-200
                cursor-pointer flex items-center gap-4
                ${className}
            `}
        >
            {/* Document Icon Box */}
            <div className="bg-[#f9fafb] p-3 rounded-2xl text-text-primary">
                <Icon size={24} strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-[17px] font-bold text-text-primary truncate">
                        {title}
                    </h3>
                    {status && statusBadge[status] && (
                        <span className={`${statusBadge[status].classes} px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider`}>
                            {statusBadge[status].label}
                        </span>
                    )}
                </div>
                <div className="flex items-end justify-between">
                    <p className="text-[13px] text-text-secondary font-medium">
                        {subtitle}
                    </p>
                    {amount && (
                        <p className="text-[15px] font-bold text-text-primary">
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
