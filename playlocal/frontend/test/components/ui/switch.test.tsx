import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from '@/components/ui/switch';

describe('Switch', () => {
  it('renders switch', () => {
    render(<Switch data-testid="switch" />);
    const switchEl = screen.getByTestId('switch');
    expect(switchEl).toBeInTheDocument();
    expect(switchEl).toHaveAttribute('data-slot', 'switch');
  });

  it('applies custom className', () => {
    render(<Switch className="custom-class" data-testid="switch" />);
    expect(screen.getByTestId('switch')).toHaveClass('custom-class');
  });

  it('handles checked and unchecked state', () => {
    const { rerender } = render(<Switch checked data-testid="switch" />);
    expect(screen.getByTestId('switch')).toHaveAttribute(
      'data-state',
      'checked'
    );
    rerender(<Switch checked={false} data-testid="switch" />);
    expect(screen.getByTestId('switch')).toHaveAttribute(
      'data-state',
      'unchecked'
    );
  });

  it('toggles on click', () => {
    render(<Switch data-testid="switch" />);
    const switchEl = screen.getByTestId('switch');
    fireEvent.click(switchEl);
    expect(switchEl).toHaveAttribute('data-state', 'checked');
    fireEvent.click(switchEl);
    expect(switchEl).toHaveAttribute('data-state', 'unchecked');
  });

  it('handles disabled state', () => {
    render(<Switch disabled data-testid="switch" />);
    expect(screen.getByTestId('switch')).toBeDisabled();
  });

  it('renders thumb', () => {
    render(<Switch data-testid="switch" />);
    const switchEl = screen.getByTestId('switch');
    expect(
      switchEl.querySelector('[data-slot="switch-thumb"]')
    ).toBeInTheDocument();
  });
});
