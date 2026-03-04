import { renderHook, waitFor } from '@testing-library/react';
import {
  useProfile,
  useCurrentUser,
  type UserProfileData,
} from '@/hooks/useProfile'; // adjust path if needed
import api from '@/lib/api';

jest.mock('@/lib/api', () => {
  return {
    __esModule: true,
    default: {
      auth: {
        getCurrentUser: jest.fn(),
      },
    },
  };
});

const mockedApi = api as unknown as {
  auth: {
    getCurrentUser: jest.Mock;
  };
};

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches current user's profile when usernameOrId is not provided (success)", async () => {
    const mockUser: UserProfileData = {
      userId: 'u1',
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/a.png',
      reliabilityScore: 90,
      gamesCount: 12,
    };

    mockedApi.auth.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useProfile());

    // initial state
    expect(result.current.profile).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedApi.auth.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(result.current.profile).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it("sets error when fetching current user's profile fails", async () => {
    mockedApi.auth.getCurrentUser.mockRejectedValueOnce(new Error('Boom'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedApi.auth.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBe('Boom');
  });

  it('uses fallback error message if thrown error has no message', async () => {
    mockedApi.auth.getCurrentUser.mockRejectedValueOnce({});

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBe('Failed to load profile');
  });

  it('when usernameOrId is provided, it does not call API and returns demo state (profile=null, loading=false)', async () => {
    const { result } = renderHook(() => useProfile('some-user'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedApi.auth.getCurrentUser).not.toHaveBeenCalled();
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('refetches when usernameOrId changes from defined -> undefined (calls API then)', async () => {
    const mockUser: UserProfileData = {
      userId: 'u2',
      email: 'u2@example.com',
      displayName: 'User Two',
      reliabilityScore: 80,
      gamesCount: 3,
    };

    mockedApi.auth.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { result, rerender } = renderHook(
      ({ id }: { id?: string }) => useProfile(id),
      { initialProps: { id: 'someone' } }
    );

    // initial: id provided => no API, loading resolves false
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockedApi.auth.getCurrentUser).not.toHaveBeenCalled();
    expect(result.current.profile).toBeNull();

    // change to undefined => should call API and load current user
    rerender({ id: undefined });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedApi.auth.getCurrentUser).toHaveBeenCalledTimes(1);

    expect(result.current.error).toBeNull();
  });
});

describe('useCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches current user (success)', async () => {
    const mockUser: UserProfileData = {
      userId: 'me',
      email: 'me@example.com',
      displayName: 'Me',
      reliabilityScore: 95,
      gamesCount: 20,
    };

    mockedApi.auth.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull(); // never set in hook

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedApi.auth.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('sets user to null when not logged in / token expired (failure)', async () => {
    mockedApi.auth.getCurrentUser.mockRejectedValueOnce(new Error('401'));

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedApi.auth.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull(); // hook doesn't set error
  });
});
