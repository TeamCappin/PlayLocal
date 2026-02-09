import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FriendsPage } from "@/components/FriendsPage"; // ✅ adjust path if needed

// --------------------
// Mocks
// --------------------
jest.mock("next/link", () => {
  // simple anchor wrapper so RTL can click links
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock("lucide-react", () => {
  const Icon = (name: string) => (props: any) => <svg data-testid={name} {...props} />;
  return {
    UserPlus: Icon("UserPlus"),
    Users: Icon("Users"),
    Clock: Icon("Clock"),
    CheckCircle: Icon("CheckCircle"),
    X: Icon("X"),
    UserX: Icon("UserX"),
    MapPin: Icon("MapPin"),
    Star: Icon("Star"),
    Loader2: Icon("Loader2"),
  };
});

const getFriendsMock = jest.fn();
const acceptRequestMock = jest.fn();
const declineRequestMock = jest.fn();
const removeFriendMock = jest.fn();

jest.mock("@/lib/api", () => ({
  friendsApi: {
    getFriends: () => getFriendsMock(),
    acceptRequest: (id: string) => acceptRequestMock(id),
    declineRequest: (id: string) => declineRequestMock(id),
    removeFriend: (id: string) => removeFriendMock(id),
  },
}));


function friend(overrides: Partial<any> = {}) {
  return {
    friendshipId: overrides.friendshipId ?? "fr-1",
    friendUserId: overrides.friendUserId ?? "u-1",
    displayName: overrides.displayName ?? "Alice",
    location: overrides.location ?? "Montreal",
    reliabilityScore: overrides.reliabilityScore ?? 90,
    gamesCount: overrides.gamesCount ?? 12,
    status: overrides.status ?? "ACCEPTED",
    ...overrides,
  };
}

function received(overrides: Partial<any> = {}) {
  return friend({
    friendshipId: overrides.friendshipId ?? "pr-1",
    friendUserId: overrides.friendUserId ?? "u-2",
    displayName: overrides.displayName ?? "Bob",
    location: overrides.location ?? "Laval",
    status: "PENDING_RECEIVED",
    ...overrides,
  });
}

function sent(overrides: Partial<any> = {}) {
  return friend({
    friendshipId: overrides.friendshipId ?? "ps-1",
    friendUserId: overrides.friendUserId ?? "u-3",
    displayName: overrides.displayName ?? "Charlie",
    location: overrides.location ?? "Brossard",
    status: "PENDING_SENT",
    ...overrides,
  });
}

async function goToRequestsTab() {
  fireEvent.click(screen.getByRole("button", { name: /requests/i }));
  // requests tab renders "Pending Requests" or "Sent Requests" or empty state
  await waitFor(() => {
    expect(screen.getByText(/requests/i)).toBeInTheDocument();
  });
}

async function goToFriendsTab() {
  fireEvent.click(screen.getByRole("button", { name: /^friends$/i }));
  await waitFor(() => {
    expect(screen.getByText(/^friends$/i)).toBeInTheDocument();
  });
}

async function goToBlockedTab() {
  fireEvent.click(screen.getByRole("button", { name: /blocked/i }));
  await waitFor(() => {
    expect(screen.getByText(/no blocked users/i)).toBeInTheDocument();
  });
}

describe("FriendsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading spinner initially", async () => {
    // keep promise pending to observe loading UI
    getFriendsMock.mockReturnValue(new Promise(() => {}));

    render(<FriendsPage />);

    expect(screen.getByTestId("Loader2")).toBeInTheDocument();
  });

  it("shows error banner if fetching friends fails", async () => {
    getFriendsMock.mockRejectedValue(new Error("Network down"));

    render(<FriendsPage />);

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });

 
});
