import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import AppLayout from './AppLayout';

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('AppLayout Component', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
    });

    test('renders with title and children', () => {
        renderWithTheme(
            <AppLayout title="Dashboard">
                <div data-testid="child">Content</div>
            </AppLayout>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    test('toggles the sidebar menu', () => {
        renderWithTheme(<AppLayout title="Test" />);
        const menuButton = screen.getByRole('button', { name: /Toggle menu/i });
        const sidebar = screen.getByRole('complementary', { hidden: true });

        // Initially closed (translated -full)
        expect(sidebar).toHaveClass('-translate-x-full');

        fireEvent.click(menuButton);
        expect(sidebar).toHaveClass('translate-x-0');

        fireEvent.click(screen.getByRole('button', { name: /Close menu/i }));
        expect(sidebar).toHaveClass('-translate-x-full');
    });

    test('toggles dark mode', async () => {
        renderWithTheme(<AppLayout title="Test" />);

        // Open menu first
        fireEvent.click(screen.getAllByRole('button')[0]);

        const themeToggle = screen.getByText(/Modo/i).closest('button');

        // Initial state
        expect(document.documentElement.classList.contains('dark')).toBe(false);

        // Toggle to dark
        fireEvent.click(themeToggle);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorage.getItem('theme')).toBe('dark');

        // Toggle back to light
        fireEvent.click(themeToggle);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorage.getItem('theme')).toBe('light');
    });

    test('matches snapshot', () => {
        const { asFragment } = renderWithTheme(
            <AppLayout title="Snapshot">
                <div>Content</div>
            </AppLayout>
        );
        expect(asFragment()).toMatchSnapshot();
    });
});
