import { useEffect, useState } from 'react';
import { FileText, AlertCircle, FileUp, ExternalLink } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set PDF.js worker from CDN for better compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

/**
 * PDFViewer Component
 * Displays a PDF document with react-pdf and native fallback
 * 
 * @param {string} url - The URL of the PDF to display
 * @param {Function} onLoadSuccess - Callback when PDF loads successfully
 * @param {Function} onLoadError - Callback when PDF fails to load
 * @param {string} className - Additional CSS classes
 */
export default function PDFViewer({ 
    url, 
    onLoadSuccess,
    onLoadError,
    className = '',
    ...props 
}) {
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [useNative, setUseNative] = useState(false);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setLoading(false);
        if (onLoadSuccess) {
            onLoadSuccess({ numPages });
        }
    }

    function onDocumentLoadError(error) {
        // Fallback to native browser PDF viewer
        console.warn('react-pdf failed, falling back to native viewer:', error);
        setUseNative(true);
        setLoading(false);
    }

    // If using native fallback and URL is available
    if (useNative && url) {
        return (
            <div className={`flex flex-col items-center gap-4 ${className}`}>
                <div className="w-full max-w-[400px] aspect-[3/4] border-2 border-dashed border-border dark:border-border-light rounded-lg overflow-hidden">
                    <iframe
                        src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full"
                        title="Documento PDF"
                        style={{ border: 'none' }}
                    />
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    <ExternalLink size={16} />
                    Abrir en nueva pestaña
                </a>
            </div>
        );
    }

    if (!url) {
        return (
            <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
                <div className="bg-surface-alt dark:bg-surface-alt p-4 rounded-full mb-4">
                    <FileUp size={48} strokeWidth={1} className="text-text-muted/40" />
                </div>
                <p className="text-sm text-text-muted">
                    No hay documento disponible
                </p>
            </div>
        );
    }

    if (error && !useNative) {
        return (
            <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
                <div className="bg-error/10 dark:bg-error/20 p-4 rounded-full mb-4">
                    <AlertCircle size={48} strokeWidth={1} className="text-error" />
                </div>
                <p className="text-sm font-medium text-error mb-2">
                    Error al cargar el documento
                </p>
                <p className="text-xs text-text-muted">
                    {error}
                </p>
                <button
                    onClick={() => {
                        setError(null);
                        setUseNative(true);
                    }}
                    className="mt-4 px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    Intentar con visor nativo
                </button>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center gap-4 ${className}`}>
            <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="bg-surface-alt dark:bg-surface-alt p-4 rounded-full mb-4">
                            <FileText size={40} strokeWidth={1} className="text-text-muted/40 animate-pulse" />
                        </div>
                        <p className="text-sm text-text-muted animate-pulse">
                            Cargando documento...
                        </p>
                    </div>
                }
                error={
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="bg-error/10 dark:bg-error/20 p-4 rounded-full mb-4">
                            <AlertCircle size={40} strokeWidth={1} className="text-error" />
                        </div>
                        <p className="text-sm font-medium text-error">
                            Error al cargar el documento
                        </p>
                        <button
                            onClick={() => {
                                setUseNative(true);
                            }}
                            className="mt-4 px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                            Usar visor nativo
                        </button>
                    </div>
                }
                {...props}
            >
                {loading && !numPages ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="bg-surface-alt dark:bg-surface-alt p-4 rounded-full mb-4">
                            <FileText size={40} strokeWidth={1} className="text-text-muted/40 animate-pulse" />
                        </div>
                        <p className="text-sm text-text-muted animate-pulse">
                            Cargando documento...
                        </p>
                    </div>
                ) : (
                    Array.from(new Array(numPages), (el, index) => (
                        <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            width={350}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="mb-4 shadow-lg rounded-lg overflow-hidden bg-white"
                        />
                    ))
                )}
            </Document>
        </div>
    );
}

/**
 * PDFViewerSkeleton - Loading skeleton for PDF viewer
 */
export function PDFViewerSkeleton({ className = '' }) {
    return (
        <div className={`flex flex-col items-center gap-4 ${className}`}>
            {[1, 2, 3].map((page) => (
                <div
                    key={page}
                    className="w-[350px] h-[495px] bg-surface-alt dark:bg-surface rounded-lg animate-pulse"
                />
            ))}
        </div>
    );
}

/**
 * NativePDFLink - Fallback component for downloading/opening PDF
 * Useful when react-pdf fails or for mobile browsers
 */
export function NativePDFLink({ url, label = 'Ver documento', className = '' }) {
    if (!url) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
                flex items-center gap-2
                px-4 py-2
                bg-primary text-white
                rounded-xl font-medium text-sm
                hover:bg-primary/90
                transition-all duration-200
                ${className}
            `}
        >
            <ExternalLink size={16} />
            {label}
        </a>
    );
}
