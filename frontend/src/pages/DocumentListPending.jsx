import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, History, Clock } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import AppLayout from '../components/AppLayout';
import SegmentedControl from '../components/SegmentedControl';

export default function DocumentListPending() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const statusOptions = [
        { id: 'pending', label: 'Pendientes', icon: Clock },
        { id: 'signed', label: 'Firmados', icon: History },
    ];

    const documents = [
        {
            id: 1,
            title: 'Cuenta de cobro',
            subtitle: 'Periodo: 16 Oct-31 Oct 2023',
            amount: '$2,500,000',
            type: 'receipt'
        },
        {
            id: 2,
            title: 'Cuenta de cobro',
            subtitle: 'Periodo: 01 Oct-15 Oct 2023',
            amount: '$2,500,000',
            type: 'receipt'
        },
    ];

    return (
        <AppLayout title="Mis Cuentas">
            <div className="px-6 py-6 flex flex-col gap-6">
                {/* Segmented Control */}
                <SegmentedControl
                    options={statusOptions}
                    value="pending"
                    onChange={(val) => val === 'signed' && navigate('/documents/signed')}
                />

                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar cuenta o fecha..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl text-[15px] text-text-primary placeholder:text-text-muted/60 shadow-sm border border-transparent focus:border-primary/20 focus:outline-none transition-all"
                    />
                </div>

                {/* Section Group */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-[13px] font-bold text-[#8c8c8c] uppercase tracking-wider px-1">
                        Octubre 2023
                    </h2>
                    <div className="flex flex-col gap-4">
                        {documents.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                title={doc.title}
                                subtitle={doc.subtitle}
                                amount={doc.amount}
                                status="pending"
                                type={doc.type}
                                onClick={() => navigate(`/documents/pending/${doc.id}`)}
                            />
                        ))}
                    </div>
                </div>

                {/* Info Footer (Optional, check if needed in design) */}
                <div className="mt-4 bg-[#fef9c3]/30 border border-[#fef9c3] p-4 rounded-2xl relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#fbbf24]" />
                    <p className="text-[14px] font-bold text-[#854d0e] mb-1">
                        ¿Dudas con tu pago?
                    </p>
                    <p className="text-[13px] text-[#a16207] leading-relaxed">
                        Si el monto no coincide, repórtalo inmediatamente al administrador.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
