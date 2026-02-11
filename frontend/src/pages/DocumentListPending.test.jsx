import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentListPending from './DocumentListPending';
import { vi } from 'vitest';

// Mock useDocuments with DocumentStatus and complete pagination
// Must return isEmpty: false for documents to render
const mockDocuments = [
    {
        id: '1',
        title: 'Cuenta de cobro',
        subtitle: '16 Oct',
        period: 'Octubre 2023',
        amount: 1500000,
        status: 'PENDING',
        created_at: '2023-10-01',
    },
];

vi.mock('../hooks/useDocuments', () => ({
    useDocuments: vi.fn(() => ({
        documents: mockDocuments,
        loading: false,
        error: null,
        success: true,
        refetch: vi.fn(),
        isEmpty: false, // Must be false for documents to render
        pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            goToPage: vi.fn(),
            nextPage: vi.fn(),
            prevPage: vi.fn(),
            setLimit: vi.fn(),
            resetToFirstPage: vi.fn(),
        },
    })),
    DocumentStatus: {
        PENDING: 'PENDING',
        SIGNED: 'SIGNED',
        INVALIDATED: 'INVALIDATED',
    },
    useDocument: vi.fn(),
    useSignDocument: vi.fn(),
}));

describe('DocumentListPending Page', () => {
    test('renders the page title and documents', () => {
        renderWithTheme(<DocumentListPending />);

        // Use more specific selector to target the h1 header
        expect(screen.getByRole('heading', { level: 1, name: 'Mis Cuentas' })).toBeInTheDocument();
        // Check for document content
        expect(screen.getByText('1 documento')).toBeInTheDocument();
    });

    test('handles search input', () => {
        renderWithTheme(<DocumentListPending />);
        const searchInput = screen.getByPlaceholderText(/Buscar cuenta o fecha/i);

        fireEvent.change(searchInput, { target: { value: '16 Oct' } });
        expect(searchInput.value).toBe('16 Oct');
    });
});
