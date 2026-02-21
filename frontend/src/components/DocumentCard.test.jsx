import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import DocumentCard from './DocumentCard';

describe('DocumentCard Component', () => {
    const props = {
        title: 'Work Authorization',
        subtitle: 'Valid until Dec 2023',
        amount: 1200,
        status: 'PENDING',
        onClick: vi.fn(),
    };

    test('renders document information correctly', () => {
        renderWithTheme(<DocumentCard {...props} />);
        expect(screen.getByText(props.title)).toBeInTheDocument();
        expect(screen.getByText(props.subtitle)).toBeInTheDocument();
        // Amount is formatted as COP currency with space and dot separator
        expect(screen.getByText('$ 1.200')).toBeInTheDocument();
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    test('handles click events', () => {
        renderWithTheme(<DocumentCard {...props} />);
        fireEvent.click(screen.getByText(props.title).closest('div').parentElement);
        expect(props.onClick).toHaveBeenCalled();
    });

    test('displays different status labels', () => {
        const { rerender } = renderWithTheme(<DocumentCard {...props} status="signed" />);
        expect(screen.getByText('Firmado')).toBeInTheDocument();
    });

    test('matches snapshot', () => {
        const { asFragment } = renderWithTheme(<DocumentCard {...props} />);
        expect(asFragment()).toMatchSnapshot();
    });
});
