import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentListSigned from './DocumentListSigned';
import { vi } from 'vitest';

// Mock useDocuments with complete pagination
// Documents are grouped by month using created_at
const mockDocuments = [
    {
        id: '1',
        title: 'Cuenta de cobro',
        subtitle: '16 Oct',
        period: 'Octubre 2023',
        amount: 1500000,
        status: 'SIGNED',
        created_at: '2023-10-01',
    },
    {
        id: '2',
        title: 'Cuenta de cobro',
        subtitle: '16 Sep',
        period: 'Septiembre 2023',
        amount: 1850000.50,
        status: 'SIGNED',
        created_at: '2023-09-01',
    },
];

vi.mock('../hooks/useDocuments', () => ({
    useDocuments: vi.fn(() => ({
        documents: mockDocuments,
        loading: false,
        error: null,
        success: true,
        refetch: vi.fn(),
        isEmpty: false,
        pagination: {
            page: 1,
            limit: 10,
            total: 2,
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

describe('DocumentListSigned Page', () => {
    test('renders the page title', () => {
        renderWithTheme(<DocumentListSigned />);

        // Check the page title
        expect(screen.getByRole('heading', { level: 1, name: 'Mis Cuentas' })).toBeInTheDocument();
    });

    test('handles search input', () => {
        renderWithTheme(<DocumentListSigned />);
        const searchInput = screen.getByPlaceholderText(/Buscar cuenta o fecha/i);

        fireEvent.change(searchInput, { target: { value: 'test' } });
        expect(searchInput.value).toBe('test');
    });
});
