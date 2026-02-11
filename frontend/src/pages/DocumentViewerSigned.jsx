import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Share2, FileText, Calendar, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';
import AppLayout from '../components/AppLayout';

export default function DocumentViewerSigned() {
    const navigate = useNavigate();
    const { id } = useParams();

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
                    <button className="bg-white dark:bg-surface p-2.5 rounded-xl shadow-sm border border-transparent hover:border-border dark:hover:border-border-light transition-all">
                        <Share2 size={20} className="text-text-primary" />
                    </button>
                </div>

                {/* Main Content Card */}
                <div className="bg-white dark:bg-surface rounded-[24px] shadow-sm overflow-hidden border border-transparent dark:border-border transition-colors">
                    {/* Header Info */}
                    <div className="px-6 py-6 border-b border-[#f5f5f5] dark:border-border-light">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-[#f2f4f7] dark:bg-[#1e293b] p-2 rounded-lg text-[#475467] dark:text-[#94a3b8] transition-colors">
                                <FileText size={20} />
                            </div>
                            <span className="bg-[#f2f4f7] dark:bg-[#1e293b] text-[#475467] dark:text-[#94a3b8] px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors">
                                Firmado
                            </span>
                        </div>
                        <h2 className="text-[22px] font-bold text-text-primary mb-1 leading-tight transition-colors">
                            Cuenta de cobro - Septiembre 2023
                        </h2>
                        <p className="text-[14px] text-text-secondary font-medium transition-colors">
                            Periodo: 16 Sep-30 Sep 2023
                        </p>
                    </div>

                    {/* Success Message Area */}
                    <div className="px-6 py-4 bg-[#f6fef9] dark:bg-[#052e16]/30 border-y border-[#d1fadf]/50 dark:border-[#d1fadf]/10 flex items-center gap-3 transition-colors">
                        <div className="bg-[#d1fadf] dark:bg-[#052e16] p-1.5 rounded-full text-[#039855] dark:text-[#4ade80] transition-colors">
                            <CheckCircle2 size={18} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-[#027a48] dark:text-[#4ade80] transition-colors">
                                Documento firmado correctamente
                            </p>
                            <p className="text-[11px] text-[#027a48]/80 dark:text-[#4ade80]/70 font-medium transition-colors">
                                Procesado el 05 Oct 2023 • 09:42 AM
                            </p>
                        </div>
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

                    {/* Signature & Seal Section */}
                    <div className="px-6 py-6 bg-[#fcfcfc] dark:bg-surface-alt border-t border-[#f5f5f5] dark:border-border-light transition-colors">
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-[13px] font-bold text-text-secondary uppercase tracking-wider transition-colors">
                                    Firma del Contratista
                                </h3>
                                <div className="flex items-center gap-2 text-primary font-bold transition-colors">
                                    <ShieldCheck size={18} />
                                    <span className="text-[15px] italic">JUAN PABLO RODRIGUEZ</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 p-3 bg-white dark:bg-surface rounded-xl border border-[#f0f0f0] dark:border-border-light shadow-sm transition-colors">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-text-muted transition-colors">
                                    <ShieldCheck size={14} />
                                    <span>SELLO DIGITAL DE SEGURIDAD</span>
                                </div>
                                <p className="text-[10px] text-text-muted font-mono break-all leading-tight transition-colors">
                                    HASH: 8f2d9a3b1e7c4f5a6b0d9e8f7a6c5b4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9b8a
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Amount Summary */}
                <div className="px-6 py-5 bg-white dark:bg-surface rounded-[24px] shadow-sm border border-transparent dark:border-border flex justify-between items-center transition-colors">
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-text-secondary uppercase transition-colors">Monto Pagado</span>
                        <div className="flex items-center gap-1 text-[20px] font-extrabold text-text-primary transition-colors">
                            <DollarSign size={20} className="text-primary" />
                            <span>2,500,000</span>
                        </div>
                    </div>
                    <div className="bg-[#f2f4f7] dark:bg-surface-alt px-3 py-1.5 rounded-xl transition-colors">
                        <span className="text-[12px] font-bold text-[#475467] dark:text-text-secondary">COP</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
