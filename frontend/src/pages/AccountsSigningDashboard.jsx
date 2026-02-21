import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, FileText, CheckCircle, Clock } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination, { SimplePagination } from '../components/Pagination';
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

export default function AccountsSigningDashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const {
        employees,
        loading,
        error,
        pagination,
        setSearch
    } = useEmployees({ initialSearch: searchQuery });

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setSearch(e.target.value);
    };

    const handlePageChange = (newPage) => {
        pagination.goToPage(newPage);
    };

    if (loading && employees.length === 0) {
        return (
            <AppLayout title="Panel de Firmas">
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner text="Cargando Panel de Firmas..." />
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout title="Panel de Firmas">
                <div className="p-6 text-center text-error">
                    <p>Error al cargar el panel: {error.message}</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Panel de Firmas">
            <div className="px-4 md:px-6 py-6 flex flex-col gap-6 max-w-7xl mx-auto">

                {/* Search Bar - Full width on mobile, max-w-xl on desktop */}
                <div className="w-full max-w-xl">
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o identificación..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full pl-12 pr-4 py-3.5 bg-surface dark:bg-surface-alt rounded-2xl text-[15px] text-text-primary placeholder:text-text-muted/60 shadow-sm border border-transparent dark:border-border-light focus:border-primary/20 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Employees Grid - Responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {employees.map((employee) => (
                        <div key={employee.id} className="bg-surface dark:bg-surface-alt p-5 rounded-2xl border border-border-light/50 dark:border-border-light shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-text-primary text-lg truncate">{employee.name}</h3>
                                            <p className="text-text-muted text-sm">{employee.identification_type} {employee.identification_number}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-warning/10 p-3 rounded-xl border border-warning/20">
                                            <div className="flex items-center gap-2 text-warning mb-1">
                                                <Clock size={16} />
                                                <span className="text-xs font-bold uppercase">Pendientes</span>
                                            </div>
                                            <p className="text-2xl font-bold text-warning">{employee.stats?.pending || 0}</p>
                                        </div>
                                        <div className="bg-success/10 p-3 rounded-xl border border-success/20">
                                            <div className="flex items-center gap-2 text-success mb-1">
                                                <CheckCircle size={16} />
                                                <span className="text-xs font-bold uppercase">Firmados</span>
                                            </div>
                                            <p className="text-2xl font-bold text-success">{employee.stats?.signed || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {/* Recent Documents */}
                                    <div className="text-sm">
                                        {employee.stats?.pending === 0 ? (
                                            <div className="flex items-center gap-2 p-3 bg-success/10 rounded-xl border border-success/20">
                                                <CheckCircle size={20} className="text-success shrink-0" />
                                                <p className="text-sm font-medium text-success">Todos los documentos firmados</p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="font-semibold text-text-muted mb-2">Últimos pendientes:</p>
                                                {employee.lastDocuments?.pending?.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {employee.lastDocuments.pending.map(doc => (
                                                            <li key={doc.id} className="text-xs text-text-primary truncate">
                                                                • {formatShortDate(doc.payroll_period_start)} - {formatShortDate(doc.payroll_period_end)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-text-muted/60 italic">No hay pendientes</p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => navigate(`/dashboard/${employee.id}`)}
                                        className="w-full py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors text-sm"
                                    >
                                        Ver Detalle
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {employees.length === 0 && !loading && (
                        <div className="text-center py-12 text-text-muted">
                            <p>No se encontraron empleados.</p>
                        </div>
                    )}
                </div>

                {/* Pagination - Always show if there are employees */}
                {employees.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border-light/50 dark:border-border-light">
                        <p className="text-sm text-text-muted">
                            Mostrando {employees.length} de {pagination.total} empleados
                            {pagination.totalPages > 1 && ` • Página ${pagination.page} de ${pagination.totalPages}`}
                        </p>
                        {pagination.totalPages > 1 && (
                            <SimplePagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
