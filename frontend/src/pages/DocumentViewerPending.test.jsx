import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentViewerPending from './DocumentViewerPending';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock the AppLayout
vi.mock('../components/AppLayout', () => ({
    default: ({ children, title }) => (
        <div data-testid="app-layout">
            <h1>{title}</h1>
            {children}
        </div>
    )
}));

describe('DocumentViewerPending Page', () => {
    const renderPage = () => {
        return renderWithTheme(
            <MemoryRouter initialEntries={['/documents/pending/1']}>
                <Routes>
                    <Route path="/documents/pending/:id" element={<DocumentViewerPending />} />
                    <Route path="/documents/signed/:id" element={<div>Signed Page</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders document details', () => {
        renderPage();
        expect(screen.getByText('Cuenta de cobro - Octubre 2023')).toBeInTheDocument();
        expect(screen.getByText('$2,500,000')).toBeInTheDocument();
    });

    it('opens confirmation modal when clicking sign button', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Firmar documento/i }));
        expect(screen.getByText('Confirmar firma del documento')).toBeInTheDocument();
    });

    it('handles signature confirmation', async () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Firmar documento/i }));

        const passwordInput = screen.getByLabelText(/Tu contraseña/i);
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Confirmar Firma/i }));

        await waitFor(() => {
            expect(screen.getByText('Signed Page')).toBeInTheDocument();
        });
    });

    it('validates design tokens in major blocks', () => {
        renderPage();
        const mainCard = screen.getByText('Cuenta de cobro - Octubre 2023').closest('div').parentElement;
        expect(mainCard).toHaveValidDesignTokens();
    });

    it('matches snapshot', () => {
        const { asFragment } = renderPage();
        expect(asFragment()).toMatchSnapshot();
    });
});
