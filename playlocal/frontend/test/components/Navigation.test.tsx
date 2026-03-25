import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navigation } from '@/components/Navigation';

const performLogoutRedirectMock = jest.fn();
const openAssistantMock = jest.fn();
const inferRouteMock = jest.fn(() => ({ context: 'discover' as const }));
let pathnameMock = '/discover';
let unreadCountMock = 0;
let authStateMock = {
  user: { displayName: 'Youssef' },
  isAuthenticated: true,
  isLoading: false,
};

jest.mock('next/link', () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock('next/navigation', () => ({
  usePathname: () => pathnameMock,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => authStateMock,
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({ unreadCount: unreadCountMock }),
}));

jest.mock('@/context/AssistantContext', () => ({
  useAssistant: () => ({ openAssistant: openAssistantMock }),
}));

jest.mock('@/lib/inferAssistantRoute', () => ({
  inferAssistantRoute: (...args: unknown[]) => inferRouteMock(...args),
}));

jest.mock('@/lib/authRedirect', () => ({
  performLogoutRedirect: (...args: unknown[]) => performLogoutRedirectMock(...args),
}));

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pathnameMock = '/discover';
    unreadCountMock = 0;
    authStateMock = {
      user: { displayName: 'Youssef' },
      isAuthenticated: true,
      isLoading: false,
    };
  });

  it('opens assistant from Help button', () => {
    render(<Navigation />);
    fireEvent.click(screen.getByRole('button', { name: /open help assistant/i }));
    expect(inferRouteMock).toHaveBeenCalledWith('/discover');
    expect(openAssistantMock).toHaveBeenCalledWith('discover', undefined);
  });

  it('returns nothing on the landing page', () => {
    pathnameMock = '/';

    const { container } = render(<Navigation />);

    expect(container.firstChild).toBeNull();
  });

  it('shows loading skeleton while auth is loading', () => {
    authStateMock = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
    };

    const { container } = render(<Navigation />);

    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Sign out')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('calls redirect logout helper when sign out is clicked', () => {
    render(<Navigation />);

    fireEvent.click(screen.getByTitle('Sign out'));

    expect(performLogoutRedirectMock).toHaveBeenCalledWith('/');
  });

  it('shows unread notification badge on the bell link', () => {
    unreadCountMock = 3;

    render(<Navigation />);

    const notificationsLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href') === '/notifications');

    expect(notificationsLink).toBeDefined();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
