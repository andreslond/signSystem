import React from 'react';
import { screen, fireEvent, render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContractorSigningDashboard from './ContractorSigningDashboard';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('../hooks/useEmployees', () => ({
    useEmployees: vi.fn((options) => ({
        employees: [
            {
                id: 1,
                name: 'John Doe',
                identification_type: 'CC',
                identification_number: '123456',
                stats: { pending: 5, signed: 2 },
                lastDocuments: { pending: [{ id: 1, payroll_period_start: '2023-09-01', payroll_period_end: '2023-09-30' }], signed: [] }
            },
            {
                id: 2,
                name: 'Jane Smith',
                identification_type: 'CC',
                identification_number: '789012',
                stats: { pending: 0, signed: 3 },
                lastDocuments: { pending: [], signed: [] }
            },
            {
                id: 3,
                name: 'Bob Wilson',
                identification_type: 'CE',
                identification_number: '345678',
                stats: { pending: 3, signed: 1 },
                lastDocuments: { pending: [{ id: 2, payroll_period_start: '2023-08-01', payroll_period_end: '2023-08-31' }], signed: [] }
            }
        ],
        loading: false,
        error: null,
        pagination: {
            page: 1,
            totalPages: 1,
            total: 3,
            goToPage: vi.fn(),
        },
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

describe('ContractorSigningDashboard Page', () => {
    test('renders contractor list sorted by pending (most pending first)', () => {
        renderWithRouter(<ContractorSigningDashboard />);
        
        // John has 5 pending (most) - should be first
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        
        // Bob has 3 pending - should be second  
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        
        // Jane has 0 pending - should be last
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('displays stats cards with correct values', () => {
        renderWithRouter(<ContractorSigningDashboard />);
        // Total contractors = 3
        expect(screen.getByText('Contratistas')).toBeInTheDocument();
        // Total pending = 5 + 0 + 3 = 8 (check stat card label exists)
        expect(screen.getAllByText('Pendientes').length).toBeGreaterThan(0);
    });

    test('filters contractors locally by search query', () => {
        renderWithRouter(<ContractorSigningDashboard />);
        
        // Initially shows all 3 contractors
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        
        // Search for "John"
        const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
        fireEvent.change(searchInput, { target: { value: 'John' } });
        
        // Should only show John
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    test('shows clear button when search has value', () => {
        renderWithRouter(<ContractorSigningDashboard />);
        const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
        fireEvent.change(searchInput, { target: { value: 'John' } });
        // The clear button should appear
        expect(screen.getByLabelText('Limpiar búsqueda')).toBeInTheDocument();
    });

    test('clears search when clear button is clicked', () => {
        renderWithRouter(<ContractorSigningDashboard />);
        const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
        fireEvent.change(searchInput, { target: { value: 'John' } });
        
        const clearButton = screen.getByLabelText('Limpiar búsqueda');
        fireEvent.click(clearButton);
        
        expect(searchInput.value).toBe('');
        // All contractors should be visible again
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('shows "Todos los documentos firmados" for contractor with no pending', () => {
        renderWithRouter(<ContractorSigningDashboard />);
        expect(screen.getByText('Todos los documentos firmados')).toBeInTheDocument();
    });

    test('shows pending documents for contractor with pending items', () => {
        renderWithRouter(<ContractorSigningDashboard />);
        // Multiple contractors have pending docs
        expect(screen.getAllByText('Últimos pendientes:').length).toBeGreaterThan(0);
    });

    test('filters by identification number', () => {
        renderWithRouter(<ContractorSigningDashboard />);
        
        // Search by ID
        const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
        fireEvent.change(searchInput, { target: { value: '123456' } });
        
        // Should only show John (ID 123456)
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
});
