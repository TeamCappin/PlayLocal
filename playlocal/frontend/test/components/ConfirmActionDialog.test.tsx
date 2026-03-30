import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog';
const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  title: 'Test title',
  titleId: 'test-title',
  descriptionId: 'test-desc',
  overlayAriaLabel: 'Close test dialog',
  cancelLabel: 'Cancel',
  confirmLabel: 'Confirm',
  confirmLoadingLabel: 'Working...',
  children: <p>Body</p>,
};
describe('ConfirmActionDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmActionDialog {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });
  it('calls onConfirm when primary button is clicked', () => {
    const onConfirm = jest.fn();
    render(<ConfirmActionDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it('calls onClose when cancel is clicked', () => {
    const onClose = jest.fn();
    render(<ConfirmActionDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('calls onClose when backdrop is clicked and not loading', () => {
    const onClose = jest.fn();
    render(
      <ConfirmActionDialog
        {...defaultProps}
        onClose={onClose}
        isLoading={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close test dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('does not call onClose when backdrop is clicked while loading', () => {
    const onClose = jest.fn();
    render(
      <ConfirmActionDialog {...defaultProps} onClose={onClose} isLoading />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close test dialog' }));
    expect(onClose).not.toHaveBeenCalled();
  });
  it('shows loading label on primary button when isLoading', () => {
    render(<ConfirmActionDialog {...defaultProps} isLoading />);
    expect(
      screen.getByRole('button', { name: 'Working...' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
  });
});