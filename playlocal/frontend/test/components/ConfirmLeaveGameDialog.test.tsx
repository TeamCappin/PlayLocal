import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmLeaveGameDialog } from '@/components/ConfirmLeaveGameDialog';

describe('ConfirmLeaveGameDialog', () => {
  it('shows Leaving... on the confirm button when loading', () => {
    render(
      <ConfirmLeaveGameDialog
        isOpen
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        gameTitle="Pickup"
        isLoading
      />
    );

    expect(
      screen.getByRole('button', { name: 'Leaving...' })
    ).toBeInTheDocument();
  });

  it('shows Leave Game when not loading', () => {
    render(
      <ConfirmLeaveGameDialog
        isOpen
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        gameTitle="Pickup"
        isLoading={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Leave Game' })).toBeInTheDocument();
  });

  it('closes when backdrop is clicked', () => {
    const onClose = jest.fn();

    render(
      <ConfirmLeaveGameDialog
        isOpen
        onClose={onClose}
        onConfirm={jest.fn()}
        gameTitle="Pickup"
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close leave game dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close from backdrop click while loading', () => {
    const onClose = jest.fn();

    render(
      <ConfirmLeaveGameDialog
        isOpen
        onClose={onClose}
        onConfirm={jest.fn()}
        gameTitle="Pickup"
        isLoading
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close leave game dialog' }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
