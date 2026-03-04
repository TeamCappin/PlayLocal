import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

describe('Avatar', () => {
  it('renders avatar container', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('data-slot', 'avatar');
  });

  it('applies custom className', () => {
    render(
      <Avatar className="custom-class" data-testid="avatar">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByTestId('avatar')).toHaveClass('custom-class');
  });

  it('renders avatar image and fallback', () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.jpg" alt="Avatar" />
        <AvatarFallback data-testid="fallback">AB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByTestId('fallback')).toHaveAttribute(
      'data-slot',
      'avatar-fallback'
    );
    expect(screen.getByTestId('fallback')).toHaveTextContent('AB');
  });
});
