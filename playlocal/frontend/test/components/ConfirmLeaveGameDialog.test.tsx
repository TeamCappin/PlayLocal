import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
