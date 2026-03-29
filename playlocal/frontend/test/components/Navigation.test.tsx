import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navigation } from '@/components/Navigation';

const pushMock = jest.fn();
const performLogoutRedirectMock = jest.fn();
const openAssistantMock = jest.fn();
const inferRouteMock = jest.fn(() => ({ context: 'discover' as const }));

/** Mutable so tests can assert /settings active styles and route-driven behavior */
let mockPathname = '/discover';

jest.mock('next/link', () => {
  return ({ href, children, onClick, ...props }: any) => (
    <a
      href={href}
      {...props}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
});

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Youssef' },
    isAuthenticated: true,
    isLoading: false,
    logout: jest.fn(),
  }),
}));

jest.mock('@/lib/authRedirect', () => ({
  performLogoutRedirect: (...args: unknown[]) =>
    performLogoutRedirectMock(...args),
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}));

jest.mock('@/context/AssistantContext', () => ({
  useAssistant: () => ({ openAssistant: openAssistantMock }),
}));

jest.mock('@/lib/inferAssistantRoute', () => ({
  inferAssistantRoute: (...args: unknown[]) => inferRouteMock(...args),
}));

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/discover';
  });

  it('opens assistant from Help button', async () => {
    render(<Navigation />);
    const help = await screen.findByRole('button', { name: /open help assistant/i });
    fireEvent.click(help);
    expect(inferRouteMock).toHaveBeenCalledWith('/discover');
    expect(openAssistantMock).toHaveBeenCalledWith('discover', undefined);
  });

  it('applies active styles to profile menu when pathname is under /settings', async () => {
    mockPathname = '/settings/privacy';
    render(<Navigation />);
    const menuBtn = await screen.findByRole('button', { name: /open account menu/i });
    expect(menuBtn.className).toMatch(/text-emerald-600/);
  });

  it('closes profile menu on mousedown outside', async () => {
    render(<Navigation />);
    fireEvent.click(await screen.findByRole('button', { name: /open account menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('Sign out calls performLogoutRedirect', async () => {
    render(<Navigation />);
    fireEvent.click(await screen.findByRole('button', { name: /open account menu/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));

    expect(performLogoutRedirectMock).toHaveBeenCalledWith('/');
  });

  it('Settings link points to /settings', async () => {
    render(<Navigation />);
    fireEvent.click(await screen.findByRole('button', { name: /open account menu/i }));
    const settingsLink = screen.getByRole('menuitem', { name: /^settings$/i });
    expect(settingsLink.getAttribute('href')).toBe('/settings');
  });

  it('closes menu when Profile link is clicked', async () => {
    render(<Navigation />);
    fireEvent.click(await screen.findByRole('button', { name: /open account menu/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^profile$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('closes menu when Settings link is clicked', async () => {
    render(<Navigation />);
    fireEvent.click(await screen.findByRole('button', { name: /open account menu/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^settings$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('renders nothing on landing page', () => {
    mockPathname = '/';
    const { container } = render(<Navigation />);
    expect(container.firstChild).toBeNull();
  });
});
