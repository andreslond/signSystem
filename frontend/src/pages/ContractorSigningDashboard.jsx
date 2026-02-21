import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, CheckCircle, Clock, Users, FileCheck, AlertCircle, X } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useEmployees } from '../hooks/useEmployees';

// Helper function to format date to DD/MM/YYYY
const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Stats Card Component
function StatsCard({ icon: Icon, label, value, color, bgColor, borderColor }) {
    return (
        <div className={`flex items-center gap-4 p-4 rounded-2xl ${bgColor} border ${borderColor} transition-all hover:scale-[1.02]`}>
            <div className={`p-3 rounded-xl ${color} bg-white/50 dark:bg-white/10`}>
                <Icon size={24} strokeWidth={2} />
            </div>
            <div>
                <p className="text-sm font-medium text-text-muted">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
        </div>
    );
}

// Contractor Card Component
function ContractorCard({ contractor, onNavigate }) {
    const hasPending = contractor.stats?.pending > 0;
    
    return (
        <div className="group bg-surface dark:bg-surface-alt p-5 rounded-2xl border border-border-light/50 dark:border-border-light shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${hasPending ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'} shrink-0 transition-colors`}>
                        <User size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-text-primary text-lg truncate group-hover:text-primary transition-colors">
                            {contractor.name}
                        </h3>
                        <p className="text-text-muted text-sm">
                            {contractor.identification_type} {contractor.identification_number}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-warning/10 p-3 rounded-xl border border-warning/20">
                        <div className="flex items-center gap-2 text-warning mb-1">
                            <Clock size={16} />
                            <span className="text-xs font-bold uppercase">Pendientes</span>
                        </div>
                        <p className="text-2xl font-bold text-warning">{contractor.stats?.pending || 0}</p>
                    </div>
                    <div className="bg-success/10 p-3 rounded-xl border border-success/20">
                        <div className="flex items-center gap-2 text-success mb-1">
                            <CheckCircle size={16} />
                            <span className="text-xs font-bold uppercase">Firmados</span>
                        </div>
                        <p className="text-2xl font-bold text-success">{contractor.stats?.signed || 0}</p>
                    </div>
                </div>

                {/* Status or Recent Documents */}
                <div className="text-sm">
                    {contractor.stats?.pending === 0 ? (
                        <div className="flex items-center gap-2 p-3 bg-success/10 rounded-xl border border-success/20">
                            <CheckCircle size={18} className="text-success shrink-0" />
                            <p className="text-sm font-medium text-success">Todos los documentos firmados</p>
                        </div>
                    ) : (
                        <>
                            <p className="font-semibold text-text-muted mb-2">Últimos pendientes:</p>
                            {contractor.lastDocuments?.pending?.length > 0 ? (
                                <ul className="space-y-1">
                                    {contractor.lastDocuments.pending.slice(0, 3).map(doc => (
                                        <li key={doc.id} className="text-xs text-text-primary truncate flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-warning shrink-0"></span>
                                            {formatShortDate(doc.payroll_period_start)} - {formatShortDate(doc.payroll_period_end)}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-text-muted/60 italic">No hay pendientes</p>
                            )}
                        </>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={() => onNavigate(contractor.id)}
                    className="w-full py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all text-sm active:scale-[0.98]"
                >
                    Ver Detalle
                </button>
            </div>
        </div>
    );
}

// Empty State Component
function EmptyState({ searchQuery }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
            <div className="p-4 bg-surface-alt dark:bg-surface rounded-full mb-4">
                <Users size={48} className="text-text-muted/40" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
                {searchQuery ? 'Sin resultados' : 'No hay contratistas'}
            </h3>
            <p className="text-sm text-text-muted text-center max-w-sm">
                {searchQuery 
                    ? `No se encontraron contratistas que coincidan con "${searchQuery}"`
                    : 'Los contratistas aparecerán aquí una vez que se registren en el sistema.'
                }
            </p>
        </div>
    );
}

export default function ContractorSigningDashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    
    // Fetch all employees without pagination (limit: 100 to get all)
    const {
        employees,
        loading,
        error,
        pagination,
    } = useEmployees({ initialSearch: '', initialLimit: 100 });

    // Filter and sort employees locally
    const filteredAndSortedEmployees = useMemo(() => {
        let result = [...employees];
        
        // Filter by search query locally
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(emp => 
                emp.name?.toLowerCase().includes(query) ||
                emp.identification_number?.includes(query) ||
                emp.identification_type?.toLowerCase().includes(query)
            );
        }
        
        // Sort by pending documents (most pending first)
        result.sort((a, b) => {
            const aPending = a.stats?.pending || 0;
            const bPending = b.stats?.pending || 0;
            return bPending - aPending;
        });
        
        return result;
    }, [employees, searchQuery]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleNavigate = (contractorId) => {
        navigate(`/signed-documents/${contractorId}`);
    };

    // Calculate aggregate stats from all employees (not filtered)
    const totalContractors = pagination.total || employees.length;
    const totalPending = employees.reduce((sum, e) => sum + (e.stats?.pending || 0), 0);
    const totalSigned = employees.reduce((sum, e) => sum + (e.stats?.signed || 0), 0);
    const contractorsWithPending = employees.filter(e => (e.stats?.pending || 0) > 0).length;

    if (error) {
        return (
            <AppLayout title="Documentos firmados">
                <div className="px-4 md:px-6 py-6 flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="p-4 bg-error/10 rounded-full mb-4">
                        <AlertCircle size={48} className="text-error" />
                    </div>
                    <h2 className="text-lg font-bold text-text-primary mb-2">Error al cargar</h2>
                    <p className="text-sm text-text-muted text-center mb-4">{error.message}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Documentos firmados">
            <div className="px-4 md:px-6 py-6 flex flex-col gap-6 max-w-7xl mx-auto">
                
                {/* Header Section with Stats */}
                <div className="flex flex-col gap-4">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatsCard
                            icon={Users}
                            label="Contratistas"
                            value={totalContractors}
                            color="text-primary"
                            bgColor="bg-primary/5"
                            borderColor="border-primary/20"
                        />
                        <StatsCard
                            icon={AlertCircle}
                            label="Sin firmar"
                            value={contractorsWithPending}
                            color="text-warning"
                            bgColor="bg-warning/5"
                            borderColor="border-warning/20"
                        />
                    </div>

                    {/* Search Bar - Local filtering */}
                    <div className="w-full max-w-xl">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60 group-focus-within:text-primary transition-colors">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o identificación..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-12 pr-10 py-3.5 bg-surface dark:bg-surface-alt rounded-2xl text-[15px] text-text-primary placeholder:text-text-muted/60 shadow-sm border border-transparent dark:border-border-light focus:border-primary/30 focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && employees.length === 0 && (
                    <div className="flex justify-center items-center h-64">
                        <LoadingSpinner text="Cargando contratistas..." />
                    </div>
                )}

                {/* Contractors Grid - Sorted by pending (most pending first) */}
                {!loading || employees.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredAndSortedEmployees.map((contractor) => (
                            <ContractorCard 
                                key={contractor.id} 
                                contractor={contractor} 
                                onNavigate={handleNavigate}
                            />
                        ))}
                        
                        {filteredAndSortedEmployees.length === 0 && !loading && (
                            <EmptyState searchQuery={searchQuery} />
                        )}
                    </div>
                ) : null}

                {/* Results Count */}
                {filteredAndSortedEmployees.length > 0 && (
                    <div className="text-center py-2">
                        <p className="text-sm text-text-muted">
                            Mostrando {filteredAndSortedEmployees.length} contratista{filteredAndSortedEmployees.length !== 1 ? 's' : ''}
                            {searchQuery && ` para "${searchQuery}"`}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
