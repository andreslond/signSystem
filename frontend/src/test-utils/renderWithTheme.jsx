import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

/**
 * Custom render helper that wraps components in theme-specific containers.
 * @param {React.ReactElement} ui - The component to render.
 * @param {Object} options - Custom options including theme ('light' or 'dark') and initialEntries for router.
 */
export const renderWithTheme = (ui, { theme = 'light', initialEntries, ...renderOptions } = {}) => {
    const Wrapper = ({ children }) => (
        <div className={theme}>
            <div className="bg-background text-text-primary min-h-screen">
                <AuthProvider>
                    <MemoryRouter initialEntries={initialEntries}>
                        {children}
                    </MemoryRouter>
                </AuthProvider>
            </div>
        </div>
    );

    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from RTL
export * from '@testing-library/react';
