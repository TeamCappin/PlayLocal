import { renderHook, waitFor } from "@testing-library/react";
import { useNotifications } from "./useNotifications";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

jest.mock("@/lib/api", () => ({
  notificationsApi: {
    getAll: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  },
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetAll = notificationsApi.getAll as jest.MockedFunction<
  typeof notificationsApi.getAll
>;
const mockGetUnreadCount = notificationsApi.getUnreadCount as jest.MockedFunction<
  typeof notificationsApi.getUnreadCount
>;

describe("useNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps backend game_cancelled notification to UI fields", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: "n1",
        type: "game_cancelled",
        payload:
          '{"gameId":"g1","gameTitle":"Sunday Soccer","message":"Game cancelled: Sunday Soccer"}',
        status: "SENT",
        scheduledFor: "2026-02-08T10:00:00Z",
        sentAt: "2026-02-08T10:00:01Z",
      },
    ]);
    mockGetUnreadCount.mockResolvedValue({ count: 1 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      notificationId: "n1",
      type: "GAME_CANCELLED",
      title: "Game cancelled",
      message: "Game cancelled: Sunday Soccer",
      createdAt: "2026-02-08T10:00:01Z",
      read: false,
      link: "/games/g1",
    });
    expect(result.current.unreadCount).toBe(1);
  });

  it("falls back safely for invalid payload and read status", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    mockGetAll.mockResolvedValue([
      {
        notificationId: "n2",
        type: "attendance_prompt",
        payload: "not-json",
        status: "READ",
        scheduledFor: "2026-02-08T11:00:00Z",
      },
    ]);
    mockGetUnreadCount.mockResolvedValue({ count: 0 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications[0]).toMatchObject({
      notificationId: "n2",
      type: "ATTENDANCE_PROMPT",
      title: "Attendance reminder",
      message: "Attendance reminder",
      createdAt: "2026-02-08T11:00:00Z",
      read: true,
    });
    expect(result.current.unreadCount).toBe(0);
  });
});
