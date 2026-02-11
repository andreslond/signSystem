import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentListPending from './DocumentListPending';

// Mock the AppLayout since it might contain complex logic or context
vi.mock('../components/AppLayout', () => ({
    default: ({ children, title }) => (
        <div data-testid="app-layout">
            <h1>{title}</h1>
            {children}
        </div>
    )
}));

describe('DocumentListPending Page', () => {
    it('renders the page title and documents', () => {
        renderWithTheme(<DocumentListPending />);

        expect(screen.getByText('Mis Cuentas')).toBeInTheDocument();
        expect(screen.getByText('Octubre 2023')).toBeInTheDocument();
        expect(screen.getAllByText('Cuenta de cobro').length).toBeGreaterThan(0);
    });

    it('handles search input', () => {
        renderWithTheme(<DocumentListPending />);
        const searchInput = screen.getByPlaceholderText(/Buscar cuenta o fecha/i);

        fireEvent.change(searchInput, { target: { value: '16 Oct' } });
        expect(searchInput.value).toBe('16 Oct');
    });

    it('validates design tokens in major blocks', () => {
        renderWithTheme(<DocumentListPending />);

        // Check the search bar
        const searchInput = screen.getByPlaceholderText(/Buscar cuenta o fecha/i);
        expect(searchInput).toHaveValidDesignTokens();

        // Check the warning footer
        const warningFooter = screen.getByText('¿Dudas con tu pago?').closest('div');
        expect(warningFooter).toHaveValidDesignTokens();
    });

    it('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<DocumentListPending />);
        expect(asFragment()).toMatchSnapshot();
    });
});
