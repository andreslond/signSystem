import React from 'react';
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

beforeEach(() => {
    useAuth.mockReturnValue({
        session: null,
        loading: false,
    });
});

describe('Login Page', () => {
    test('renders correctly with structural elements', () => {
        renderWithTheme(<Login />);

        expect(screen.getByText('CrewOps')).toBeInTheDocument();
        expect(screen.getByText('Bienvenido')).toBeInTheDocument();
        expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
    });

    test('toggles password visibility', () => {
        renderWithTheme(<Login />);
        const passwordInput = screen.getByLabelText(/Contraseña/i);
        const toggleButton = screen.getByTestId('input-right-icon');

        expect(passwordInput).toHaveAttribute('type', 'password');
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<Login />);
        expect(asFragment()).toMatchSnapshot();
    });
});
