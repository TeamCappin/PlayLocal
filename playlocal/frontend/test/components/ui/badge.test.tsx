import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge data-testid="badge">Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('renders with secondary variant', () => {
    render(
      <Badge variant="secondary" data-testid="badge">
        Secondary
      </Badge>
    );
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('renders with destructive and outline variants', () => {
    const { rerender } = render(
      <Badge variant="destructive" data-testid="badge">
        Destructive
      </Badge>
    );
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    rerender(
      <Badge variant="outline" data-testid="badge">
        Outline
      </Badge>
    );
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Badge className="custom-class" data-testid="badge">
        Badge
      </Badge>
    );
    expect(screen.getByTestId('badge')).toHaveClass('custom-class');
  });

  it('renders as child when asChild is true', () => {
    render(
      <Badge asChild data-testid="badge">
        <a href="/test">Link Badge</a>
      </Badge>
    );
    const link = screen.getByRole('link', { name: 'Link Badge' });
    expect(link).toBeInTheDocument();
  });
});
