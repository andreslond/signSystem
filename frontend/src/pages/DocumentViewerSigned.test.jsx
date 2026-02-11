import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentViewerSigned from './DocumentViewerSigned';
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
                employee_name: 'JUAN PABLO RODRIGUEZ',
                employee_identification_number: '123456789',
                employee_identification_type: 'CC',
                employee_email: 'juan@example.com',
                signer_name: 'JUAN PABLO RODRIGUEZ',
                signer_identification_number: '123456789',
                signer_identification_type: 'CC',
                created_at: '2023-09-01',
                signed_at: '2023-09-20T10:00:00Z',
                amount: 1850000.50,
                status: 'SIGNED',
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

describe('DocumentViewerSigned Page', () => {
    const renderPage = () => {
        return renderWithTheme(
            <Routes>
                <Route path="/documents/signed/:id" element={<DocumentViewerSigned />} />
            </Routes>,
            { initialEntries: ['/documents/signed/1'] }
        );
    };

    test('renders signed document details', () => {
        renderPage();
        expect(screen.getByText('JUAN PABLO RODRIGUEZ')).toBeInTheDocument();
        expect(screen.getByText('Documento firmado correctamente')).toBeInTheDocument();
    });
});
