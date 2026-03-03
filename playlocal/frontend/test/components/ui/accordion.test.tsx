import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

describe('Accordion', () => {
  it('renders accordion', () => {
    render(
      <Accordion data-testid="accordion">
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(screen.getByTestId('accordion')).toHaveAttribute(
      'data-slot',
      'accordion'
    );
  });

  it('renders accordion item and trigger', () => {
    render(
      <Accordion>
        <AccordionItem value="item-1" data-testid="item">
          <AccordionTrigger data-testid="trigger">Click me</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(screen.getByTestId('item')).toHaveAttribute(
      'data-slot',
      'accordion-item'
    );
    expect(screen.getByTestId('trigger')).toHaveAttribute(
      'data-slot',
      'accordion-trigger'
    );
  });

  it('renders accordion content when open', () => {
    render(
      <Accordion defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent data-testid="content">
            Content text
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    const content = screen.getByTestId('content');
    expect(content).toHaveAttribute('data-slot', 'accordion-content');
    expect(content).toHaveTextContent('Content text');
  });

  it('toggles content on trigger click', () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger data-testid="trigger">Toggle</AccordionTrigger>
          <AccordionContent data-testid="content">Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    const trigger = screen.getByTestId('trigger');
    const content = screen.getByTestId('content');
    expect(content).toHaveAttribute('data-state', 'closed');
    fireEvent.click(trigger);
    expect(content).toHaveAttribute('data-state', 'open');
  });
});
