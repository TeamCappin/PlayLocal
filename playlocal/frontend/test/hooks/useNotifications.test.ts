import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

jest.mock('@/lib/api', () => ({
  notificationsApi: {
    getAll: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetAll = notificationsApi.getAll as jest.MockedFunction<
  typeof notificationsApi.getAll
>;

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps backend game_cancelled notification to UI fields', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'game_cancelled',
        payload:
          '{"gameId":"g1","gameTitle":"Sunday Soccer","message":"Game cancelled: Sunday Soccer"}',
        status: 'SENT',
        scheduledFor: '2026-02-08T10:00:00Z',
        sentAt: '2026-02-08T10:00:01Z',
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      notificationId: 'n1',
      type: 'GAME_CANCELLED',
      title: 'Game cancelled',
      message: 'Game cancelled: Sunday Soccer',
      createdAt: '2026-02-08T10:00:01Z',
      read: false,
      link: '/games/g1',
    });
    expect(result.current.unreadCount).toBe(1);
  });

  it('dedupes equivalent cancellation notifications with different legacy messages', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'GAME_CANCELLED',
        payload:
          '{"gameId":"g1","gameTitle":"Sunday Soccer","message":"Game cancelled: Sunday Soccer"}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:00Z',
      },
      {
        notificationId: 'n2',
        type: 'GAME_CANCELLED',
        payload:
          '{"gameId":"g1","gameTitle":"Sunday Soccer","message":"The game \\"Sunday Soccer\\" has been cancelled by the organizer."}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:01Z',
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].notificationId).toBe('n2');
    expect(result.current.unreadCount).toBe(1);
  });

  it("maps GAME_UPDATED notification to 'Game updated' title", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'GAME_UPDATED',
        payload: '{"gameId":"g1","gameTitle":"Basketball"}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications[0].title).toBe('Game updated');
  });

  it("maps GAME_REMOVED_REQUIREMENTS notification to 'Removed from game' title", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'GAME_REMOVED_REQUIREMENTS',
        payload: '{}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications[0].title).toBe('Removed from game');
  });

  it('maps WAITLIST_PROMOTED and GAME_STARTING_SOON to user-friendly titles', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'WAITLIST_PROMOTED',
        payload: '{}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:00Z',
      },
      {
        notificationId: 'n2',
        type: 'GAME_STARTING_SOON',
        payload: '{}',
        status: 'SENT',
        sentAt: '2026-02-08T11:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(
      result.current.notifications.find(
        (notification) => notification.type === 'WAITLIST_PROMOTED'
      )?.title
    ).toBe('Spot confirmed');
    expect(
      result.current.notifications.find(
        (notification) => notification.type === 'GAME_STARTING_SOON'
      )?.title
    ).toBe('Game starting soon');
  });

  it('maps ATTENDANCE_CONFIRMATION and humanizes unknown types', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'ATTENDANCE_CONFIRMATION',
        payload: '{}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:00Z',
      },
      {
        notificationId: 'n2',
        type: 'NEW_BADGE_UNLOCKED',
        payload: '{}',
        status: 'SENT',
        sentAt: '2026-02-08T11:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(
      result.current.notifications.find(
        (notification) => notification.type === 'ATTENDANCE_CONFIRMATION'
      )?.title
    ).toBe('Attendance confirmation needed');
    expect(
      result.current.notifications.find(
        (notification) => notification.type === 'NEW_BADGE_UNLOCKED'
      )?.title
    ).toBe('New Badge Unlocked');
  });

  it('markAsRead dispatches playlocal-refresh-notifications event on success', async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'GAME_CANCELLED',
        payload: '{}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:00Z',
      },
    ]);
    (notificationsApi.markAsRead as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'playlocal-refresh-notifications' })
    );

    dispatchSpy.mockRestore();
  });

  it('markAllAsRead dispatches playlocal-refresh-notifications event on success', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([]);
    (notificationsApi.markAllAsRead as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'playlocal-refresh-notifications' })
    );

    dispatchSpy.mockRestore();
  });

  it('falls back safely for invalid payload and read status', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n2',
        type: 'attendance_prompt',
        payload: 'not-json',
        status: 'READ',
        scheduledFor: '2026-02-08T11:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications[0]).toMatchObject({
      notificationId: 'n2',
      type: 'ATTENDANCE_PROMPT',
      title: 'Attendance confirmation needed',
      message: 'Attendance confirmation needed',
      createdAt: '2026-02-08T11:00:00Z',
      read: true,
    });
    expect(result.current.unreadCount).toBe(0);
  });

  it('warns for malformed payload field types and falls back safely', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n3',
        type: 'GAME_CANCELLED',
        payload:
          '{"title":123,"message":456,"link":789,"gameId":111,"gameTitle":"Soccer"}',
        status: 'SENT',
        sentAt: '2026-02-08T11:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(warnSpy).toHaveBeenCalledTimes(4);
    expect(result.current.notifications[0]).toMatchObject({
      title: 'Game cancelled',
      message: 'Update for Soccer',
      link: undefined,
    });

    warnSpy.mockRestore();
  });

  it('handles fetch failure and exposes error state', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load notifications');
    expect(errorSpy).toHaveBeenCalledWith(
      'Error fetching notifications:',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });

  it('clears notifications when authentication becomes false', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'GAME_CANCELLED',
        payload: '{}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:00Z',
      },
    ]);

    const { result, rerender } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    mockUseAuth.mockReturnValue({ isAuthenticated: false } as any);
    rerender();

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(0);
    });
    expect(result.current.unreadCount).toBe(0);
  });

  it('logs markAsRead failures without crashing state', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'GAME_CANCELLED',
        payload: '{}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:00Z',
      },
    ]);
    (notificationsApi.markAsRead as jest.Mock).mockRejectedValue(
      new Error('mark failed')
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(errorSpy).toHaveBeenCalledWith(
      'Error marking notification as read:',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });

  it('logs markAllAsRead failures without crashing state', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: 'n1',
        type: 'GAME_CANCELLED',
        payload: '{}',
        status: 'SENT',
        sentAt: '2026-02-08T10:00:00Z',
      },
    ]);
    (notificationsApi.markAllAsRead as jest.Mock).mockRejectedValue(
      new Error('mark all failed')
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(errorSpy).toHaveBeenCalledWith(
      'Error marking all notifications as read:',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });
});
