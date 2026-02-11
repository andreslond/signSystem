import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import Input from './Input';
import { Mail, Eye } from 'lucide-react';

describe('Input Component', () => {
    test('renders correctly with label', () => {
        renderWithTheme(<Input label="Email" placeholder="Enter your email" />);
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('handles value changes', () => {
        const handleChange = vi.fn();
        renderWithTheme(<Input onChange={handleChange} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test@example.com' } });
        expect(handleChange).toHaveBeenCalled();
    });

    test('renders icons correctly', () => {
        renderWithTheme(<Input icon={Mail} rightIcon={Eye} />);
        // Check for two svgs (Mail and Eye)
        const svgs = document.querySelectorAll('svg');
        expect(svgs.length).toBe(2);
    });

    test('displays error message', () => {
        renderWithTheme(<Input error="Invalid email" />);
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    test('is accessible', () => {
        renderWithTheme(<Input label="Password" type="password" />);
        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    test('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<Input label="Snapshot" placeholder="Test" />);
        expect(asFragment()).toMatchSnapshot();
    });
});
