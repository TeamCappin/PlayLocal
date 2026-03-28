// test/context/AuthContext.test.tsx
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { authApi, setAuthToken, getAuthToken, ApiError } from '@/lib/api';

jest.mock('@/lib/api', () => {
  // A real-ish ApiError class so `instanceof ApiError` works in tests.
  class MockApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  return {
    __esModule: true,
    authApi: {
      getCurrentUser: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    },
    setAuthToken: jest.fn(),
    getAuthToken: jest.fn(),
    ApiError: MockApiError,
  };
});

const mockedAuthApi = authApi as unknown as {
  getCurrentUser: jest.Mock;
  login: jest.Mock;
  register: jest.Mock;
  logout: jest.Mock;
};

const mockedSetAuthToken = setAuthToken as unknown as jest.Mock;
const mockedGetAuthToken = getAuthToken as unknown as jest.Mock;

// Test helper component so we can call context functions and display state.
function TestConsumer() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    retryAuthCheck,
  } = useAuth();

  return (
    <div>
      <div data-testid="isLoading">{String(isLoading)}</div>
      <div data-testid="isAuthenticated">{String(isAuthenticated)}</div>
      <div data-testid="userEmail">{user?.email ?? ''}</div>
      <div data-testid="error">{error ?? ''}</div>

      <button onClick={() => login('a@b.com', 'pw')} type="button">
        doLogin
      </button>
      <button
        onClick={() => register('r@b.com', 'pw', 'Reg User', true, true)}
        type="button"
      >
        doRegister
      </button>
      <button onClick={() => logout()} type="button">
        doLogout
      </button>
      <button onClick={() => refreshUser()} type="button">
        doRefresh
      </button>
      <button onClick={() => retryAuthCheck()} type="button">
        doRetryAuth
      </button>
    </div>
  );
}

function renderWithProvider(ui: React.ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('AuthContext / AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws if useAuth is used outside AuthProvider', () => {
    // silence expected React error output in test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    spy.mockRestore();
  });

  it('on mount: no token => sets isLoading false, stays unauthenticated', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null);

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    expect(mockedAuthApi.getCurrentUser).not.toHaveBeenCalled();
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('userEmail')).toHaveTextContent('');
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });

  it('on mount: token exists => loads current user and authenticates', async () => {
    mockedGetAuthToken.mockReturnValueOnce('token-123');
    mockedAuthApi.getCurrentUser.mockResolvedValueOnce({
      userId: 'u1',
      email: 'me@example.com',
      displayName: 'Me',
      reliabilityScore: 90,
      gamesCount: 1,
    });

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    expect(mockedAuthApi.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('userEmail')).toHaveTextContent('me@example.com');
    expect(mockedSetAuthToken).not.toHaveBeenCalled();
  });

  it('on mount: token exists but getCurrentUser fails with 401 => clears token and remains unauthenticated', async () => {
    mockedGetAuthToken.mockReturnValueOnce('token-123');
    // Must be ApiError with status 401 — plain Error is treated as retryable (AC6)
    mockedAuthApi.getCurrentUser.mockRejectedValueOnce(
      new ApiError('Unauthorized', 401)
    );

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    expect(mockedAuthApi.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockedSetAuthToken).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('userEmail')).toHaveTextContent('');
  });

  it('on mount: token exists but getCurrentUser fails with non-401 ApiError => sets ApiError message', async () => {
    mockedGetAuthToken.mockReturnValueOnce('token-123');
    mockedAuthApi.getCurrentUser.mockRejectedValueOnce(
      new ApiError('Server unavailable', 503)
    );

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('Server unavailable');
  });

  it('on mount: token exists but getCurrentUser fails with generic Error => sets generic message', async () => {
    mockedGetAuthToken.mockReturnValueOnce('token-123');
    mockedAuthApi.getCurrentUser.mockRejectedValueOnce(new Error('network'));

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('error')).toHaveTextContent(
      'Something went wrong. Please try again.'
    );
  });

  it('login success: calls authApi.login, stores token, sets user, clears loading', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null); // mount
    mockedAuthApi.login.mockResolvedValueOnce({
      token: 'new-token',
      user: {
        userId: 'u2',
        email: 'a@b.com',
        displayName: 'A',
        reliabilityScore: 88,
        gamesCount: 7,
      },
    });

    renderWithProvider(<TestConsumer />);

    await waitFor(() =>
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    );

    // trigger login
    await act(async () => {
      screen.getByRole('button', { name: 'doLogin' }).click();
    });

    expect(mockedAuthApi.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
    });
    expect(mockedSetAuthToken).toHaveBeenCalledWith('new-token');

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('userEmail')).toHaveTextContent('a@b.com');
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
  });

  it('login failure with ApiError: sets error to ApiError.message and rethrows', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null); // mount
    const err = new (ApiError as any)('Invalid credentials', 401);
    mockedAuthApi.login.mockRejectedValueOnce(err);

    // We need a consumer that calls login and catches rejection so test doesn't fail.
    function LoginCatcher() {
      const { error, login, isLoading } = useAuth();
      return (
        <div>
          <div data-testid="err">{error ?? ''}</div>
          <div data-testid="loading">{String(isLoading)}</div>
          <button
            type="button"
            onClick={async () => {
              try {
                await login('a@b.com', 'pw');
              } catch {
                // swallow
              }
            }}
          >
            run
          </button>
        </div>
      );
    }

    renderWithProvider(<LoginCatcher />);

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    );

    await act(async () => {
      screen.getByRole('button', { name: 'run' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('err')).toHaveTextContent(
        'Invalid credentials'
      );
    });
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('login failure with non-ApiError: sets generic message and rethrows', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null); // mount
    mockedAuthApi.login.mockRejectedValueOnce(new Error('network down'));

    function LoginCatcher() {
      const { error, login } = useAuth();
      return (
        <div>
          <div data-testid="err">{error ?? ''}</div>
          <button
            type="button"
            onClick={async () => {
              try {
                await login('a@b.com', 'pw');
              } catch {
                // swallow
              }
            }}
          >
            run
          </button>
        </div>
      );
    }

    renderWithProvider(<LoginCatcher />);

    await act(async () => {
      screen.getByRole('button', { name: 'run' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('err')).toHaveTextContent(
        'Login failed. Please try again.'
      );
    });
  });

  it('register success: calls authApi.register, stores token, sets user', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null); // mount
    mockedAuthApi.register.mockResolvedValueOnce({
      token: 'reg-token',
      user: {
        userId: 'u3',
        email: 'r@b.com',
        displayName: 'Reg User',
        reliabilityScore: 70,
        gamesCount: 0,
      },
    });

    renderWithProvider(<TestConsumer />);
    await waitFor(() =>
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    );

    await act(async () => {
      screen.getByRole('button', { name: 'doRegister' }).click();
    });

    expect(mockedAuthApi.register).toHaveBeenCalledWith({
      email: 'r@b.com',
      password: 'pw',
      displayName: 'Reg User',
      ageConfirmed: true,
      eulaAccepted: true,
    });
    expect(mockedSetAuthToken).toHaveBeenCalledWith('reg-token');

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('userEmail')).toHaveTextContent('r@b.com');
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });

  it('register failure with ApiError: sets ApiError.message', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null); // mount
    const err = new (ApiError as any)('Email already used', 409);
    mockedAuthApi.register.mockRejectedValueOnce(err);

    function RegisterCatcher() {
      const { error, register } = useAuth();
      return (
        <div>
          <div data-testid="err">{error ?? ''}</div>
          <button
            type="button"
            onClick={async () => {
              try {
                await register('r@b.com', 'pw', 'Reg User', true, true);
              } catch {
                // swallow
              }
            }}
          >
            run
          </button>
        </div>
      );
    }

    renderWithProvider(<RegisterCatcher />);

    await act(async () => {
      screen.getByRole('button', { name: 'run' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('err')).toHaveTextContent('Email already used');
    });
  });

  it('logout: calls authApi.logout and clears user', async () => {
    mockedGetAuthToken.mockReturnValueOnce('token-123');
    mockedAuthApi.getCurrentUser.mockResolvedValueOnce({
      userId: 'u1',
      email: 'me@example.com',
      displayName: 'Me',
      reliabilityScore: 90,
      gamesCount: 1,
    });

    renderWithProvider(<TestConsumer />);

    await waitFor(() =>
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    );

    act(() => {
      screen.getByRole('button', { name: 'doLogout' }).click();
    });

    expect(mockedAuthApi.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('userEmail')).toHaveTextContent('');
  });

  it('refreshUser: with token, updates user from getCurrentUser', async () => {
    // mount: no token so it doesn't call getCurrentUser
    mockedGetAuthToken.mockReturnValueOnce(null);

    renderWithProvider(<TestConsumer />);
    await waitFor(() =>
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    );

    // refresh: token exists and returns user
    mockedGetAuthToken.mockReturnValueOnce('token-123');
    mockedAuthApi.getCurrentUser.mockResolvedValueOnce({
      userId: 'u9',
      email: 'fresh@example.com',
      displayName: 'Fresh',
      reliabilityScore: 77,
      gamesCount: 2,
    });

    await act(async () => {
      screen.getByRole('button', { name: 'doRefresh' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
    expect(mockedAuthApi.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('userEmail')).toHaveTextContent(
      'fresh@example.com'
    );
  });

  it('refreshUser: with token but getCurrentUser fails => clears token and user', async () => {
    // mount with existing token and user
    mockedGetAuthToken.mockReturnValueOnce('token-123');
    mockedAuthApi.getCurrentUser.mockResolvedValueOnce({
      userId: 'u1',
      email: 'me@example.com',
      displayName: 'Me',
      reliabilityScore: 90,
      gamesCount: 1,
    });

    renderWithProvider(<TestConsumer />);
    await waitFor(() =>
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    );

    // refresh: token exists but request fails
    mockedGetAuthToken.mockReturnValueOnce('token-123');
    mockedAuthApi.getCurrentUser.mockRejectedValueOnce(new Error('401'));

    await act(async () => {
      screen.getByRole('button', { name: 'doRefresh' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    expect(mockedSetAuthToken).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('userEmail')).toHaveTextContent('');
  });

  it('refreshUser: no token => does nothing', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null); // mount

    renderWithProvider(<TestConsumer />);
    await waitFor(() =>
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    );

    mockedGetAuthToken.mockReturnValueOnce(null); // refresh
    await act(async () => {
      screen.getByRole('button', { name: 'doRefresh' }).click();
    });

    expect(mockedAuthApi.getCurrentUser).not.toHaveBeenCalled();
    expect(mockedSetAuthToken).not.toHaveBeenCalled();
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
  });

  describe('retryAuthCheck', () => {
    it('with token: loads user and clears error', async () => {
      mockedGetAuthToken.mockReturnValueOnce(null);
      renderWithProvider(<TestConsumer />);
      await waitFor(() =>
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      );

      mockedGetAuthToken.mockReturnValue('tok');
      mockedAuthApi.getCurrentUser.mockResolvedValueOnce({
        userId: 'u1',
        email: 'retry@example.com',
        displayName: 'Retry',
        reliabilityScore: 80,
        gamesCount: 1,
      });

      await act(async () => {
        screen.getByRole('button', { name: 'doRetryAuth' }).click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });
      expect(screen.getByTestId('userEmail')).toHaveTextContent('retry@example.com');
      expect(screen.getByTestId('error')).toHaveTextContent('');
    });

    it('with token and 401 ApiError: clears token and user', async () => {
      mockedGetAuthToken.mockReturnValueOnce(null);
      renderWithProvider(<TestConsumer />);
      await waitFor(() =>
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      );

      mockedGetAuthToken.mockReturnValue('tok');
      mockedAuthApi.getCurrentUser.mockRejectedValueOnce(
        new ApiError('Unauthorized', 401)
      );

      await act(async () => {
        screen.getByRole('button', { name: 'doRetryAuth' }).click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });
      expect(mockedSetAuthToken).toHaveBeenCalledWith(null);
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('with token and non-401 ApiError: sets error message', async () => {
      mockedGetAuthToken.mockReturnValueOnce(null);
      renderWithProvider(<TestConsumer />);
      await waitFor(() =>
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      );

      mockedGetAuthToken.mockReturnValue('tok');
      mockedAuthApi.getCurrentUser.mockRejectedValueOnce(
        new ApiError('Bad gateway', 502)
      );

      await act(async () => {
        screen.getByRole('button', { name: 'doRetryAuth' }).click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Bad gateway');
      });
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('with token and generic error: sets generic message', async () => {
      mockedGetAuthToken.mockReturnValueOnce(null);
      renderWithProvider(<TestConsumer />);
      await waitFor(() =>
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      );

      mockedGetAuthToken.mockReturnValue('tok');
      mockedAuthApi.getCurrentUser.mockRejectedValueOnce(new Error('boom'));

      await act(async () => {
        screen.getByRole('button', { name: 'doRetryAuth' }).click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Something went wrong. Please try again.'
        );
      });
    });

    it('no token: finishes without calling getCurrentUser', async () => {
      mockedGetAuthToken.mockReturnValueOnce(null);
      renderWithProvider(<TestConsumer />);
      await waitFor(() =>
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      );

      const callsBefore = mockedAuthApi.getCurrentUser.mock.calls.length;
      mockedGetAuthToken.mockReturnValue(null);

      await act(async () => {
        screen.getByRole('button', { name: 'doRetryAuth' }).click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });
      expect(mockedAuthApi.getCurrentUser.mock.calls.length).toBe(callsBefore);
    });
  });
});
