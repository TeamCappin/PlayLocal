import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

const mockReplace = jest.fn();
const mockPathname = '/settings';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading shell while auth is being checked', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      verifyMfa: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      retryAuthCheck: jest.fn(),
      error: null,
    });

    render(
      <ProtectedRoute>
        <div>Secret content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Checking your session...')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows a redirect shell and redirects unauthenticated users', async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      verifyMfa: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      retryAuthCheck: jest.fn(),
      error: null,
    });

    render(
      <ProtectedRoute>
        <div>Secret content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Redirecting to sign in...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?from=%2Fsettings');
    });
  });

  it('renders children for authenticated users', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
      } as any,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      verifyMfa: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      retryAuthCheck: jest.fn(),
      error: null,
    });

    render(
      <ProtectedRoute>
        <div>Secret content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('renders custom loadingContent when provided', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      verifyMfa: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      retryAuthCheck: jest.fn(),
      error: null,
    });

    render(
      <ProtectedRoute loadingContent={<span>Custom loading UI</span>}>
        <div>Secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Custom loading UI')).toBeInTheDocument();
  });

  it('renders custom errorContent when auth error and callback provided', async () => {
    const retryAuthCheck = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      verifyMfa: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      retryAuthCheck,
      error: 'Boom',
    });

    render(
      <ProtectedRoute
        errorContent={(err, retry) => (
          <button type="button" onClick={retry}>
            {err}
          </button>
        )}
      >
        <div>Secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByRole('button', { name: 'Boom' })).toBeInTheDocument();
    screen.getByRole('button', { name: 'Boom' }).click();
    await waitFor(() => {
      expect(retryAuthCheck).toHaveBeenCalled();
    });
  });
});
