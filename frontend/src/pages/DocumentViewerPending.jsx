import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Share2, FileText, Calendar, DollarSign, ShieldAlert, ArrowDown, AlertCircle, CheckCircle, Loader2, User, IdCard } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import AppLayout from '../components/AppLayout';
import PDFViewer from '../components/PDFViewer';
import DocumentViewerSkeleton from '../components/DocumentViewerSkeleton';
import { useDocument } from '../hooks/useDocuments';
import { fetchDocumentPdfUrl, signDocument } from '../lib/apiClient';

export default function DocumentViewerPending() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const [showScrollIndicator, setShowScrollIndicator] = useState(true);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [signingLoading, setSigningLoading] = useState(false);
    const [signingError, setSigningError] = useState(null);

    // Fetch document using useDocument hook
    const { document: doc, loading, error, refetch } = useDocument(id);

    // Fetch PDF URL only once when document is loaded
    useEffect(() => {
        if (!doc?.id || pdfUrl) return; // Skip if no doc id or already have URL
        
        const fetchPdfUrl = async () => {
            try {
                const response = await fetchDocumentPdfUrl(doc.id);
                const url = response?.data?.url || response?.url;
                if (url) {
                    setPdfUrl(url);
                }
            } catch (err) {
                console.error('Error fetching PDF URL:', err);
            }
        };
        
        fetchPdfUrl();
    }, [doc?.id, pdfUrl]);

    // Scroll indicator logic
    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const shouldShow = currentScrollY < 100;

            if (shouldShow !== showScrollIndicator) {
                setShowScrollIndicator(shouldShow);
            }

            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, [showScrollIndicator]);

    const handleSign = () => {
        setShowModal(true);
    };

    const handleConfirmSign = async (e) => {
        e.preventDefault();
        setSigningLoading(true);
        setSigningError(null);

        try {
            await signDocument(
                id,
                password,
                doc.signer_name || doc.employee_name,
                doc.signer_identification_number || doc.employee_identification_number
            );

            // Close confirmation modal and show success modal
            setShowModal(false);
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Error signing document:', err);
            setSigningError(err.message || 'Error al firmar el documento. Verifica tu contraseña.');
        } finally {
            setSigningLoading(false);
        }
    };

    const handleSuccessModalClose = useCallback(() => {
        setShowSuccessModal(false);
        // Navigate to pending documents list with refresh parameter
        navigate('/documents/pending?refresh=true', { replace: true });
    }, [navigate]);

    // Loading state
    if (loading) {
        return <DocumentViewerSkeleton />;
    }

    // Error state
    if (error) {
        return (
            <AppLayout title="Detalle del Documento">
                <div className="px-6 py-6 flex flex-col gap-6">
                    {/* Back Action */}
                    <button
                        onClick={() => navigate('/documents/pending')}
                        className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors py-1"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                        <span className="text-[15px] font-bold">Volver</span>
                    </button>

                    {/* Error message */}
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
                        <Button onClick={refetch} variant="secondary">
                            Reintentar
                        </Button>
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
                        onClick={() => navigate('/documents/pending')}
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

    // Format date for long display
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
        if (!amount) return null;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `${numAmount.toLocaleString()}`;
    };

    return (
        <AppLayout title="Detalle del Documento">
            <div className="px-6 py-6 flex flex-col gap-6">
                {/* Back & Share Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/documents/pending')}
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
                            <div className="bg-warning/10 dark:bg-warning/20 p-2 rounded-lg transition-colors">
                                <FileText size={20} className="text-warning-dark dark:text-warning" />
                            </div>
                            <span className="bg-warning/10 dark:bg-warning/20 text-warning-dark dark:text-warning px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors">
                                Pendiente
                            </span>
                        </div>
                        <h2 className="text-[22px] font-bold text-text-primary mb-1 leading-tight transition-colors">
                            Cuenta de Cobro
                        </h2>
                        <p className="text-[14px] text-text-secondary font-medium transition-colors">
                            {doc.payroll_period_start && doc.payroll_period_end 
                                ? `${formatDateForDisplay(doc.payroll_period_start)} - ${formatDateForDisplay(doc.payroll_period_end)}`
                                : `${doc.employee_identification_number ? `${doc.employee_identification_type || 'CC'}: ${doc.employee_identification_number}` : ''}`}
                        </p>
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

                    {/* Metadata Section */}
                    <div className="px-6 py-4 bg-surface-alt dark:bg-surface-alt flex flex-col gap-4 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-text-secondary transition-colors">
                                <Calendar size={18} strokeWidth={2} />
                                <span className="text-[14px] font-medium">Fecha de expedición</span>
                            </div>
                            <span className="text-[14px] font-bold text-text-primary transition-colors">
                                {formatDate(doc.created_at || doc.date)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-text-secondary transition-colors">
                                <DollarSign size={18} strokeWidth={2} />
                                <span className="text-[14px] font-medium">Monto total</span>
                            </div>
                            <span className="text-[16px] font-extrabold text-primary">
                                {formatAmount(doc.amount)}
                            </span>
                        </div>

                        {/* Sign Button - Below Total Amount */}
                        <div className="mt-4">
                            <Button
                                onClick={handleSign}
                                className="w-full"
                            >
                                Firmar documento
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Warning Footer */}
                <div className="flex gap-3 px-1">
                    <ShieldAlert size={18} className="text-text-muted mt-0.5 shrink-0 transition-colors" />
                    <p className="text-[12px] text-text-muted leading-relaxed transition-colors">
                        Al firmar este documento, certificas la veracidad de la información y la conformidad con los servicios prestados.
                    </p>
                </div>


                {/* Scroll Indicator - Guides user to Sign Button */}
                {showScrollIndicator && (
                    <div
                        className="fixed bottom-24 left-0 right-0 px-6 max-w-[440px] mx-auto z-10 animate-bounce"
                        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                    >
                        <div className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                            <span>Firmar documento</span>
                            <ArrowDown size={16} />
                        </div>
                    </div>
                )}
            </div>

            {/* Signature Confirmation Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    if (!signingLoading) {
                        setShowModal(false);
                        setPassword('');
                        setSigningError(null);
                    }
                }}
                variant="drawer"
            >
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="bg-warning/10 dark:bg-warning/20 p-4 rounded-full mb-2 transition-colors">
                            <ShieldAlert size={32} className="text-warning-dark dark:text-warning" />
                        </div>
                        <h2 className="text-[22px] font-bold text-text-primary leading-tight transition-colors">
                            Confirmar firma del documento
                        </h2>
                        <p className="text-[14px] text-text-secondary font-medium transition-colors">
                            Al firmar, confirmas la validez de la información.
                        </p>
                    </div>

                    <form onSubmit={handleConfirmSign} className="flex flex-col gap-6">
                        {/* Employee Information - Read Only */}
                        <div className="bg-surface-alt dark:bg-surface-alt p-4 rounded-2xl border border-border dark:border-border-light">
                            <div className="flex items-center gap-3 mb-3">
                                <User size={18} className="text-primary" />
                                <span className="text-sm font-medium text-text-secondary">Información del Empleado</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-text-muted flex items-center gap-1">
                                        <User size={12} className="text-text-muted" />
                                        Nombre completo
                                    </span>
                                    <span className="text-sm font-medium text-text-primary">{doc.employee_name || 'No disponible'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-text-muted flex items-center gap-1">
                                        <IdCard size={12} className="text-text-muted" />
                                        Número de identificación
                                    </span>
                                    <span className="text-sm font-medium text-text-primary">
                                        {doc.employee_identification_number ? `${doc.employee_identification_type || 'CC'} ${doc.employee_identification_number}` : 'No disponible'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-alt dark:bg-surface-alt p-4 rounded-2xl border border-border dark:border-border-light flex items-start gap-3 transition-colors">
                            <div className="text-text-secondary dark:text-text-muted mt-0.5 transition-colors">
                                <ShieldAlert size={18} />
                            </div>
                            <p className="text-[12px] text-text-secondary dark:text-text-secondary leading-relaxed transition-colors">
                                Ingresa tu contraseña para verificar tu identidad y completar el proceso de firma digital segura.
                            </p>
                        </div>

                        {signingError && (
                            <div className="bg-error/10 dark:bg-error/20 border border-error/30 p-4 rounded-2xl">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
                                    <p className="text-sm text-error">{signingError}</p>
                                </div>
                            </div>
                        )}

                        <Input
                            label="Tu contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={signingLoading}
                        />

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={signingLoading || !password}
                            >
                                {signingLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={18} className="animate-spin" />
                                        Firmando documento...
                                    </span>
                                ) : (
                                    'Confirmar Firma'
                                )}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowModal(false);
                                    setPassword('');
                                    setSigningError(null);
                                }}
                                className="w-full !border-none !bg-transparent text-text-muted hover:text-text-primary transition-colors"
                                type="button"
                                disabled={signingLoading}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={handleSuccessModalClose}
                variant="drawer"
            >
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="bg-success/10 dark:bg-success/20 p-4 rounded-full mb-2 transition-colors">
                            <CheckCircle size={32} className="text-success-dark dark:text-success" />
                        </div>
                        <h2 className="text-[22px] font-bold text-text-primary leading-tight transition-colors">
                            Documento firmado exitosamente
                        </h2>
                        <p className="text-[14px] text-text-secondary font-medium transition-colors">
                            Tu documento ha sido firmado y ahora estará disponible en la lista de documentos firmados.
                        </p>
                    </div>

                    <div className="bg-surface-alt dark:bg-surface-alt p-4 rounded-2xl border border-border dark:border-border-light flex items-start gap-3 transition-colors">
                        <CheckCircle size={18} className="text-success shrink-0 mt-0.5" />
                        <p className="text-[12px] text-text-secondary dark:text-text-secondary leading-relaxed transition-colors">
                            La firma digital ha sido agregada al documento con marca de tiempo y información de autenticidad.
                        </p>
                    </div>

                    <Button
                        onClick={handleSuccessModalClose}
                        className="w-full"
                    >
                        Ver mis documentos
                    </Button>
                </div>
            </Modal>
        </AppLayout>
    );
}
