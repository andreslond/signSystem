import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import Button from './Button';
import { Search } from 'lucide-react';

describe('Button Component', () => {
    it('renders correctly with children', () => {
        renderWithTheme(<Button>Click Me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        renderWithTheme(<Button onClick={handleClick}>Click Me</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders with different variants', () => {
        const { rerender } = renderWithTheme(<Button variant="primary">Primary</Button>);
        let button = screen.getByRole('button');
        expect(button).toHaveClass('bg-primary');
        expect(button).toHaveValidDesignTokens();

        rerender(<Button variant="secondary">Secondary</Button>);
        button = screen.getByRole('button');
        expect(button).toHaveClass('border-border');
        expect(button).toHaveValidDesignTokens();

        rerender(<Button variant="text">Text</Button>);
        button = screen.getByRole('button');
        expect(button).toHaveClass('text-primary');
        expect(button).toHaveValidDesignTokens();
    });

    it('renders an icon when provided', () => {
        renderWithTheme(<Button icon={Search}>Search</Button>);
        // Lucide icons render as svg
        expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        renderWithTheme(<Button className="custom-class">Custom</Button>);
        expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('is accessible (has correct type)', () => {
        const { rerender } = renderWithTheme(<Button type="submit">Submit</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');

        rerender(<Button type="button">Button</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('fails if invalid design tokens are used', () => {
        // This test expects the matcher to work
        const { rerender } = renderWithTheme(<Button className="text-red-500">Invalid</Button>);
        const button = screen.getByRole('button');

        // We expect this to fail our custom matcher assertion
        // In a real test, we want this to pass because we ARE checking it
        expect(() => expect(button).toHaveValidDesignTokens()).toThrow();
    });

    it('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<Button variant="primary">Snapshot</Button>);
        expect(asFragment()).toMatchSnapshot();
    });
});
