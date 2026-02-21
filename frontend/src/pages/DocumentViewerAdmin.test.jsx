import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentViewerAdmin from './DocumentViewerAdmin';
import { Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

// Mock PDFViewer
vi.mock('../components/PDFViewer', () => ({
    default: ({ fileUrl }) => (
        <div data-testid="pdf-viewer">PDF Viewer - {fileUrl}</div>
    ),
    PDFViewerSkeleton: () => <div data-testid="pdf-skeleton">Loading PDF...</div>
}));

// Mock useAdminDocument
vi.mock('../hooks/useDocuments', () => ({
    useAdminDocument: vi.fn((documentId) => {
        if (!documentId) {
            return {
                document: null,
                loading: false,
                error: { message: 'Document ID is required' },
                success: false,
                refetch: vi.fn()
            };
        }
        return {
            document: {
                id: documentId,
                employee_name: 'JUAN PABLO RODRIGUEZ',
                employee_identification_number: '123456789',
                employee_identification_type: 'CC',
                employee_email: 'juan@example.com',
                signer_name: 'JUAN PABLO RODRIGUEZ',
                signer_identification_number: '123456789',
                signer_identification_type: 'CC',
                created_at: '2023-09-01',
                payroll_period_start: '2023-09-01',
                payroll_period_end: '2023-09-30',
                amount: 1850000,
                status: 'PENDING',
                deadline: '2023-10-15',
            },
            loading: false,
            error: null,
            success: true,
            refetch: vi.fn()
        };
    }),
    useDocuments: vi.fn(),
    useDocument: vi.fn(),
    DocumentStatus: {
        PENDING: 'PENDING',
        SIGNED: 'SIGNED',
        INVALIDATED: 'INVALIDATED',
    },
}));

// Mock apiClient
vi.mock('../lib/apiClient', () => ({
    fetchAdminDocumentPdfUrl: vi.fn(() => 
        Promise.resolve({ data: { pdfUrl: 'https://example.com/doc.pdf' } })
    ),
}));

// Mock window.navigator.share
const mockShare = vi.fn();
Object.defineProperty(window.navigator, 'share', {
    value: mockShare,
    writable: true,
});

// Mock window.navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn(),
    },
});

describe('DocumentViewerAdmin Page', () => {
    const renderPage = (initialEntries = ['/documents/admin/1']) => {
        return renderWithTheme(
            <Routes>
                <Route path="/documents/admin/:id" element={<DocumentViewerAdmin />} />
                <Route path="/signed-documents/:id" element={<div>Contractor Detail</div>} />
                <Route path="/signed-documents" element={<div>Dashboard</div>} />
            </Routes>,
            { initialEntries }
        );
    };

    test('renders pending document details', async () => {
        renderPage();
        
        expect(screen.getByText('Cuenta de Cobro')).toBeInTheDocument();
        expect(screen.getByText('Pendiente de firma')).toBeInTheDocument();
        expect(screen.getByText('JUAN PABLO RODRIGUEZ')).toBeInTheDocument();
    });

    test('shows deadline label for pending documents', () => {
        renderPage();
        expect(screen.getByText('Fecha límite')).toBeInTheDocument();
    });

    test('shows period label', () => {
        renderPage();
        expect(screen.getByText('Período')).toBeInTheDocument();
    });

    test('shows amount label', () => {
        renderPage();
        expect(screen.getByText('Monto')).toBeInTheDocument();
    });

    test('shows admin note about read-only mode', () => {
        renderPage();
        expect(screen.getByText('Vista de administrador')).toBeInTheDocument();
        expect(screen.getByText(/modo de solo lectura/)).toBeInTheDocument();
    });

    test('does not show sign button', () => {
        renderPage();
        expect(screen.queryByText('Firmar documento')).not.toBeInTheDocument();
    });

    test('shows back button', () => {
        renderPage();
        expect(screen.getByText('Volver')).toBeInTheDocument();
    });

    test('shows PDF viewer after loading', async () => {
        renderPage();
        
        await waitFor(() => {
            expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
        });
    });
});
