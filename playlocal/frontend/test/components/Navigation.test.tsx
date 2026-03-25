import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navigation } from '@/components/Navigation';

const performLogoutRedirectMock = jest.fn();
const openAssistantMock = jest.fn();
const inferRouteMock = jest.fn(() => ({ context: 'discover' as const }));
let pathnameMock = '/discover';
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

let unreadCountMock = 0;
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

let isMobileMock = false;
jest.mock('@/components/ui/use-mobile', () => ({
  useIsMobile: () => isMobileMock,
}));

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pathnameMock = '/discover';
    isMobileMock = false;
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

  describe('mobile view', () => {
    beforeEach(() => {
      isMobileMock = true;
    });

    it('shows notification bell and sign out for authenticated user', () => {
      render(<Navigation />);

      expect(screen.getByTitle('Sign out')).toBeInTheDocument();
      expect(screen.queryByText('Discover Games')).not.toBeInTheDocument();
    });

    it('calls logout when mobile sign out is clicked', () => {
      render(<Navigation />);

      fireEvent.click(screen.getByTitle('Sign out'));

      expect(performLogoutRedirectMock).toHaveBeenCalledWith('/');
    });

    it('shows Sign In link when not authenticated', () => {
      authStateMock = {
        user: null as any,
        isAuthenticated: false,
        isLoading: false,
      };

      render(<Navigation />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.queryByTitle('Sign out')).not.toBeInTheDocument();
    });

    it('shows notification badge when unreadCount > 0', () => {
      unreadCountMock = 5;

      render(<Navigation />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows loading skeleton on mobile when auth is loading', () => {
      authStateMock = {
        user: null as any,
        isAuthenticated: false,
        isLoading: true,
      };

      const { container } = render(<Navigation />);

      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });
});
