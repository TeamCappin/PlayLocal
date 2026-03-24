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
      verifyMfa: jest.fn(),
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
  verifyMfa: jest.Mock;
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
    verifyMfa,
    register,
    logout,
    refreshUser,
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
      <button onClick={() => verifyMfa('a@b.com', '123456').catch(() => {})} type="button">
        doVerifyMfa
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

  it('on mount: token exists but getCurrentUser fails => clears token and remains unauthenticated', async () => {
    mockedGetAuthToken.mockReturnValueOnce('token-123');
    mockedAuthApi.getCurrentUser.mockRejectedValueOnce(new Error('401'));

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    expect(mockedAuthApi.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockedSetAuthToken).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('userEmail')).toHaveTextContent('');
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
      captchaToken: undefined,
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
      captchaToken: undefined,
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

  it('login with mfaRequired: returns mfaRequired true without setting user', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null);
    mockedAuthApi.login.mockResolvedValueOnce({ mfaRequired: true });

    function MfaLoginConsumer() {
      const { login, isAuthenticated, isLoading } = useAuth();
      const [mfaNeeded, setMfaNeeded] = React.useState(false);
      return (
        <div>
          <div data-testid="auth">{String(isAuthenticated)}</div>
          <div data-testid="loading">{String(isLoading)}</div>
          <div data-testid="mfa">{String(mfaNeeded)}</div>
          <button
            type="button"
            onClick={async () => {
              const res = await login('a@b.com', 'pw');
              if (res.mfaRequired) setMfaNeeded(true);
            }}
          >
            run
          </button>
        </div>
      );
    }

    renderWithProvider(<MfaLoginConsumer />);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      screen.getByRole('button', { name: 'run' }).click();
    });

    expect(screen.getByTestId('mfa')).toHaveTextContent('true');
    expect(screen.getByTestId('auth')).toHaveTextContent('false');
    expect(mockedSetAuthToken).not.toHaveBeenCalled();
  });

  it('verifyMfa success: stores token and sets user', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null);
    mockedAuthApi.verifyMfa.mockResolvedValueOnce({
      token: 'mfa-token',
      user: { userId: 'u5', email: 'mfa@b.com', displayName: 'MFA', reliabilityScore: 80, gamesCount: 3 },
    });

    renderWithProvider(<TestConsumer />);
    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));

    await act(async () => {
      screen.getByRole('button', { name: 'doVerifyMfa' }).click();
    });

    expect(mockedAuthApi.verifyMfa).toHaveBeenCalledWith({ email: 'a@b.com', code: '123456' });
    expect(mockedSetAuthToken).toHaveBeenCalledWith('mfa-token');
    await waitFor(() => expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true'));
    expect(screen.getByTestId('userEmail')).toHaveTextContent('mfa@b.com');
  });

  it('verifyMfa failure with ApiError: sets error message', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null);
    const err = new (ApiError as any)('Invalid MFA code', 401);
    mockedAuthApi.verifyMfa.mockRejectedValueOnce(err);

    renderWithProvider(<TestConsumer />);
    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));

    await act(async () => {
      screen.getByRole('button', { name: 'doVerifyMfa' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Invalid MFA code'));
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
  });

  it('verifyMfa failure with non-ApiError: sets generic message', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null);
    mockedAuthApi.verifyMfa.mockRejectedValueOnce(new Error('network'));

    renderWithProvider(<TestConsumer />);
    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));

    await act(async () => {
      screen.getByRole('button', { name: 'doVerifyMfa' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('MFA verification failed. Please try again.'));
  });

  it('register failure with non-ApiError: sets generic message', async () => {
    mockedGetAuthToken.mockReturnValueOnce(null);
    mockedAuthApi.register.mockRejectedValueOnce(new Error('network'));

    function RegisterCatcher() {
      const { error, register } = useAuth();
      return (
        <div>
          <div data-testid="err">{error ?? ''}</div>
          <button
            type="button"
            onClick={async () => {
              try { await register('r@b.com', 'pw', 'Reg', true, true); } catch {}
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

    await waitFor(() => expect(screen.getByTestId('err')).toHaveTextContent('Registration failed. Please try again.'));
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
});
