import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentListSigned from './DocumentListSigned';

// Mock the AppLayout
vi.mock('../components/AppLayout', () => ({
    default: ({ children, title }) => (
        <div data-testid="app-layout">
            <h1>{title}</h1>
            {children}
        </div>
    )
}));

describe('DocumentListSigned Page', () => {
    it('renders the page title and grouped documents', () => {
        renderWithTheme(<DocumentListSigned />);

        expect(screen.getByText('Mis Cuentas')).toBeInTheDocument();
        expect(screen.getByText('Octubre 2023')).toBeInTheDocument();
        expect(screen.getByText('Septiembre 2023')).toBeInTheDocument();
        expect(screen.getAllByText('Cuenta de cobro').length).toBeGreaterThan(0);
    });

    it('handles search input', () => {
        renderWithTheme(<DocumentListSigned />);
        const searchInput = screen.getByPlaceholderText(/Buscar cuenta o fecha/i);

        fireEvent.change(searchInput, { target: { value: 'Ajuste' } });
        expect(searchInput.value).toBe('Ajuste');
    });

    it('validates design tokens', () => {
        renderWithTheme(<DocumentListSigned />);

        const searchInput = screen.getByPlaceholderText(/Buscar cuenta o fecha/i);
        expect(searchInput).toHaveValidDesignTokens();

        const monthHeading = screen.getByText('Octubre 2023');
        expect(monthHeading).toHaveClass('text-text-muted');
    });

    it('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<DocumentListSigned />);
        expect(asFragment()).toMatchSnapshot();
    });
});
