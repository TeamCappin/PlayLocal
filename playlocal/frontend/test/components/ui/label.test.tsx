import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('renders label element', () => {
    render(<Label data-testid="label">Test Label</Label>);
    const label = screen.getByTestId('label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('data-slot', 'label');
    expect(label).toHaveTextContent('Test Label');
  });

  it('applies custom className', () => {
    render(
      <Label className="custom-class" data-testid="label">
        Label
      </Label>
    );
    expect(screen.getByTestId('label')).toHaveClass('custom-class');
  });

  it('handles htmlFor prop', () => {
    render(
      <Label htmlFor="input-id" data-testid="label">
        Label
      </Label>
    );
    expect(screen.getByTestId('label')).toHaveAttribute('for', 'input-id');
  });
});
