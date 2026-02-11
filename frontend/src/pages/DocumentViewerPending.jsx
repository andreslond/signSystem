import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Share2, FileText, Calendar, DollarSign, ShieldAlert, ArrowDown } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import AppLayout from '../components/AppLayout';

export default function DocumentViewerPending() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const [showScrollIndicator, setShowScrollIndicator] = useState(true);

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Hide indicator when user has scrolled down (any positive scroll)
            // Show it again only if user scrolls back to top
            const shouldShow = currentScrollY < 100;

            // Only update if changed to avoid unnecessary re-renders
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

    const handleConfirmSign = (e) => {
        e.preventDefault();
        navigate(`/documents/signed/${id}`);
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
                    <button className="bg-white dark:bg-surface p-2.5 rounded-xl shadow-sm border border-transparent hover:border-border dark:hover:border-border-light transition-all">
                        <Share2 size={20} className="text-text-primary" />
                    </button>
                </div>

                {/* Main Content Card */}
                <div className="bg-white dark:bg-surface rounded-[24px] shadow-sm overflow-hidden border border-transparent dark:border-border transition-colors">
                    {/* Header Info */}
                    <div className="px-6 py-6 border-b border-[#f5f5f5] dark:border-border-light">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-[#fff9eb] dark:bg-[#451a03]/30 p-2 rounded-lg transition-colors">
                                <FileText size={20} className="text-[#b54708] dark:text-[#fbbf24]" />
                            </div>
                            <span className="bg-[#fffaeb] dark:bg-[#451a03]/30 text-[#b54708] dark:text-[#fbbf24] px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors">
                                Pendiente
                            </span>
                        </div>
                        <h2 className="text-[22px] font-bold text-text-primary mb-1 leading-tight transition-colors">
                            Cuenta de cobro - Octubre 2023
                        </h2>
                        <p className="text-[14px] text-text-secondary font-medium transition-colors">
                            Periodo: 16 Oct-31 Oct 2023
                        </p>
                    </div>

                    {/* Preview Placeholder */}
                    <div className="p-4">
                        <div className="bg-[#f9fafb] dark:bg-surface-alt rounded-2xl aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-[#eaecf0] dark:border-border-light gap-4 transition-colors">
                            <div className="bg-white dark:bg-surface p-4 rounded-full shadow-sm transition-colors">
                                <FileText size={40} strokeWidth={1} className="text-text-muted/40" />
                            </div>
                            <p className="text-[14px] font-medium text-text-muted transition-colors">
                                Vista previa del documento
                            </p>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="px-6 py-4 bg-[#fcfcfc] dark:bg-surface-alt flex flex-col gap-4 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-text-secondary transition-colors">
                                <Calendar size={18} strokeWidth={2} />
                                <span className="text-[14px] font-medium">Fecha de expedición</span>
                            </div>
                            <span className="text-[14px] font-bold text-text-primary transition-colors">02 Nov 2023</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-text-secondary transition-colors">
                                <DollarSign size={18} strokeWidth={2} />
                                <span className="text-[14px] font-medium">Monto total</span>
                            </div>
                            <span className="text-[16px] font-extrabold text-primary">$2,500,000</span>
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
                onClose={() => setShowModal(false)}
                variant="drawer"
            >
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="bg-[#fff9eb] dark:bg-[#451a03]/30 p-4 rounded-full mb-2 transition-colors">
                            <ShieldAlert size={32} className="text-[#b54708] dark:text-[#fbbf24]" />
                        </div>
                        <h2 className="text-[22px] font-bold text-text-primary leading-tight transition-colors">
                            Confirmar firma del documento
                        </h2>
                        <p className="text-[14px] text-text-secondary font-medium transition-colors">
                            Al firmar, confirmas la validez de la información.
                        </p>
                    </div>

                    <form onSubmit={handleConfirmSign} className="flex flex-col gap-6">
                        <div className="bg-[#f9fafb] dark:bg-surface-alt p-4 rounded-2xl border border-[#eaecf0] dark:border-border-light flex items-start gap-3 transition-colors">
                            <div className="text-[#667085] dark:text-[#94a3b8] mt-0.5 transition-colors">
                                <ShieldAlert size={18} />
                            </div>
                            <p className="text-[12px] text-[#475467] dark:text-text-secondary leading-relaxed transition-colors">
                                Ingresa tu contraseña para verificar tu identidad y completar el proceso de firma digital segura.
                            </p>
                        </div>

                        <Input
                            label="Tu contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                type="submit"
                                className="w-full"
                            >
                                Confirmar Firma
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowModal(false)}
                                className="w-full !border-none !bg-transparent text-text-muted hover:text-text-primary transition-colors"
                                type="button"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AppLayout>
    );
}
