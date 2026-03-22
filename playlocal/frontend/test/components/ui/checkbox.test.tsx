import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('renders checkbox', () => {
    render(<Checkbox data-testid="checkbox" />);
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('data-slot', 'checkbox');
  });

  it('applies custom className', () => {
    render(<Checkbox className="custom-class" data-testid="checkbox" />);
    expect(screen.getByTestId('checkbox')).toHaveClass('custom-class');
  });

  it('handles checked and unchecked state', () => {
    const { rerender } = render(<Checkbox checked data-testid="checkbox" />);
    expect(screen.getByTestId('checkbox')).toHaveAttribute(
      'data-state',
      'checked'
    );
    rerender(<Checkbox checked={false} data-testid="checkbox" />);
    expect(screen.getByTestId('checkbox')).toHaveAttribute(
      'data-state',
      'unchecked'
    );
  });

  it('toggles on click', () => {
    render(<Checkbox data-testid="checkbox" />);
    const checkbox = screen.getByTestId('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  it('handles disabled state', () => {
    render(<Checkbox disabled data-testid="checkbox" />);
    expect(screen.getByTestId('checkbox')).toBeDisabled();
  });
});
