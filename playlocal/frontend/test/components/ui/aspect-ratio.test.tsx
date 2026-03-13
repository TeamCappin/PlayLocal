import React from 'react';
import { render, screen } from '@testing-library/react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

describe('AspectRatio', () => {
  it('renders aspect ratio container', () => {
    render(
      <AspectRatio ratio={16 / 9} data-testid="aspect-ratio">
        <div>Content</div>
      </AspectRatio>
    );
    const container = screen.getByTestId('aspect-ratio');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('data-slot', 'aspect-ratio');
  });

  it('renders children', () => {
    render(
      <AspectRatio ratio={16 / 9} data-testid="aspect-ratio">
        <div data-testid="content">Content</div>
      </AspectRatio>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('Content');
  });
});
