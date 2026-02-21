import React from 'react';
import { screen, fireEvent, render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AccountsSigningDashboard from './AccountsSigningDashboard';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('../hooks/useEmployees', () => ({
    useEmployees: vi.fn(() => ({
        employees: [
            {
                id: 1,
                name: 'John Doe',
                identification_type: 'CC',
                identification_number: '123456',
                stats: { pending: 2, signed: 5 },
                lastDocuments: { pending: [], signed: [] }
            }
        ],
        loading: false,
        error: null,
        pagination: {
            page: 1,
            totalPages: 1,
            goToPage: vi.fn(),
        },
        setSearch: vi.fn(),
    })),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        signOut: vi.fn(),
    })),
}));

// Helper to render with router
const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('AccountsSigningDashboard Page', () => {
    test('renders employee list', () => {
        renderWithRouter(<AccountsSigningDashboard />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('CC 123456')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Pending count
        expect(screen.getByText('5')).toBeInTheDocument(); // Signed count
    });

    test('handles search input', () => {
        renderWithRouter(<AccountsSigningDashboard />);
        const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
        fireEvent.change(searchInput, { target: { value: 'John' } });
        expect(searchInput.value).toBe('John');
    });
});
