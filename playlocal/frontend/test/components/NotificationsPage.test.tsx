// __tests__/NotificationsPage.test.tsx
import React from "react";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { NotificationsPage } from "@/components/NotificationsPage";

// --------------------
// Mocks
// --------------------
jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock("lucide-react", () => {
  const Icon = (name: string) => (props: any) => <svg data-testid={name} {...props} />;
  return {
    Bell: Icon("Bell"),
    CheckCircle: Icon("CheckCircle"),
    X: Icon("X"),
    Calendar: Icon("Calendar"),
    Users: Icon("Users"),
    MessageCircle: Icon("MessageCircle"),
    Award: Icon("Award"),
    UserPlus: Icon("UserPlus"),
    AlertCircle: Icon("AlertCircle"),
    TrendingUp: Icon("TrendingUp"),
    Filter: Icon("Filter"),
    Loader2: Icon("Loader2"),
  };
});

jest.mock("@/hooks/useNotifications", () => ({
  useNotifications: jest.fn(),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";

const useNotificationsMock = useNotifications as unknown as jest.Mock;
const useAuthMock = useAuth as unknown as jest.Mock;

type Notif = {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
};

function makeNotifs(nowIso: string): Notif[] {
  // Keep timestamps deterministic; formatTime depends on Date.now()
  const now = new Date(nowIso).getTime();
  return [
    {
      notificationId: "n1",
      type: "GAME_REMINDER",
      title: "Game starting soon",
      message: "Starts in 2 hours",
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      link: "/games/1",
    },
    {
      notificationId: "n2",
      type: "FRIEND_REQUEST",
      title: "New friend request",
      message: "Alex sent you a request",
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      read: false,
      link: "/friends",
    },
    {
      notificationId: "n3",
      type: "MESSAGE",
      title: "New message",
      message: "Hello!",
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      link: "/games/1",
    },
  ];
}

function setup({
  isAuthenticated = true,
  isLoading = false,
  notifications = makeNotifs("2026-02-09T12:00:00.000Z"),
  markAsReadImpl,
  markAllAsReadImpl,
}: {
  isAuthenticated?: boolean;
  isLoading?: boolean;
  notifications?: Notif[];
  markAsReadImpl?: (id: string) => Promise<any>;
  markAllAsReadImpl?: () => Promise<any>;
} = {}) {
  const markAsRead = jest.fn(markAsReadImpl ?? (() => Promise.resolve()));
  const markAllAsRead = jest.fn(markAllAsReadImpl ?? (() => Promise.resolve()));

  useAuthMock.mockReturnValue({ isAuthenticated });

  useNotificationsMock.mockReturnValue({
    notifications,
    unreadCount: 999, // component does NOT use apiUnreadCount; included to ensure tests don't depend on it
    isLoading,
    markAsRead,
    markAllAsRead,
  });

  return { markAsRead, markAllAsRead };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-02-09T12:00:00.000Z"));
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("NotificationsPage", () => {
  test("renders sign-in gate when not authenticated", () => {
    setup({ isAuthenticated: false });

    render(<NotificationsPage />);

    expect(screen.getByText("Sign in to view notifications")).toBeInTheDocument();
    const signIn = screen.getByRole("link", { name: "Sign In" });
    expect(signIn).toHaveAttribute("href", "/login");
  });

  test("shows loading state when isLoading=true", () => {
    setup({ isAuthenticated: true, isLoading: true });

    render(<NotificationsPage />);

    expect(screen.getByText("Loading notifications...")).toBeInTheDocument();
    expect(screen.getByTestId("Loader2")).toBeInTheDocument();
  });

  test("renders notifications list and header unread count", () => {
    setup();

    render(<NotificationsPage />);

    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();

    // We have 2 unread in makeNotifs()
    expect(screen.getByText("2 unread notifications")).toBeInTheDocument();

    // Items
    expect(screen.getByText("Game starting soon")).toBeInTheDocument();
    expect(screen.getByText("New friend request")).toBeInTheDocument();
    expect(screen.getByText("New message")).toBeInTheDocument();

    // "Mark all as read" visible when unreadCount > 0
    expect(screen.getByRole("button", { name: /Mark all as read/i })).toBeInTheDocument();

    // Filter tab counts reflect dismissed+unread logic
    expect(screen.getByRole("button", { name: /All \(3\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Unread \(2\)/i })).toBeInTheDocument();
  });

  test("filters to unread when clicking Unread tab", () => {
    setup();

    render(<NotificationsPage />);

    fireEvent.click(screen.getByRole("button", { name: /Unread \(2\)/i }));

    // Only unread remain
    expect(screen.getByText("Game starting soon")).toBeInTheDocument();
    expect(screen.getByText("New friend request")).toBeInTheDocument();

    // Read item hidden
    expect(screen.queryByText("New message")).not.toBeInTheDocument();
  });

  test("mark as read calls API and updates UI (removes unread indicator + mark button)", async () => {
    const { markAsRead } = setup();

    render(<NotificationsPage />);

    const itemTitle = screen.getByText("Game starting soon");
    const itemRoot = itemTitle.closest("div")!; // inside NotificationItem
    // Mark as read button has title="Mark as read"
    const markBtn = within(itemRoot).getByTitle("Mark as read");
    fireEvent.click(markBtn);

    expect(markAsRead).toHaveBeenCalledWith("n1");

    // After local update, mark button should disappear for that item
    await waitFor(() => {
      expect(within(itemRoot).queryByTitle("Mark as read")).not.toBeInTheDocument();
    });

    // Header count should drop from 2 unread -> 1 unread
    expect(screen.getByText("1 unread notification")).toBeInTheDocument();
  });

  test("mark as read keeps local update even if API fails", async () => {
    setup({
      markAsReadImpl: () => Promise.reject(new Error("network")),
    });

    render(<NotificationsPage />);

    const itemTitle = screen.getByText("New friend request");
    const itemRoot = itemTitle.closest("div")!;
    const markBtn = within(itemRoot).getByTitle("Mark as read");

    fireEvent.click(markBtn);

    // Even though API rejects, UI should still show as read (mark button disappears)
    await waitFor(() => {
      expect(within(itemRoot).queryByTitle("Mark as read")).not.toBeInTheDocument();
    });

    // Unread count goes from 2 -> 1
    expect(screen.getByText("1 unread notification")).toBeInTheDocument();
  });

  test("mark all as read calls API and updates all items locally", async () => {
    const { markAllAsRead } = setup();

    render(<NotificationsPage />);

    const markAllBtn = screen.getByRole("button", { name: /Mark all as read/i });
    fireEvent.click(markAllBtn);

    expect(markAllAsRead).toHaveBeenCalledTimes(1);

    // Header should become all caught up
    await waitFor(() => {
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });

    // "Mark all as read" button should disappear when unreadCount becomes 0
    expect(screen.queryByRole("button", { name: /Mark all as read/i })).not.toBeInTheDocument();

    // Unread tab should show Unread (0)
    expect(screen.getByRole("button", { name: /Unread \(0\)/i })).toBeInTheDocument();
  });

  test("mark all as read keeps local update even if API fails", async () => {
    setup({
      markAllAsReadImpl: () => Promise.reject(new Error("timeout")),
    });

    render(<NotificationsPage />);

    fireEvent.click(screen.getByRole("button", { name: /Mark all as read/i }));

    await waitFor(() => {
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });
  });

  test("dismiss removes item from list and updates counts", async () => {
    setup();

    render(<NotificationsPage />);

    // Dismiss an unread item
    const itemTitle = screen.getByText("Game starting soon");
    const itemRoot = itemTitle.closest("div")!;
    const dismissBtn = within(itemRoot).getByTitle("Dismiss");
    fireEvent.click(dismissBtn);

    // Item disappears
    await waitFor(() => {
      expect(screen.queryByText("Game starting soon")).not.toBeInTheDocument();
    });

    // Counts: total goes 3 -> 2, unread goes 2 -> 1
    expect(screen.getByRole("button", { name: /All \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Unread \(1\)/i })).toBeInTheDocument();
    expect(screen.getByText("1 unread notification")).toBeInTheDocument();
  });

  test("shows empty state when no notifications (and not loading)", () => {
    setup({ notifications: [] });

    render(<NotificationsPage />);

    expect(screen.getByText("No notifications to show")).toBeInTheDocument();
    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mark all as read/i })).not.toBeInTheDocument();
  });

});
