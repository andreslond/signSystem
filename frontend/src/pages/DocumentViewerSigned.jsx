import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Share2, FileText, Calendar, DollarSign, CheckCircle2, PenTool, AlertCircle, ShieldCheck } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import PDFViewer from '../components/PDFViewer';
import DocumentViewerSkeleton from '../components/DocumentViewerSkeleton';
import { useDocument } from '../hooks/useDocuments';
import { fetchDocumentPdfUrl } from '../lib/apiClient';
import { useState, useEffect } from 'react';

export default function DocumentViewerSigned() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [pdfUrl, setPdfUrl] = useState(null);
    console.log('DocumentViewerSigned mounted with id:', id);
    // Fetch document using useDocument hook
    const { document: doc, loading, error, refetch } = useDocument(id);

    // Fetch PDF URL when document is loaded
    useEffect(() => {
        if (doc?.id) {
            const fetchPdfUrl = async () => {
                try {
                    const response = await fetchDocumentPdfUrl(doc.id);
                    // The response has data.url from the standardized API format
                    const url = response?.data?.url || response?.url;
                    setPdfUrl(url);
                } catch (err) {
                    console.error('Error fetching PDF URL:', err);
                }
            };
            fetchPdfUrl();
        }
    }, [doc?.id]);

    // Loading state
    console.log('Document loading state:', { loading, error, doc });

    if (loading) {
        return <DocumentViewerSkeleton />;
    }

    // Error state
    if (error) {
        return (
            <AppLayout title="Detalle del Documento">
                <div className="px-6 py-6 flex flex-col gap-6">
                    <button
                        onClick={() => navigate('/documents/signed')}
                        className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors py-1"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                        <span className="text-[15px] font-bold">Volver</span>
                    </button>

                    <div className="bg-error/10 dark:bg-error/20 border border-error/20 dark:border-error/30 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertCircle size={24} className="text-error shrink-0" />
                            <h3 className="text-lg font-bold text-error">
                                Error al cargar el documento
                            </h3>
                        </div>
                        <p className="text-sm text-error/80 mb-4">
                            {error.message || 'No se pudo cargar el documento. Por favor, intenta de nuevo.'}
                        </p>
                        <button
                            onClick={refetch}
                            className="px-4 py-2 bg-error text-white text-sm font-medium rounded-xl hover:bg-error/90 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // No document found
    if (!doc) {
        return (
            <AppLayout title="Detalle del Documento">
                <div className="px-6 py-6 flex flex-col gap-6">
                    <button
                        onClick={() => navigate('/documents/signed')}
                        className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors py-1"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                        <span className="text-[15px] font-bold">Volver</span>
                    </button>

                    <div className="bg-surface-alt dark:bg-surface-alt p-8 rounded-2xl text-center">
                        <FileText size={48} strokeWidth={1} className="text-text-muted/40 mx-auto mb-4" />
                        <p className="text-text-secondary">Documento no encontrado</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'No disponible';
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Format amount
    const formatAmount = (amount) => {
        if (!amount) return '0';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return numAmount.toLocaleString();
    };

    // Format signature date
    const formatSignatureDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return `Procesado el ${date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} • ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <AppLayout title="Detalle del Documento">
            <div className="px-6 py-6 flex flex-col gap-6">
                {/* Back & Share Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/documents/signed')}
                        className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors py-1"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                        <span className="text-[15px] font-bold">Volver</span>
                    </button>
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: `Documento #${doc.employee_id || doc.id.slice(0, 8)}`,
                                    text: 'Mira este documento',
                                    url: window.location.href
                                });
                            }
                        }}
                        className="bg-surface dark:bg-surface p-2.5 rounded-xl shadow-card border border-transparent hover:border-border dark:hover:border-border-light transition-all"
                    >
                        <Share2 size={20} className="text-text-primary" />
                    </button>
                </div>

                {/* Main Content Card */}
                <div className="bg-background dark:bg-surface rounded-[24px] shadow-card overflow-hidden border border-transparent dark:border-border transition-colors">
                    {/* Header Info */}
                    <div className="px-6 py-6 border-b border-border-light dark:border-border-light">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-surface dark:bg-surface-alt p-2 rounded-lg text-text-secondary dark:text-text-muted transition-colors">
                                <FileText size={20} />
                            </div>
                            <span className="bg-surface dark:bg-surface-alt text-text-secondary dark:text-text-muted px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors">
                                Firmado
                            </span>
                        </div>
                        <h2 className="text-[22px] font-bold text-text-primary mb-1 leading-tight transition-colors">
                            Documento #{doc.employee_id || doc.id.slice(0, 8)}
                        </h2>
                        <p className="text-[14px] text-text-secondary font-medium transition-colors">
                            {`${formatDate(doc.payroll_period_start)} - ${formatDate(doc.payroll_period_end)}`}
                        </p>
                    </div>

                    {/* Success Message Area */}
                    <div className="px-6 py-4 bg-success-light dark:bg-success/10 border-y border-success/20 dark:border-success/10 flex items-center gap-3 transition-colors">
                        <div className="bg-success dark:bg-success-dark p-1.5 rounded-full text-white transition-colors">
                            <CheckCircle2 size={18} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-success-dark dark:text-success transition-colors">
                                Documento firmado correctamente
                            </p>
                            {doc.signed_at && (
                                <p className="text-[11px] text-success-dark/80 dark:text-success/70 font-medium transition-colors">
                                    {formatSignatureDate(doc.signed_at)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* PDF Preview */}
                    <div className="p-4">
                        {pdfUrl ? (
                            <PDFViewer 
                                url={pdfUrl} 
                                className="max-w-full overflow-x-auto"
                            />
                        ) : (
                            <div className="bg-surface-alt dark:bg-surface-alt rounded-2xl aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-border dark:border-border-light gap-4 transition-colors">
                                <div className="bg-background dark:bg-surface p-4 rounded-full shadow-card transition-colors">
                                    <FileText size={40} strokeWidth={1} className="text-text-muted/40" />
                                </div>
                                <p className="text-[14px] font-medium text-text-muted transition-colors">
                                    Vista previa del documento
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Signature & Seal Section */}
                    <div className="px-6 py-6 bg-surface-alt dark:bg-surface-alt border-t border-border-light dark:border-border-light transition-colors">
                        <div className="flex flex-col gap-5">
                            {doc.signer_name && (
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-[13px] font-bold text-text-secondary uppercase tracking-wider transition-colors">
                                        Firma del Contratista
                                    </h3>
                                    <div className="flex items-center gap-2 text-primary font-bold transition-colors">
                                        <PenTool size={18} />
                                        <span className="text-[15px] italic">
                                            {doc.signer_name} {doc.signer_identification_type && doc.signer_identification ? `(${doc.signer_identification_type} ${doc.signer_identification})` : ''}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {doc.signed_hash && (
                                <div className="flex flex-col gap-2 p-3 bg-background dark:bg-surface rounded-xl border border-border-light dark:border-border-light shadow-card transition-colors">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-text-muted transition-colors">
                                        <ShieldCheck size={14} />
                                        <span>SELLO DIGITAL DE SEGURIDAD</span>
                                    </div>
                                    <p className="text-[10px] text-text-muted font-mono break-all leading-tight transition-colors">
                                        HASH: {doc.signed_hash}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Amount Summary */}
                <div className="px-6 py-5 bg-background dark:bg-surface rounded-[24px] shadow-card border border-transparent dark:border-border flex justify-between items-center transition-colors">
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-text-secondary uppercase transition-colors">Monto Pagado</span>
                        <div className="flex items-center gap-1 text-[20px] font-extrabold text-text-primary transition-colors">
                            <DollarSign size={20} className="text-primary" />
                            <span>{formatAmount(doc.amount)}</span>
                        </div>
                    </div>
                    <div className="bg-surface dark:bg-surface-alt px-3 py-1.5 rounded-xl transition-colors">
                        <span className="text-[12px] font-bold text-text-secondary dark:text-text-secondary">COP</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
