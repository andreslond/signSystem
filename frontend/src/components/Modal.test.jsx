import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import Modal from './Modal';

describe('Modal Component', () => {
    it('renders when open', () => {
        renderWithTheme(
            <Modal isOpen={true} onClose={() => { }} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        const { queryByText } = renderWithTheme(
            <Modal isOpen={false} onClose={() => { }} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        expect(queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('calls onClose when clicking the backdrop', () => {
        const handleClose = vi.fn();
        const { container } = renderWithTheme(
            <Modal isOpen={true} onClose={handleClose} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        // Backdrop is the first child of the fixed container usually, but let's be more specific
        const backdrop = container.querySelector('.bg-black\\/40');
        fireEvent.click(backdrop);
        expect(handleClose).toHaveBeenCalled();
    });

    it('applies drawer styles based on variant', () => {
        renderWithTheme(
            <Modal isOpen={true} onClose={() => { }} variant="drawer">
                <div>Content</div>
            </Modal>
        );
        const modalContainer = screen.getByText('Content').closest('div').parentElement;
        expect(modalContainer).toHaveClass('rounded-t-[32px]');
    });

    it('validates design tokens', () => {
        renderWithTheme(
            <Modal isOpen={true} onClose={() => { }} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        const modalContainer = screen.getByText('Test Modal').closest('div');
        expect(modalContainer).toHaveValidDesignTokens();
    });

    it('matches snapshot', () => {
        const { asFragment } = renderWithTheme(
            <Modal isOpen={true} onClose={() => { }} title="Snapshot Modal">
                <div>Content</div>
            </Modal>
        );
        expect(asFragment()).toMatchSnapshot();
    });
});
