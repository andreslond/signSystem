import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, History, Clock, AlertCircle, WifiOff } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import AppLayout from '../components/AppLayout';
import SegmentedControl from '../components/SegmentedControl';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState, { EmptyPendingState } from '../components/EmptyState';
import Pagination, { SimplePagination } from '../components/Pagination';
import { useDocuments, DocumentStatus } from '../hooks/useDocuments';

// Format date for display (DD/MM/YYYY)
const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export default function DocumentListPending() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');

    const statusOptions = [
        { id: 'pending', label: 'Pendientes', icon: Clock },
        { id: 'signed', label: 'Firmados', icon: History },
    ];

    // Use the useDocuments hook with PENDING status
    const { 
        documents, 
        loading, 
        error, 
        refetch, 
        isEmpty,
        pagination,
    } = useDocuments({ 
        status: DocumentStatus.PENDING,
    });

    // Handle refresh parameter from navigation after signing
    useEffect(() => {
        if (searchParams.get('refresh') === 'true') {
            refetch();
            // Remove the refresh parameter from URL
            navigate('/documents/pending', { replace: true });
        }
    }, [searchParams, refetch, navigate]);

    // Transform API documents to card format
    const transformDocument = (doc) => ({
        id: doc.id,
        title: 'Cuenta de Cobro',
        subtitle: doc.payroll_period_start && doc.payroll_period_end
            ? `${formatDateForDisplay(doc.payroll_period_start)} - ${formatDateForDisplay(doc.payroll_period_end)}`
            : doc.subtitle || doc.description || 'Sin período',
        amount: doc.amount ? `${Number(doc.amount).toLocaleString()}` : null,
        type: doc.type || 'receipt',
        status: doc.status,
        document: doc,
    });

    const handleRetry = () => {
        refetch();
    };

    const handlePageChange = (newPage) => {
        pagination.goToPage(newPage);
    };

    // Check if error is a network error
    const isNetworkError = error?.isNetworkError;
    const isAuthError = error?.isAuthError;

    // Network error state - don't redirect, show friendly message
    if (error && isNetworkError) {
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
                            className="w-full pl-12 pr-4 py-3.5 bg-surface dark:bg-surface-alt rounded-2xl text-[15px] text-text-primary placeholder:text-text-muted/60 shadow-sm border border-transparent dark:border-border-light focus:border-primary/20 focus:outline-none transition-all"
                        />
                    </div>

                    {/* Network Error State - Non-blocking */}
                    <div 
                        className="bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning/40 p-6 rounded-2xl"
                        role="alert"
                    >
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="bg-warning/20 dark:bg-warning/30 p-4 rounded-full">
                                <WifiOff size={32} className="text-warning" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-warning mb-2">
                                    Sin conexión a internet
                                </h3>
                                <p className="text-sm text-warning/80 mb-4">
                                    {error.message || 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.'}
                                </p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="px-6 py-2.5 bg-warning text-white font-medium rounded-xl hover:bg-warning/90 transition-colors shadow-md"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>

                    {/* Info Footer */}
                    <div className="mt-4 bg-warning/10 dark:bg-warning/10 border border-warning/20 dark:border-warning/30 p-4 rounded-2xl relative overflow-hidden transition-colors">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" />
                        <p className="text-[14px] font-bold text-warning mb-1 transition-colors">
                            ¿Dudas con tu pago?
                        </p>
                        <p className="text-[13px] text-warning/80 leading-relaxed transition-colors">
                            Si el monto no coincide, repórtalo inmediatamente al administrador.
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Auth error (401) - will be handled by redirect in apiClient
    if (error && isAuthError) {
        return (
            <AppLayout title="Mis Cuentas">
                <div className="px-6 py-6 flex flex-col gap-6">
                    <div className="flex flex-col items-center justify-center py-16">
                        <LoadingSpinner text="Redirigiendo..." />
                    </div>
                </div>
            </AppLayout>
        );
    }

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
                        className="w-full pl-12 pr-4 py-3.5 bg-surface dark:bg-surface-alt rounded-2xl text-[15px] text-text-primary placeholder:text-text-muted/60 shadow-sm border border-transparent dark:border-border-light focus:border-primary/20 focus:outline-none transition-all"
                    />
                </div>

                {/* Error State (non-network errors) */}
                {error && !isNetworkError && (
                    <div 
                        className="bg-error/10 dark:bg-error/20 border border-error/20 dark:border-error/30 p-4 rounded-2xl"
                        role="alert"
                    >
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} className="text-error shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-error">
                                    Error del servidor
                                </p>
                                <p className="text-xs text-error/80 mt-1">
                                    {error.message || 'Por favor, intenta de nuevo'}
                                </p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="px-3 py-1.5 bg-error text-white text-xs font-medium rounded-lg hover:bg-error/90 transition-colors"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <LoadingSpinner text="Cargando documentos..." />
                )}

                {/* Empty State */}
                {!loading && isEmpty && !error && (
                    <EmptyPendingState onRetry={handleRetry} />
                )}

                {/* Documents List */}
                {!loading && !isEmpty && !error && documents.length > 0 && (
                    <>
                        <div className="flex flex-col gap-4">
                            <h2 className="text-[13px] font-bold text-text-muted uppercase tracking-wider px-1 transition-colors">
                                {pagination.total} documento{pagination.total !== 1 ? 's' : ''}
                            </h2>
                            <div className="flex flex-col gap-4">
                                {documents.map((doc) => {
                                    const cardData = transformDocument(doc);
                                    return (
                                        <DocumentCard
                                            key={cardData.id}
                                            title={cardData.title}
                                            subtitle={cardData.subtitle}
                                            amount={cardData.amount}
                                            status={cardData.status}
                                            type={cardData.type}
                                            onClick={() => navigate(`/documents/pending/${cardData.id}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <SimplePagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                                loading={loading}
                            />
                        )}
                    </>
                )}

                {/* Info Footer */}
                <div className="mt-4 bg-warning/10 dark:bg-warning/10 border border-warning/20 dark:border-warning/30 p-4 rounded-2xl relative overflow-hidden transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" />
                    <p className="text-[14px] font-bold text-warning mb-1 transition-colors">
                        ¿Dudas con tu pago?
                    </p>
                    <p className="text-[13px] text-warning/80 leading-relaxed transition-colors">
                        Si el monto no coincide, repórtalo inmediatamente al administrador.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
