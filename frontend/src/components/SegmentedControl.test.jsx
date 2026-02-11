import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import SegmentedControl from './SegmentedControl';
import { Search, History } from 'lucide-react';

describe('SegmentedControl Component', () => {
    const options = [
        { id: 'opt1', label: 'Option 1', icon: Search },
        { id: 'opt2', label: 'Option 2', icon: History },
    ];

    it('renders all options', () => {
        renderWithTheme(<SegmentedControl options={options} value="opt1" onChange={() => { }} />);
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('handles onChange events', () => {
        const handleChange = vi.fn();
        renderWithTheme(<SegmentedControl options={options} value="opt1" onChange={handleChange} />);

        fireEvent.click(screen.getByText('Option 2'));
        expect(handleChange).toHaveBeenCalledWith('opt2');
    });

    it('highlights the active option', () => {
        renderWithTheme(<SegmentedControl options={options} value="opt2" onChange={() => { }} />);
        const activeOption = screen.getByText('Option 2').closest('button');
        expect(activeOption).toHaveClass('bg-background'); // or dark:bg-surface
    });

    it('validates design tokens', () => {
        renderWithTheme(<SegmentedControl options={options} value="opt1" onChange={() => { }} />);
        const container = screen.getByText('Option 1').closest('div');
        expect(container).toHaveValidDesignTokens();
    });

    it('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<SegmentedControl options={options} value="opt1" onChange={() => { }} />);
        expect(asFragment()).toMatchSnapshot();
    });
});
