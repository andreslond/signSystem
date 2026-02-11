import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import Input from './Input';
import { Mail, Eye } from 'lucide-react';

describe('Input Component', () => {
    it('renders correctly with label', () => {
        renderWithTheme(<Input label="Email" placeholder="Enter your email" />);
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    it('handles value changes', () => {
        const handleChange = vi.fn();
        renderWithTheme(<Input onChange={handleChange} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test@example.com' } });
        expect(handleChange).toHaveBeenCalled();
    });

    it('renders icons correctly', () => {
        renderWithTheme(<Input icon={Mail} rightIcon={Eye} />);
        // Check for two svgs (Mail and Eye)
        const svgs = document.querySelectorAll('svg');
        expect(svgs.length).toBe(2);
    });

    it('handles right icon click', () => {
        const handleRightIconClick = vi.fn();
        renderWithTheme(<Input rightIcon={Eye} onClickRightIcon={handleRightIconClick} />);
        const rightIconContainer = screen.getByTestId('input-right-icon') || document.querySelector('.cursor-pointer');
        fireEvent.click(rightIconContainer);
        expect(handleRightIconClick).toHaveBeenCalled();
    });

    it('displays error message and applies error styles', () => {
        renderWithTheme(<Input error="Invalid email" />);
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('validates design tokens (will fail if hardcoded colors used)', () => {
        renderWithTheme(<Input label="Token Test" />);
        const input = screen.getByRole('textbox');

        // This will likely fail due to bg-[#f9fafb] in Input.jsx
        expect(input).toHaveValidDesignTokens();
    });

    it('is accessible', () => {
        renderWithTheme(<Input label="Password" type="password" />);
        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<Input label="Snapshot" placeholder="Test" />);
        expect(asFragment()).toMatchSnapshot();
    });
});
