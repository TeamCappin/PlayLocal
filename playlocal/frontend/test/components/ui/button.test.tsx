import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with default variant and size', () => {
    render(<Button data-testid="button">Click me</Button>);
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-slot', 'button');
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <Button variant="secondary" data-testid="button">
        Secondary
      </Button>
    );
    expect(screen.getByTestId('button')).toBeInTheDocument();
    rerender(
      <Button variant="destructive" data-testid="button">
        Destructive
      </Button>
    );
    expect(screen.getByTestId('button')).toBeInTheDocument();
    rerender(
      <Button variant="outline" data-testid="button">
        Outline
      </Button>
    );
    expect(screen.getByTestId('button')).toBeInTheDocument();
    rerender(
      <Button variant="ghost" data-testid="button">
        Ghost
      </Button>
    );
    expect(screen.getByTestId('button')).toBeInTheDocument();
    rerender(
      <Button variant="link" data-testid="button">
        Link
      </Button>
    );
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Button size="sm" data-testid="button">
        Small
      </Button>
    );
    expect(screen.getByTestId('button')).toBeInTheDocument();
    rerender(
      <Button size="lg" data-testid="button">
        Large
      </Button>
    );
    expect(screen.getByTestId('button')).toBeInTheDocument();
    rerender(
      <Button size="icon" data-testid="button">
        Icon
      </Button>
    );
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Button className="custom-class" data-testid="button">
        Button
      </Button>
    );
    expect(screen.getByTestId('button')).toHaveClass('custom-class');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} data-testid="button">
        Click me
      </Button>
    );
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles disabled state', () => {
    render(
      <Button disabled data-testid="button">
        Disabled
      </Button>
    );
    expect(screen.getByTestId('button')).toBeDisabled();
  });

  it('renders as child when asChild is true', () => {
    render(
      <Button asChild data-testid="button">
        <a href="/test">Link Button</a>
      </Button>
    );
    expect(
      screen.getByRole('link', { name: 'Link Button' })
    ).toBeInTheDocument();
  });
});
