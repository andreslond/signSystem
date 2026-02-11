import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import Button from './Button';
import { Search } from 'lucide-react';

describe('Button Component', () => {
    test('renders correctly with children', () => {
        renderWithTheme(<Button>Click Me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
    });

    test('handles click events', () => {
        const handleClick = vi.fn();
        renderWithTheme(<Button onClick={handleClick}>Click Me</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('renders an icon when provided', () => {
        renderWithTheme(<Button icon={Search}>Search</Button>);
        // Lucide icons render as svg
        expect(document.querySelector('svg')).toBeInTheDocument();
    });

    test('applies custom className', () => {
        renderWithTheme(<Button className="custom-class">Custom</Button>);
        expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    test('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<Button variant="primary">Snapshot</Button>);
        expect(asFragment()).toMatchSnapshot();
    });
});
