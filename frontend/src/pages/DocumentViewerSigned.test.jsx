import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentViewerSigned from './DocumentViewerSigned';
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

describe('DocumentViewerSigned Page', () => {
    const renderPage = () => {
        return renderWithTheme(
            <MemoryRouter initialEntries={['/documents/signed/1']}>
                <Routes>
                    <Route path="/documents/signed/:id" element={<DocumentViewerSigned />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders signed document details', () => {
        renderPage();
        expect(screen.getByText('Cuenta de cobro - Septiembre 2023')).toBeInTheDocument();
        expect(screen.getByText('Documento firmado correctamente')).toBeInTheDocument();
        expect(screen.getByText('JUAN PABLO RODRIGUEZ')).toBeInTheDocument();
    });

    it('validates design tokens in major blocks', () => {
        renderPage();
        const successBlock = screen.getByText('Documento firmado correctamente').closest('div').parentElement;
        expect(successBlock).toHaveValidDesignTokens();

        const amountSummary = screen.getByText('Monto Pagado').closest('div').parentElement;
        expect(amountSummary).toHaveValidDesignTokens();
    });

    it('matches snapshot', () => {
        const { asFragment } = renderPage();
        expect(asFragment()).toMatchSnapshot();
    });
});
