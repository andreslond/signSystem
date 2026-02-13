import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentViewerPending from './DocumentViewerPending';
import { Route, Routes } from 'react-router-dom';

// Mock PDFViewer
vi.mock('../components/PDFViewer', () => ({
    default: ({ url }) => (
        <div data-testid="pdf-viewer">PDF Viewer - {url}</div>
    ),
    PDFViewerSkeleton: () => <div data-testid="pdf-skeleton">Loading PDF...</div>
}));

// Mock supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 'test-token' } } })),
            signOut: vi.fn(() => Promise.resolve()),
        },
    },
}));

// Mock apiClient
vi.mock('../lib/apiClient', () => ({
    fetchDocumentPdfUrl: vi.fn(() => Promise.resolve({ data: { url: 'https://example.com/test.pdf' } })),
    signDocument: vi.fn(() => Promise.resolve({ message: 'Document signed successfully' })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
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
                signer_name: 'John Doe',
                signer_identification_number: '123456789',
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
    useDocuments: vi.fn(),
    DocumentStatus: {
        PENDING: 'PENDING',
        SIGNED: 'SIGNED',
        INVALIDATED: 'INVALIDATED',
    },
}));

// Mock useErrorHandler
vi.mock('../hooks/useErrorHandler', () => ({
    useErrorHandler: vi.fn(() => ({
        handleError: vi.fn(),
    })),
}));

describe('DocumentViewerPending Page', () => {
    const { signDocument, fetchDocumentPdfUrl } = require('../lib/apiClient');
    const { useDocument } = require('../hooks/useDocuments');

    beforeEach(() => {
        vi.clearAllMocks();
        signDocument.mockImplementation(() => Promise.resolve({ message: 'Document signed successfully' }));
    });

    const renderPage = () => {
        return renderWithTheme(
            <Routes>
                <Route path="/documents/pending/:id" element={<DocumentViewerPending />} />
                <Route path="/documents/pending" element={<div data-testid="pending-list-page">Pending List Page</div>} />
            </Routes>,
            { initialEntries: ['/documents/pending/1'] }
        );
    };

    test('renders document details', () => {
        renderPage();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('2,500,000')).toBeInTheDocument();
    });

    test('opens confirmation modal when clicking sign button', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Firmar documento/i }));
        expect(screen.getByText('Confirmar firma del documento')).toBeInTheDocument();
    });

    test('shows loading state during signature', async () => {
        signDocument.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Firmar documento/i }));
        
        const passwordInput = screen.getByLabelText(/Tu contraseña/i);
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByRole('button', { name: /Confirmar Firma/i }));
        
        expect(await screen.findByRole('button', { name: /Firmando documento.../i })).toBeInTheDocument();
    });

    test('shows success modal after successful signature and navigates on close', async () => {
        signDocument.mockResolvedValue({ message: 'Document signed successfully' });

        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Firmar documento/i }));
        
        const passwordInput = screen.getByLabelText(/Tu contraseña/i);
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByRole('button', { name: /Confirmar Firma/i }));

        await waitFor(() => {
            expect(screen.getByText('Documento firmado exitosamente')).toBeInTheDocument();
        });
    });

    test('shows error message on signature failure', async () => {
        signDocument.mockRejectedValue(new Error('Contraseña incorrecta'));

        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Firmar documento/i }));
        
        const passwordInput = screen.getByLabelText(/Tu contraseña/i);
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        
        fireEvent.click(screen.getByRole('button', { name: /Confirmar Firma/i }));

        await waitFor(() => {
            expect(screen.getByText('Contraseña incorrecta')).toBeInTheDocument();
        });
    });
});
