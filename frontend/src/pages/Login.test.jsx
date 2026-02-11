import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import Login from './Login';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', async () => {
    const actual = await vi.importActual('../context/AuthContext');
    return {
        ...actual,
        useAuth: vi.fn(),
    };
});

describe('Login Page', () => {
    beforeEach(() => {
        useAuth.mockReturnValue({
            session: null,
            loading: false,
        });
    });
    it('renders correctly with structural elements', () => {
        renderWithTheme(<Login />);

        expect(screen.getByText('CrewOps')).toBeInTheDocument();
        expect(screen.getByText('Bienvenido')).toBeInTheDocument();
        expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
    });

    it('toggles password visibility', () => {
        renderWithTheme(<Login />);
        const passwordInput = screen.getByLabelText(/Contraseña/i);
        const toggleButton = screen.getByTestId('input-right-icon');

        expect(passwordInput).toHaveAttribute('type', 'password');
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('validates design tokens in core layout containers', () => {
        renderWithTheme(<Login />);
        // The main container should use semantic tokens
        const loginCard = screen.getByText('Bienvenido').closest('div');

        // This will fail if bg-white is used instead of a token
        expect(loginCard).toHaveValidDesignTokens();
    });

    it('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<Login />);
        expect(asFragment()).toMatchSnapshot();
    });
});
