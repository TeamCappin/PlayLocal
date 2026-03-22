import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';

describe('Sheet', () => {
  it('renders trigger and opens sheet on click', () => {
    render(
      <Sheet>
        <SheetTrigger data-testid="trigger">Open Sheet</SheetTrigger>
        <SheetContent data-testid="content">
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet description.</SheetDescription>
          </SheetHeader>
          Content
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByTestId('trigger')).toHaveAttribute(
      'data-slot',
      'sheet-trigger'
    );
    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Sheet Title')).toBeInTheDocument();
    expect(screen.getByText('Sheet description.')).toBeInTheDocument();
  });

  it('renders sheet when open prop is true', () => {
    render(
      <Sheet open>
        <SheetContent data-testid="content">
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          Body
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByTestId('content')).toHaveAttribute(
      'data-slot',
      'sheet-content'
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renders sheet content with right side by default', () => {
    render(
      <Sheet open>
        <SheetContent data-testid="content" side="right">
          <SheetHeader>
            <SheetTitle>Sheet</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          Content
        </SheetContent>
      </Sheet>
    );
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
  });

  it('renders sheet content with left side', () => {
    render(
      <Sheet open>
        <SheetContent data-testid="content" side="left">
          <SheetHeader>
            <SheetTitle>Sheet</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          Content
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders sheet content with top and bottom side', () => {
    const { rerender } = render(
      <Sheet open>
        <SheetContent data-testid="content" side="top">
          <SheetHeader>
            <SheetTitle>Sheet</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          Top
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('Top');
    rerender(
      <Sheet open>
        <SheetContent data-testid="content" side="bottom">
          <SheetHeader>
            <SheetTitle>Sheet</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          Bottom
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('Bottom');
  });

  it('renders sheet header and footer', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader data-testid="header">
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
          <p>Body</p>
          <SheetFooter data-testid="footer">Footer actions</SheetFooter>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByTestId('header')).toHaveAttribute(
      'data-slot',
      'sheet-header'
    );
    expect(screen.getByTestId('footer')).toHaveAttribute(
      'data-slot',
      'sheet-footer'
    );
    expect(screen.getByTestId('footer')).toHaveTextContent('Footer actions');
  });
});
