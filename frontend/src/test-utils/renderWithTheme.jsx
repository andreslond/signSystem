import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Custom render helper that wraps components in theme-specific containers.
 * @param {React.ReactElement} ui - The component to render.
 * @param {Object} options - Custom options including theme ('light' or 'dark').
 */
export const renderWithTheme = (ui, { theme = 'light', ...renderOptions } = {}) => {
    const Wrapper = ({ children }) => (
        <div className={theme}>
            <div className="bg-background text-text-primary min-h-screen">
                <MemoryRouter>
                    {children}
                </MemoryRouter>
            </div>
        </div>
    );

    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from RTL
export * from '@testing-library/react';
