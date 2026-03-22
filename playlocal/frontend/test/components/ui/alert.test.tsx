import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert', () => {
  it('renders with default variant', () => {
    render(<Alert data-testid="alert">Alert content</Alert>);
    const alert = screen.getByTestId('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-slot', 'alert');
    expect(alert).toHaveAttribute('role', 'alert');
  });

  it('renders with destructive variant', () => {
    render(
      <Alert variant="destructive" data-testid="alert">
        Error
      </Alert>
    );
    expect(screen.getByTestId('alert')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Alert className="custom-class" data-testid="alert">
        Alert
      </Alert>
    );
    expect(screen.getByTestId('alert')).toHaveClass('custom-class');
  });

  it('renders AlertTitle', () => {
    render(
      <Alert>
        <AlertTitle data-testid="title">Alert Title</AlertTitle>
      </Alert>
    );
    const title = screen.getByTestId('title');
    expect(title).toHaveAttribute('data-slot', 'alert-title');
    expect(title).toHaveTextContent('Alert Title');
  });

  it('renders AlertDescription', () => {
    render(
      <Alert>
        <AlertDescription data-testid="desc">Description</AlertDescription>
      </Alert>
    );
    const desc = screen.getByTestId('desc');
    expect(desc).toHaveAttribute('data-slot', 'alert-description');
    expect(desc).toHaveTextContent('Description');
  });
});
