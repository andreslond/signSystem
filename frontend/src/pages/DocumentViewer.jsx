import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import SignatureModal from '../components/SignatureModal';
import { ChevronLeft, FileText, CheckCircle, ShieldCheck, Download } from 'lucide-react';
import { cn } from '../utils/cn';

// Dummy data (same as list but simulated fetch)
const DOCUMENTS = [
    { id: '1', title: 'Cuenta de cobro', subtitle: '15 - 30 Enero 2026', status: 'pending', date: '30 Ene 2026', content: 'Detalle de servicios prestados...' },
    { id: '2', title: 'Cuenta de cobro', subtitle: '01 - 15 Enero 2026', status: 'pending', date: '15 Ene 2026', content: 'Detalle de servicios prestados...' },
    { id: '3', title: 'Acuerdo de Servicios', subtitle: 'Proyecto CrewOps 2026', status: 'pending', date: '01 Ene 2026', content: 'Acuerdo legal...' },
    { id: '4', title: 'Cuenta de cobro', subtitle: 'Periodo: 16 Oct - 31 Oct 2023', status: 'signed', date: '31 Oct 2023', month: 'Octubre 2023' },
    { id: '5', title: 'Cuenta de cobro', subtitle: 'Periodo: 01 Oct - 15 Oct 2023', status: 'signed', date: '15 Oct 2023', month: 'Octubre 2023' },
    { id: '6', title: 'Cuenta de cobro', subtitle: 'Periodo: 16 Sep - 30 Sep 2023', status: 'signed', date: '30 Sep 2023', month: 'Septiembre 2023' },
    { id: '7', title: 'Ajuste de Tarifa', subtitle: 'Septiembre 2023', status: 'signed', date: '01 Sep 2023', month: 'Septiembre 2023' },
];

export default function DocumentViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doc, setDoc] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSigned, setIsSigned] = useState(false); // Local state to simulate signing

    useEffect(() => {
        // Simulate fetch
        const foundDoc = DOCUMENTS.find(d => d.id === id);
        if (foundDoc) {
            setDoc(foundDoc);
            setIsSigned(foundDoc.status === 'signed');
        }
    }, [id]);

    if (!doc) return <Layout><div className="p-8 text-center text-gray-500">Cargando documento...</div></Layout>;

    const handleSignConfirm = () => {
        setIsSigned(true);
        setIsModalOpen(false);
        // In a real app, we would update the backend here
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                <button
                    onClick={() => navigate('/documents')}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Volver a Mis Documentos
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
                                {isSigned && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Firmado
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500">{doc.subtitle}</p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="secondary" size="sm" className="hidden sm:flex" title="Descargar PDF">
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                            </Button>
                            {!isSigned && (
                                <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-indigo-500/20">
                                    Firmar Documento
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-8 min-h-[600px] flex justify-center">
                        {/* Simulated PDF Viewer */}
                        <div className="bg-white shadow-lg w-full max-w-2xl min-h-[800px] p-12 flex flex-col">
                            <div className="mb-8 border-b-2 border-gray-100 pb-4">
                                <h2 className="text-3xl font-serif text-gray-800 mb-2">CrewOps</h2>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Documento Oficial</p>
                            </div>

                            <div className="space-y-6 font-serif text-gray-700 leading-relaxed flex-1">
                                <p className="text-lg font-bold">{doc.title}</p>
                                <p>Fecha: {doc.date}</p>
                                <p>
                                    Por medio del presente documento, se certifica la relación contractual y los servicios prestados durante el periodo mencionado.
                                </p>
                                <p className="text-justify">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                                </p>

                                <div className="my-8 bg-gray-50 p-6 border border-gray-100 rounded-lg">
                                    <h3 className="font-sans font-bold text-sm text-gray-900 mb-4 uppercase">Detalle de Conceptos</h3>
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                                        <span>Servicios Profesionales</span>
                                        <span>$ 2,500.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                                        <span>Bonificación</span>
                                        <span>$ 250.00</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-base py-3">
                                        <span>Total a Pagar</span>
                                        <span>$ 2,750.00</span>
                                    </div>
                                </div>

                                <p className="text-justify text-sm">
                                    Al firmar este documento, el contratista acepta los términos y condiciones estipulados y confirma la recepción de los servicios descritos.
                                </p>
                            </div>

                            <div className="mt-16 pt-8 border-t border-gray-200">
                                {isSigned ? (
                                    <div className="flex flex-col items-center justify-center text-green-600 bg-green-50 p-6 rounded-xl border border-green-100">
                                        <ShieldCheck className="h-12 w-12 mb-2" />
                                        <p className="font-bold text-lg">Documento Firmado Digitalmente</p>
                                        <p className="text-sm">Válido legalmente • Sellado por CrewOps</p>
                                        <p className="text-xs text-green-500 mt-2">Firma del Contratista: John Doe • {new Date().toLocaleDateString()}</p>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                        <div className="h-16 w-48 border-b border-gray-400 mb-2"></div>
                                        <p className="text-sm font-medium">Espacio para firma del contratista</p>
                                        <Button variant="ghost" size="sm" className="mt-4 text-indigo-600" onClick={() => setIsModalOpen(true)}>
                                            Firmar ahora
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SignatureModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSignConfirm}
                docTitle={doc.title}
            />
        </Layout>
    );
}
