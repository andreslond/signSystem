import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentViewerPending from './DocumentViewerPending';
import { Route, Routes } from 'react-router-dom';

// Mock PDFViewer
vi.mock('../components/PDFViewer', () => ({
    default: ({ fileUrl }) => (
        <div data-testid="pdf-viewer">PDF Viewer - {fileUrl}</div>
    ),
    PDFViewerSkeleton: () => <div data-testid="pdf-skeleton">Loading PDF...</div>
}));

// Mock useDocument - must receive documentId parameter
vi.mock('../hooks/useDocuments', () => ({
    useDocument: vi.fn((documentId) => {
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
                employee_name: 'John Doe',
                employee_identification_number: '123456789',
                employee_identification_type: 'CC',
                employee_email: 'john@example.com',
                created_at: '2023-10-01',
                amount: 2500000,
                status: 'PENDING',
            },
            loading: false,
            error: null,
            success: true,
            refetch: vi.fn()
        };
    }),
    useSignDocument: vi.fn(() => ({
        signDocument: vi.fn(() => Promise.resolve()),
        loading: false,
        error: null,
    })),
    useDocuments: vi.fn(),
    DocumentStatus: {
        PENDING: 'PENDING',
        SIGNED: 'SIGNED',
        INVALIDATED: 'INVALIDATED',
    },
}));

// Mock apiClient
vi.mock('../lib/apiClient', () => ({
    fetchDocumentPdfUrl: vi.fn(() => Promise.resolve({ data: { url: 'https://example.com/test.pdf' } })),
    signDocument: vi.fn(() => Promise.resolve({ success: true })),
}));

describe('DocumentViewerPending Page', () => {
    const renderPage = () => {
        return renderWithTheme(
            <Routes>
                <Route path="/documents/pending/:id" element={<DocumentViewerPending />} />
                <Route path="/documents/signed/:id" element={<div data-testid="signed-page">Signed Page</div>} />
            </Routes>,
            { initialEntries: ['/documents/pending/1'] }
        );
    };

    test('renders document details', () => {
        renderPage();
        // The document viewer shows "Cuenta de Cobro" as title
        expect(screen.getByText('Cuenta de Cobro')).toBeInTheDocument();
        // Check for the amount (formatted as 2,500,000)
        expect(screen.getByText('2,500,000')).toBeInTheDocument();
    });

    test('opens confirmation modal when clicking sign button', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Firmar documento/i }));
        expect(screen.getByText('Confirmar firma del documento')).toBeInTheDocument();
    });

    test('handles signature confirmation', async () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Firmar documento/i }));

        const passwordInput = screen.getByLabelText(/Tu contraseña/i);
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Confirmar Firma/i }));

        // Wait for success modal to appear
        await waitFor(() => {
            expect(screen.getByText('Documento firmado exitosamente')).toBeInTheDocument();
        });
    });
});
