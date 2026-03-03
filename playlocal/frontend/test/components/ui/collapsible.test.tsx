import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

describe('Collapsible', () => {
  it('renders collapsible', () => {
    render(
      <Collapsible data-testid="collapsible">
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByTestId('collapsible')).toHaveAttribute(
      'data-slot',
      'collapsible'
    );
    expect(screen.getByTestId('trigger')).toHaveAttribute(
      'data-slot',
      'collapsible-trigger'
    );
    expect(screen.getByTestId('content')).toHaveAttribute(
      'data-slot',
      'collapsible-content'
    );
  });

  it('toggles content on trigger click', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Content</CollapsibleContent>
      </Collapsible>
    );
    const content = screen.getByTestId('content');
    expect(content).toHaveAttribute('data-state', 'closed');
    fireEvent.click(screen.getByTestId('trigger'));
    expect(content).toHaveAttribute('data-state', 'open');
  });
});
