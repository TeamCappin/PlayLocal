// __tests__/components/PlayerSearch.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PlayerSearch } from "@/components/PlayerSearch";
import { usersApi, friendsApi } from "@/lib/api";

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    // Render as a normal anchor so we can assert hrefs easily.
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

jest.mock("lucide-react", () => {
  // Make icons render as simple SVGs so they don't crash tests
  const Icon = (props: any) => <svg data-testid="icon" {...props} />;
  return {
    Search: Icon,
    MapPin: Icon,
    Star: Icon,
    UserPlus: Icon,
    Filter: Icon,
    Loader2: Icon,
    CheckCircle: Icon,
    UserCheck: Icon,
    Clock: Icon,
  };
});

jest.mock("@/lib/api", () => ({
  usersApi: {
    search: jest.fn(),
  },
  friendsApi: {
    getFriends: jest.fn(),
    sendRequest: jest.fn(),
  },
}));

type UserDto = {
  userId: string;
  displayName: string;
  location?: string;
  bio?: string;
  reliabilityScore?: number;
  gamesCount?: number;
  defaultIntensity?: "competitive" | "casual" | "balanced";
};

type FriendInfo = {
  friendshipId: string;
  friendUserId: string;
  displayName: string;
  status: "PENDING" | "ACCEPTED" | string;
  reliabilityScore: number;
  gamesCount: number;
  createdAt: string;
};

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mockUsersApi = usersApi as unknown as { search: jest.Mock };
const mockFriendsApi = friendsApi as unknown as {
  getFriends: jest.Mock;
  sendRequest: jest.Mock;
};

describe("PlayerSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("initial load: fetches friends list + searches players, then renders cards with correct friend status", async () => {
    // Arrange
    const players: UserDto[] = [
      {
        userId: "u2",
        displayName: "Alice",
        location: "Montreal",
        reliabilityScore: 88,
        gamesCount: 12,
        defaultIntensity: "casual",
      },
      {
        userId: "u3",
        displayName: "Bob",
        reliabilityScore: 70,
        gamesCount: 3,
      },
    ];

    const friends: FriendInfo[] = [
      {
        friendshipId: "f-1",
        friendUserId: "u2",
        displayName: "Alice",
        status: "ACCEPTED",
        reliabilityScore: 88,
        gamesCount: 12,
        createdAt: new Date().toISOString(),
      },
    ];

    mockFriendsApi.getFriends.mockResolvedValue({
      friends,
      pendingSent: [],
      pendingReceived: [],
    });

    mockUsersApi.search.mockResolvedValue({ users: players });

    // Act
    render(<PlayerSearch />);

    // Assert (API calls)
    await waitFor(() => {
      expect(mockFriendsApi.getFriends).toHaveBeenCalledTimes(1);
      expect(mockUsersApi.search).toHaveBeenCalledWith("", 0, 50);
    });

    // Assert (UI)
    expect(screen.getByText("Find Players")).toBeInTheDocument();
  });

  test("renders 'Request Received' link when pendingReceived contains that user", async () => {
    // Arrange
    const players: UserDto[] = [{ userId: "u3", displayName: "Bob" }];

    mockFriendsApi.getFriends.mockResolvedValue({
      friends: [],
      pendingSent: [],
      pendingReceived: [
        {
          friendshipId: "fr-99",
          friendUserId: "u3",
          displayName: "Bob",
          status: "PENDING",
          reliabilityScore: 0,
          gamesCount: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    mockUsersApi.search.mockResolvedValue({ users: players });

    // Act
    render(<PlayerSearch />);

    // Assert
    await waitFor(() => expect(screen.getByText("Bob")).toBeInTheDocument());

    const link = screen.getByText("Request Received").closest("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/friends");
  });

  test("add friend success: clicking 'Add Friend' calls sendRequest and updates UI to 'Request Sent'", async () => {
    // Arrange
    const players: UserDto[] = [{ userId: "u4", displayName: "Charlie" }];

    mockFriendsApi.getFriends.mockResolvedValue({
      friends: [],
      pendingSent: [],
      pendingReceived: [],
    });

    mockUsersApi.search.mockResolvedValue({ users: players });

    const d = deferred<{ friendshipId: string }>();
    mockFriendsApi.sendRequest.mockReturnValue(d.promise);

    // Act
    render(<PlayerSearch />);

    await waitFor(() => expect(screen.getByText("Charlie")).toBeInTheDocument());

    const addBtn = screen.getByRole("button", { name: /add friend/i });

    fireEvent.click(addBtn);

    // Assert (request started)
    expect(mockFriendsApi.sendRequest).toHaveBeenCalledWith("u4");
    expect(addBtn).toBeDisabled();

    // Resolve request
    await act(async () => {
      d.resolve({ friendshipId: "fs-1" });
      await d.promise;
    });

    // Assert (UI updated)
    await waitFor(() => {
      expect(screen.getByText("Request Sent")).toBeInTheDocument();
    });
  });

  test("debounced search: typing waits 300ms before calling usersApi.search(query)", async () => {
    jest.useFakeTimers();

    // Arrange
    mockFriendsApi.getFriends.mockResolvedValue({
      friends: [],
      pendingSent: [],
      pendingReceived: [],
    });

    // initial search
    mockUsersApi.search.mockResolvedValue({ users: [] });

    // Act
    render(<PlayerSearch />);

    // Let initial load complete
    await waitFor(() => expect(mockUsersApi.search).toHaveBeenCalledWith("", 0, 50));
    mockUsersApi.search.mockClear();

    const input = screen.getByPlaceholderText("Search by name...");

    fireEvent.change(input, { target: { value: "jo" } });

    // Not yet (debounce)
    expect(mockUsersApi.search).not.toHaveBeenCalled();

    // Advance time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Assert
    await waitFor(() => {
      expect(mockUsersApi.search).toHaveBeenCalledWith("jo", 0, 50);
    });

    jest.useRealTimers();
  });

  test("add friend network error: shows friendly connection error message", async () => {
    // Arrange
    const players: UserDto[] = [{ userId: "u5", displayName: "Dina" }];

    mockFriendsApi.getFriends.mockResolvedValue({
      friends: [],
      pendingSent: [],
      pendingReceived: [],
    });

    mockUsersApi.search.mockResolvedValue({ users: players });

    mockFriendsApi.sendRequest.mockRejectedValue({
      status: 0,
      message: "Network error",
    });

    // Act
    render(<PlayerSearch />);

    await waitFor(() => expect(screen.getByText("Dina")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /add friend/i }));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText("Unable to connect to server. Please check your connection.")
      ).toBeInTheDocument();
    });
  });

  test("duplicate request error: shows 'already exists' message and refreshes friends list", async () => {
    // Arrange
    const players: UserDto[] = [{ userId: "u6", displayName: "Eve" }];

    mockFriendsApi.getFriends
      .mockResolvedValueOnce({
        friends: [],
        pendingSent: [],
        pendingReceived: [],
      })
      // refresh call after duplicate error
      .mockResolvedValueOnce({
        friends: [],
        pendingSent: [
          {
            friendshipId: "dup-1",
            friendUserId: "u6",
            displayName: "Eve",
            status: "PENDING",
            reliabilityScore: 0,
            gamesCount: 0,
            createdAt: new Date().toISOString(),
          },
        ],
        pendingReceived: [],
      });

    mockUsersApi.search.mockResolvedValue({ users: players });

    mockFriendsApi.sendRequest.mockRejectedValue({
      data: { message: "Friend request already exists" },
    });

    // Act
    render(<PlayerSearch />);

    await waitFor(() => expect(screen.getByText("Eve")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /add friend/i }));

    // Assert (message + refresh)
    await waitFor(() => {
      expect(
        screen.getByText("A friend request already exists with this user")
      ).toBeInTheDocument();
    });

    expect(mockFriendsApi.getFriends).toHaveBeenCalledTimes(2);
  });

  test("dismiss error button clears the error banner", async () => {
    // Arrange
    const players: UserDto[] = [{ userId: "u7", displayName: "Frank" }];

    mockFriendsApi.getFriends.mockResolvedValue({
      friends: [],
      pendingSent: [],
      pendingReceived: [],
    });

    mockUsersApi.search.mockResolvedValue({ users: players });

    mockFriendsApi.sendRequest.mockRejectedValue("Some error");

    // Act
    render(<PlayerSearch />);

    await waitFor(() => expect(screen.getByText("Frank")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /add friend/i }));

    // Assert error appears
    await waitFor(() => {
      expect(screen.getByText("Some error")).toBeInTheDocument();
    });

    // Dismiss
    fireEvent.click(screen.getByRole("button", { name: "Dismiss error" }));

    // Assert removed
    expect(screen.queryByText("Some error")).not.toBeInTheDocument();
  });

  test("prevents duplicate requests: does not call sendRequest when already friend / pending", async () => {
    // Arrange
    const players: UserDto[] = [
      { userId: "u8", displayName: "Grace" },
      { userId: "u9", displayName: "Henry" },
    ];

    mockFriendsApi.getFriends.mockResolvedValue({
      friends: [
        {
          friendshipId: "f-8",
          friendUserId: "u8",
          displayName: "Grace",
          status: "ACCEPTED",
          reliabilityScore: 0,
          gamesCount: 0,
          createdAt: new Date().toISOString(),
        },
      ],
      pendingSent: [
        {
          friendshipId: "ps-9",
          friendUserId: "u9",
          displayName: "Henry",
          status: "PENDING",
          reliabilityScore: 0,
          gamesCount: 0,
          createdAt: new Date().toISOString(),
        },
      ],
      pendingReceived: [],
    });

    mockUsersApi.search.mockResolvedValue({ users: players });

    // Act
    render(<PlayerSearch />);

    await waitFor(() => expect(screen.getByText("Grace")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Henry")).toBeInTheDocument());

    // Grace is friend => no "Add Friend" button for her (it shows "Already Friends")
    expect(screen.getByText("Already Friends")).toBeInTheDocument();

    // Henry is pendingSent => should render disabled state "Request Sent" (button)
    expect(screen.getByText("Request Sent")).toBeInTheDocument();

    // Try clicking "Request Sent" (should be disabled)
    const requestSentBtn = screen.getByRole("button", { name: /request sent/i });
    expect(requestSentBtn).toBeDisabled();
    fireEvent.click(requestSentBtn);

    // Assert
    expect(mockFriendsApi.sendRequest).not.toHaveBeenCalled();
  });
});
