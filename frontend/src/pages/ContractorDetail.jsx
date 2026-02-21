import { useParams, useNavigate } from 'react-router-dom';
import { 
    User, 
    Mail, 
    FileText, 
    ArrowLeft, 
    Clock, 
    CheckCircle,
    Calendar,
    Hash
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentCard from '../components/DocumentCard';
import { useEmployee } from '../hooks/useEmployees';

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

// Empty State Component
function EmptyDocumentsState({ status }) {
    const isPending = status === 'PENDING';
    
    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className={`p-3 rounded-full mb-3 ${isPending ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                {isPending ? (
                    <Clock size={24} className="text-orange-500" />
                ) : (
                    <CheckCircle size={24} className="text-green-500" />
                )}
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {isPending ? 'No hay documentos pendientes' : 'No hay documentos firmados'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {isPending ? 'Todo está al día' : 'Los documentos aparecerán aquí'}
            </p>
        </div>
    );
}

export default function ContractorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { employee, loading, error } = useEmployee(id);

    // Handle document click - navigate to admin viewer
    const handleDocumentClick = (doc) => {
        navigate(`/documents/admin/${doc.id}`, {
            state: {
                employeeId: id,
                employeeName: employee.name
            }
        });
    };

    if (loading) {
        return (
            <AppLayout title="Detalle Contratista">
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner text="Cargando información..." />
                </div>
            </AppLayout>
        );
    }

    if (error || !employee) {
        return (
            <AppLayout title="Detalle Contratista">
                <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <FileText size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Error al cargar
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {error?.message || 'No se encontró el contratista'}
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        Volver a la lista
                    </button>
                </div>
            </AppLayout>
        );
    }

    const pendingDocs = employee.documents?.pending || [];
    const signedDocs = employee.documents?.signed || [];

    return (
        <AppLayout title="Detalle Contratista">
            <div className="min-h-screen bg-background-light dark:bg-background-dark">
                {/* Header with Back Button */}
                <div className="sticky top-0 z-10 bg-surface dark:bg-surface-alt border-b border-gray-100 dark:border-gray-800">
                    <div className="px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex size-10 items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                {employee.name}
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Contratista
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-4 md:px-6 py-6 flex flex-col gap-6 max-w-4xl mx-auto">
                    
                    {/* Profile Card - Stitch Style */}
                    <div className="bg-surface dark:bg-surface-alt rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {/* Profile Header */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 px-6 py-8 text-center">
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white mx-auto mb-4 backdrop-blur-sm ring-1 ring-white/20">
                                <User size={40} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-bold text-white">{employee.name}</h2>
                            <p className="text-sm text-white/60 mt-1">{employee.position || 'Contratista'}</p>
                        </div>

                        {/* Info Fields */}
                        <div className="p-5 space-y-4">
                            {/* Email */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                    <Mail size={18} className="text-gray-500 dark:text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email</p>
                                    <p className="text-sm text-gray-900 dark:text-white truncate">{employee.email || 'No registrado'}</p>
                                </div>
                            </div>

                            {/* Identification */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                    <Hash size={18} className="text-gray-500 dark:text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Identificación</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {employee.identification_type} {employee.identification_number || 'No registrado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                                <Clock size={18} />
                                <span className="text-xs font-bold uppercase">Pendientes</span>
                            </div>
                            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                {pendingDocs.length}
                            </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800/30">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                                <CheckCircle size={18} />
                                <span className="text-xs font-bold uppercase">Firmados</span>
                            </div>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {signedDocs.length}
                            </p>
                        </div>
                    </div>

                    {/* Pending Documents Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={20} className="text-primary" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Pendientes
                            </h3>
                            <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">
                                {pendingDocs.length} documento{pendingDocs.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            {pendingDocs.length > 0 ? (
                                pendingDocs.map((doc) => (
                                    <DocumentCard
                                        key={doc.id}
                                        title={doc.title || 'Cuenta de cobro'}
                                        subtitle={doc.payroll_period_start && doc.payroll_period_end
                                            ? `${formatDateForDisplay(doc.payroll_period_start)} - ${formatDateForDisplay(doc.payroll_period_end)}`
                                            : 'Sin período'
                                        }
                                        amount={doc.amount}
                                        status="PENDING"
                                        deadline={doc.deadline}
                                        onClick={() => handleDocumentClick(doc)}
                                    />
                                ))
                            ) : (
                                <EmptyDocumentsState status="PENDING" />
                            )}
                        </div>
                    </div>

                    {/* Signed Documents Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle size={20} className="text-green-600" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Documentos Firmados
                            </h3>
                            <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">
                                {signedDocs.length} documento{signedDocs.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            {signedDocs.length > 0 ? (
                                signedDocs.slice(0, 5).map((doc) => (
                                    <DocumentCard
                                        key={doc.id}
                                        title={doc.title || 'Cuenta de cobro'}
                                        subtitle={doc.payroll_period_start && doc.payroll_period_end
                                            ? `${formatDateForDisplay(doc.payroll_period_start)} - ${formatDateForDisplay(doc.payroll_period_end)}`
                                            : 'Sin período'
                                        }
                                        amount={doc.amount}
                                        status="SIGNED"
                                        signedAt={doc.signed_at}
                                        onClick={() => handleDocumentClick(doc)}
                                    />
                                ))
                            ) : (
                                <EmptyDocumentsState status="SIGNED" />
                            )}
                            
                            {signedDocs.length > 5 && (
                                <button className="w-full py-3 text-center text-sm text-primary font-medium hover:underline rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                    Ver historial completo ({signedDocs.length} documentos)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Help Footer */}
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex gap-3">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shrink-0">
                                <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                                    ¿Dudas con los documentos?
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Si encuentras alguna inconsistencia, repórtalo inmediatamente al administrador del sistema.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
