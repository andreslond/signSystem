import React, { useState } from 'react';
import Layout from '../components/Layout';
import DocumentCard from '../components/DocumentCard';
import { Button } from '../components/ui/Button';

// Dummy data
const DOCUMENTS = [
    { id: '1', title: 'Cuenta de cobro', subtitle: '15 - 30 Enero 2026', status: 'pending', date: '30 Ene 2026' },
    { id: '2', title: 'Cuenta de cobro', subtitle: '01 - 15 Enero 2026', status: 'pending', date: '15 Ene 2026' },
    { id: '3', title: 'Acuerdo de Servicios', subtitle: 'Proyecto CrewOps 2026', status: 'pending', date: '01 Ene 2026' },
    { id: '4', title: 'Cuenta de cobro', subtitle: 'Periodo: 16 Oct - 31 Oct 2023', status: 'signed', date: '31 Oct 2023', month: 'Octubre 2023' },
    { id: '5', title: 'Cuenta de cobro', subtitle: 'Periodo: 01 Oct - 15 Oct 2023', status: 'signed', date: '15 Oct 2023', month: 'Octubre 2023' },
    { id: '6', title: 'Cuenta de cobro', subtitle: 'Periodo: 16 Sep - 30 Sep 2023', status: 'signed', date: '30 Sep 2023', month: 'Septiembre 2023' },
    { id: '7', title: 'Ajuste de Tarifa', subtitle: 'Septiembre 2023', status: 'signed', date: '01 Sep 2023', month: 'Septiembre 2023' },
];

export default function DocumentList() {
    const [activeTab, setActiveTab] = useState('pending');

    const pendingDocs = DOCUMENTS.filter(d => d.status === 'pending');
    const signedDocs = DOCUMENTS.filter(d => d.status === 'signed');

    // Group signed docs by month
    const signedDocsByMonth = signedDocs.reduce((acc, doc) => {
        const month = doc.month || 'Otros';
        if (!acc[month]) acc[month] = [];
        acc[month].push(doc);
        return acc;
    }, {});

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mis Documentos</h1>
                        <p className="text-gray-500">Gestiona tus cuentas de cobro y contratos</p>
                    </div>

                    <div className="flex p-1 bg-gray-100 rounded-lg self-start sm:self-auto">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pending'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Pendientes
                        </button>
                        <button
                            onClick={() => setActiveTab('signed')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'signed'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Firmados
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {activeTab === 'pending' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            {pendingDocs.length > 0 ? (
                                pendingDocs.map(doc => (
                                    <DocumentCard key={doc.id} doc={doc} />
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">No tienes documentos pendientes.</p>
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-8">
                                <h4 className="text-sm font-semibold text-blue-800 mb-1">¿Dudas con tu pago?</h4>
                                <p className="text-sm text-blue-600">
                                    Si el monto de la cuenta de cobro no coincide, repórtalo inmediatamente al administrador.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'signed' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            {Object.entries(signedDocsByMonth).map(([month, docs]) => (
                                <div key={month} className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-800 pl-1">{month}</h3>
                                    <div className="space-y-3">
                                        {docs.map(doc => (
                                            <DocumentCard key={doc.id} doc={doc} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {signedDocs.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">No tienes documentos firmados.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
