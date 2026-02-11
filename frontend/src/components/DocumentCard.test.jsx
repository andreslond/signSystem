import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentCard from './DocumentCard';

describe('DocumentCard Component', () => {
    const props = {
        title: 'Work Authorization',
        subtitle: 'Valid until Dec 2023',
        amount: '$1,200',
        status: 'pending',
        onClick: vi.fn(),
    };

    it('renders document information correctly', () => {
        renderWithTheme(<DocumentCard {...props} />);
        expect(screen.getByText(props.title)).toBeInTheDocument();
        expect(screen.getByText(props.subtitle)).toBeInTheDocument();
        expect(screen.getByText(props.amount)).toBeInTheDocument();
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('handles click events', () => {
        renderWithTheme(<DocumentCard {...props} />);
        fireEvent.click(screen.getByText(props.title).closest('div').parentElement);
        expect(props.onClick).toHaveBeenCalled();
    });

    it('displays different status labels', () => {
        const { rerender } = renderWithTheme(<DocumentCard {...props} status="signed" />);
        expect(screen.getByText('Firmado')).toBeInTheDocument();
    });

    it('validates design tokens', () => {
        renderWithTheme(<DocumentCard {...props} />);
        const card = screen.getByText(props.title).closest('div').parentElement;
        expect(card).toHaveValidDesignTokens();
    });

    it('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<DocumentCard {...props} />);
        expect(asFragment()).toMatchSnapshot();
    });
});
