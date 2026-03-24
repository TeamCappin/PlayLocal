import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navigation } from '@/components/Navigation';

const pushMock = jest.fn();
const logoutMock = jest.fn();
const openAssistantMock = jest.fn();
const inferRouteMock = jest.fn(() => ({ context: 'discover' as const }));

jest.mock('next/link', () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/discover',
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Youssef' },
    isAuthenticated: true,
    isLoading: false,
    logout: logoutMock,
  }),
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
  });

  it('opens assistant from Help button', () => {
    render(<Navigation />);
    fireEvent.click(screen.getByRole('button', { name: /open help assistant/i }));
    expect(inferRouteMock).toHaveBeenCalledWith('/discover');
    expect(openAssistantMock).toHaveBeenCalledWith('discover', undefined);
  });
});
