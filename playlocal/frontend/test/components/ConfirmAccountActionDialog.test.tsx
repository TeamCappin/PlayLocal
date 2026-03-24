import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmAccountActionDialog } from '@/components/ConfirmAccountActionDialog';

describe('ConfirmAccountActionDialog', () => {
  it('deactivate: shows copy and confirm calls onConfirm', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    render(
      <ConfirmAccountActionDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        action="deactivate"
        isLoading={false}
      />
    );

    expect(screen.getByText('Deactivate Account?')).toBeInTheDocument();
    expect(
      screen.getByText(/You can reactivate within 30 days/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Account' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('delete: requires typing DELETE before confirm runs', async () => {
    const onConfirm = jest.fn();

    render(
      <ConfirmAccountActionDialog
        isOpen
        onClose={jest.fn()}
        onConfirm={onConfirm}
        action="delete"
        isLoading={false}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Delete Forever' });
    expect(confirmBtn).toBeDisabled();
    fireEvent.click(confirmBtn);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('DELETE'), {
      target: { value: 'DELETE' },
    });

    const enabledConfirm = await screen.findByRole('button', {
      name: 'Delete Forever',
    });
    expect(enabledConfirm).not.toBeDisabled();
    fireEvent.click(enabledConfirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows loading labels and disables controls', () => {
    render(
      <ConfirmAccountActionDialog
        isOpen
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        action="deactivate"
        isLoading
      />
    );

    expect(screen.getByRole('button', { name: 'Deactivating...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('delete loading shows Deleting...', () => {
    render(
      <ConfirmAccountActionDialog
        isOpen
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        action="delete"
        isLoading
      />
    );

    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
  });

  it('Cancel clears typed text via onClose', () => {
    const onClose = jest.fn();

    render(
      <ConfirmAccountActionDialog
        isOpen
        onClose={onClose}
        onConfirm={jest.fn()}
        action="delete"
        isLoading={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('DELETE'), {
      target: { value: 'DELETE' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByPlaceholderText('DELETE')).toHaveValue('');
  });

  it('closes when backdrop is clicked', () => {
    const onClose = jest.fn();

    render(
      <ConfirmAccountActionDialog
        isOpen
        onClose={onClose}
        onConfirm={jest.fn()}
        action="deactivate"
        isLoading={false}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Close account action dialog' })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close from backdrop click while loading', () => {
    const onClose = jest.fn();

    render(
      <ConfirmAccountActionDialog
        isOpen
        onClose={onClose}
        onConfirm={jest.fn()}
        action="deactivate"
        isLoading
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Close account action dialog' })
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
