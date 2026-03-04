import React from 'react';
import { render, screen } from '@testing-library/react';
import { Separator } from '@/components/ui/separator';

describe('Separator', () => {
  it('renders with default props', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-slot', 'separator-root');
  });

  it('applies custom className', () => {
    render(<Separator className="custom-class" data-testid="separator" />);
    expect(screen.getByTestId('separator')).toHaveClass('custom-class');
  });

  it('handles horizontal orientation', () => {
    render(<Separator orientation="horizontal" data-testid="separator" />);
    expect(screen.getByTestId('separator')).toHaveAttribute(
      'data-orientation',
      'horizontal'
    );
  });

  it('handles vertical orientation', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    expect(screen.getByTestId('separator')).toHaveAttribute(
      'data-orientation',
      'vertical'
    );
  });

  it('handles decorative false', () => {
    render(<Separator decorative={false} data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('role', 'separator');
  });
});
