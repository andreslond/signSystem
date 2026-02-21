import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    ChevronLeft, 
    Share2, 
    FileText, 
    User, 
    Calendar, 
    Hash,
    Clock,
    CheckCircle,
    Download
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import PDFViewer, { PDFViewerSkeleton } from '../components/PDFViewer';
import Modal from '../components/Modal';
import { useAdminDocument } from '../hooks/useDocuments';
import { fetchAdminDocumentPdfUrl } from '../lib/apiClient';

// Format date for display (DD/MM/YYYY)
const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Format currency (COP)
const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export default function DocumentViewerAdmin() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get employeeId from navigation state for back navigation
    const employeeId = location.state?.employeeId;
    const employeeName = location.state?.employeeName;
    
    const { document, loading, error } = useAdminDocument(id);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(true);
    const [pdfError, setPdfError] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    // Fetch PDF URL using admin endpoint
    useEffect(() => {
        const fetchPdf = async () => {
            if (!id) return;
            
            setPdfLoading(true);
            setPdfError(null);
            
            try {
                const response = await fetchAdminDocumentPdfUrl(id);
                setPdfUrl(response.data?.url || response.data?.pdfUrl || response.url || response.pdfUrl);
            } catch (err) {
                console.error('Error fetching PDF URL:', err);
                setPdfError(err);
            } finally {
                setPdfLoading(false);
            }
        };

        fetchPdf();
    }, [id]);

    // Handle back navigation - return to contractor detail
    const handleBack = () => {
        if (employeeId) {
            navigate(`/signed-documents/${employeeId}`);
        } else {
            navigate('/signed-documents');
        }
    };

    // Handle share
    const handleShare = async () => {
        if (navigator.share && pdfUrl) {
            try {
                await navigator.share({
                    title: `Documento - ${document?.employee_name || 'Contratista'}`,
                    text: `Cuenta de cobro del período ${formatShortDate(document?.payroll_period_start)} - ${formatShortDate(document?.payroll_period_end)}`,
                    url: pdfUrl
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setShareModalOpen(true);
                }
            }
        } else {
            setShareModalOpen(true);
        }
    };

    // Handle download
    const handleDownload = () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }
    };

    if (loading) {
        return (
            <AppLayout title="Detalle del Documento">
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner text="Cargando documento..." />
                </div>
            </AppLayout>
        );
    }

    if (error || !document) {
        return (
            <AppLayout title="Detalle del Documento">
                <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <FileText size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Error al cargar
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {error?.message || 'No se encontró el documento'}
                    </p>
                    <button
                        onClick={handleBack}
                        className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </AppLayout>
        );
    }

    const isPending = document.status === 'PENDING';

    return (
        <AppLayout title="Detalle del Documento">
            <div className="px-4 md:px-6 py-6 flex flex-col gap-6 max-w-4xl mx-auto">
                
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors py-1"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                        <span className="text-[15px] font-bold">Volver</span>
                    </button>
                    
                    <button
                        onClick={handleShare}
                        className="bg-surface dark:bg-surface p-2.5 rounded-xl shadow-card border border-transparent hover:border-border dark:hover:border-border-light transition-all"
                    >
                        <Share2 size={20} className="text-text-primary" />
                    </button>
                </div>

                {/* Document Info Card */}
                <div className="bg-surface dark:bg-surface-alt rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Status Header */}
                    <div className={`px-6 py-4 ${isPending ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                        <div className="flex items-center gap-3">
                            {isPending ? (
                                <Clock size={24} className="text-orange-500" />
                            ) : (
                                <CheckCircle size={24} className="text-green-500" />
                            )}
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Cuenta de Cobro
                                </h2>
                                <p className={`text-sm font-medium ${isPending ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {isPending ? 'Pendiente de firma' : 'Documento firmado'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Document Details */}
                    <div className="p-5 space-y-4">
                        {/* Employee Name */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                <User size={18} className="text-gray-500 dark:text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Contratista</p>
                                <p className="text-sm text-gray-900 dark:text-white truncate">
                                    {employeeName || document.employee_name || 'No disponible'}
                                </p>
                            </div>
                        </div>

                        {/* Period */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Período</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {formatShortDate(document.payroll_period_start)} - {formatShortDate(document.payroll_period_end)}
                                </p>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                <Hash size={18} className="text-gray-500 dark:text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Monto</p>
                                <p className="text-sm text-gray-900 dark:text-white font-semibold">
                                    {formatCurrency(document.amount)}
                                </p>
                            </div>
                        </div>

                        {/* Signed Date (if signed) */}
                        {!isPending && document.signed_at && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                                <div className="p-2 bg-white dark:bg-green-900/30 rounded-lg shadow-sm">
                                    <CheckCircle size={18} className="text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Firmado el</p>
                                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                        {formatShortDate(document.signed_at)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Deadline (if pending) */}
                        {isPending && document.deadline && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/30">
                                <div className="p-2 bg-white dark:bg-orange-900/30 rounded-lg shadow-sm">
                                    <Clock size={18} className="text-orange-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Fecha límite</p>
                                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                                        {formatShortDate(document.deadline)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="bg-surface dark:bg-surface-alt rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Vista previa del documento</h3>
                        {pdfUrl && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                <Download size={16} />
                                <span>Descargar</span>
                            </button>
                        )}
                    </div>
                    <div className="p-4">
                        {pdfLoading ? (
                            <PDFViewerSkeleton />
                        ) : pdfError ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FileText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No se pudo cargar el documento</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{pdfError.message}</p>
                            </div>
                        ) : pdfUrl ? (
                            <PDFViewer fileUrl={pdfUrl} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FileText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">Documento no disponible</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin Note */}
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800/30">
                    <div className="flex gap-3">
                        <div className="p-2 bg-white dark:bg-blue-900/30 rounded-lg shrink-0">
                            <FileText size={18} className="text-blue-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-blue-700 dark:text-blue-300 mb-1">
                                Vista de administrador
                            </h4>
                            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                Este documento se muestra en modo de solo lectura. Como administrador, puedes ver el estado del documento pero no firmarlo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            <Modal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                title="Compartir documento"
            >
                <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Copia el siguiente enlace para compartir el documento:
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                        <code className="text-xs break-all text-gray-700 dark:text-gray-300">
                            {pdfUrl || 'URL no disponible'}
                        </code>
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(pdfUrl || '');
                            setShareModalOpen(false);
                        }}
                        className="w-full mt-4 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Copiar enlace
                    </button>
                </div>
            </Modal>
        </AppLayout>
    );
}
