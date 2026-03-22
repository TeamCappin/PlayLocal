import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '@/components/ui/progress';

describe('Progress', () => {
  it('renders progress', () => {
    render(<Progress value={50} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveAttribute('data-slot', 'progress');
  });

  it('applies custom className', () => {
    render(
      <Progress value={50} className="custom-class" data-testid="progress" />
    );
    expect(screen.getByTestId('progress')).toHaveClass('custom-class');
  });

  it('renders indicator with correct transform for value', () => {
    render(<Progress value={75} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    const indicator = progress.querySelector(
      '[data-slot="progress-indicator"]'
    );
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' });
  });

  it('handles zero and undefined value', () => {
    const { rerender } = render(<Progress value={0} data-testid="progress" />);
    let progress = screen.getByTestId('progress');
    let indicator = progress.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    rerender(<Progress data-testid="progress" />);
    progress = screen.getByTestId('progress');
    indicator = progress.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });
});
