import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  authApi,
  UserDto,
  setAuthToken,
  getAuthToken,
  ApiError,
} from '@/lib/api';

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<{ mfaRequired?: boolean }>;
  verifyMfa: (email: string, code: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    ageConfirmed: boolean,
    eulaAccepted: boolean,
    captchaToken?: string
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  /** Retry initial auth check after a failure (e.g. network error). AC6. */
  retryAuthCheck: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount (AC6: set error on failure so UI can show retry)
  const checkAuth = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setAuthToken(null);
          setUser(null);
          setError(null);
        } else {
          setUser(null);
          setError(
            err instanceof ApiError
              ? err.message
              : 'Something went wrong. Please try again.'
          );
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const retryAuthCheck = async () => {
    setError(null);
    setIsLoading(true);
    const token = getAuthToken();
    if (token) {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setAuthToken(null);
          setUser(null);
          setError(null);
        } else {
          setUser(null);
          setError(
            err instanceof ApiError
              ? err.message
              : 'Something went wrong. Please try again.'
          );
        }
      }
    }
    setIsLoading(false);
  };

  const login = async (
    email: string,
    password: string,
    captchaToken?: string
  ): Promise<{ mfaRequired?: boolean }> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password, captchaToken });
      if (response.mfaRequired) {
        return { mfaRequired: true };
      }
      setAuthToken(response.token);
      setUser(response.user);
      return {};
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfa = async (email: string, code: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.verifyMfa({ email, code });
      setAuthToken(response.token);
      setUser(response.user);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('MFA verification failed. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    ageConfirmed: boolean,
    eulaAccepted: boolean,
    captchaToken?: string
  ) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.register({
        email,
        password,
        displayName,
        ageConfirmed,
        eulaAccepted,
        captchaToken,
      });
      setAuthToken(response.token);
      setUser(response.user);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (err) {
        // Token expired or invalid
        setAuthToken(null);
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyMfa,
        register,
        logout,
        refreshUser,
        retryAuthCheck,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
