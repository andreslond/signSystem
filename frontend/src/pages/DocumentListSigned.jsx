import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, History, Clock } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import AppLayout from '../components/AppLayout';
import SegmentedControl from '../components/SegmentedControl';

export default function DocumentListSigned() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const statusOptions = [
        { id: 'pending', label: 'Pendientes', icon: Clock },
        { id: 'signed', label: 'Firmados', icon: History },
    ];

    const documentsByMonth = {
        'Octubre 2023': [
            {
                id: 1,
                title: 'Cuenta de cobro',
                subtitle: 'Periodo: 16 Oct-31 Oct 2023',
                amount: '$2,500,000',
                status: 'signed'
            },
            {
                id: 2,
                title: 'Cuenta de cobro',
                subtitle: 'Periodo: 01 Oct-15 Oct 2023',
                amount: '$2,500,000',
                status: 'signed'
            },
        ],
        'Septiembre 2023': [
            {
                id: 3,
                title: 'Cuenta de cobro',
                subtitle: 'Periodo: 16 Sep-30 Sep 2023',
                amount: '$2,500,000',
                status: 'signed'
            },
            {
                id: 4,
                title: 'Ajuste de Tarifa',
                subtitle: 'Septiembre 2023',
                amount: '$500,000',
                status: 'signed'
            },
        ],
    };

    return (
        <AppLayout title="Mis Cuentas">
            <div className="px-6 py-6 flex flex-col gap-6">
                {/* Segmented Control */}
                <SegmentedControl
                    options={statusOptions}
                    value="signed"
                    onChange={(val) => val === 'pending' && navigate('/documents/pending')}
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
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-surface-alt rounded-2xl text-[15px] text-text-primary placeholder:text-text-muted/60 shadow-sm border border-transparent dark:border-border-light focus:border-primary/20 focus:outline-none transition-all"
                    />
                </div>

                {/* Grouped Documents */}
                <div className="flex flex-col gap-8">
                    {Object.entries(documentsByMonth).map(([month, docs]) => (
                        <div key={month} className="flex flex-col gap-4">
                            <h2 className="text-[13px] font-bold text-[#8c8c8c] uppercase tracking-wider px-1">
                                {month}
                            </h2>
                            <div className="flex flex-col gap-4">
                                {docs.map((doc) => (
                                    <DocumentCard
                                        key={doc.id}
                                        title={doc.title}
                                        subtitle={doc.subtitle}
                                        amount={doc.amount}
                                        status={doc.status}
                                        onClick={() => navigate(`/documents/signed/${doc.id}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
