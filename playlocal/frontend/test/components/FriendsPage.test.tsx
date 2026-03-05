import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { FriendsPage } from '@/components/FriendsPage';

jest.mock('next/link', () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock('lucide-react', () => {
  const Icon = (name: string) => (props: any) => (
    <svg data-testid={name} {...props} />
  );
  return {
    UserPlus: Icon('UserPlus'),
    Users: Icon('Users'),
    Clock: Icon('Clock'),
    CheckCircle: Icon('CheckCircle'),
    X: Icon('X'),
    UserX: Icon('UserX'),
    MapPin: Icon('MapPin'),
    Star: Icon('Star'),
    Loader2: Icon('Loader2'),
  };
});

const getFriendsMock = jest.fn();
const acceptRequestMock = jest.fn();
const declineRequestMock = jest.fn();
const removeFriendMock = jest.fn();

jest.mock('@/lib/api', () => ({
  friendsApi: {
    getFriends: () => getFriendsMock(),
    acceptRequest: (id: string) => acceptRequestMock(id),
    declineRequest: (id: string) => declineRequestMock(id),
    removeFriend: (id: string) => removeFriendMock(id),
  },
}));

function friend(overrides: Partial<any> = {}) {
  return {
    friendshipId: overrides.friendshipId ?? 'fr-1',
    friendUserId: overrides.friendUserId ?? 'u-1',
    displayName: overrides.displayName ?? 'Alice',
    location: overrides.location ?? 'Montreal',
    reliabilityScore: overrides.reliabilityScore ?? 90,
    gamesCount: overrides.gamesCount ?? 12,
    status: overrides.status ?? 'ACCEPTED',
    ...overrides,
  };
}

function received(overrides: Partial<any> = {}) {
  return friend({
    friendshipId: overrides.friendshipId ?? 'pr-1',
    friendUserId: overrides.friendUserId ?? 'u-2',
    displayName: overrides.displayName ?? 'Bob',
    location: overrides.location ?? 'Laval',
    status: 'PENDING_RECEIVED',
    ...overrides,
  });
}

function sent(overrides: Partial<any> = {}) {
  return friend({
    friendshipId: overrides.friendshipId ?? 'ps-1',
    friendUserId: overrides.friendUserId ?? 'u-3',
    displayName: overrides.displayName ?? 'Charlie',
    location: overrides.location ?? 'Brossard',
    status: 'PENDING_SENT',
    ...overrides,
  });
}

async function goToRequestsTab() {
  fireEvent.click(screen.getByRole('button', { name: /requests/i }));
  await waitFor(() => {
    // request tab contains the "Requests" label in the tab + sections/empty state
    expect(screen.getByText(/requests/i)).toBeInTheDocument();
  });
}

async function goToFriendsTab() {
  fireEvent.click(screen.getByRole('button', { name: /^friends$/i }));
  await waitFor(() => {
    // friends tab title exists in header
    expect(
      screen.getByRole('heading', { name: /friends/i })
    ).toBeInTheDocument();
  });
}

async function goToBlockedTab() {
  fireEvent.click(screen.getByRole('button', { name: /blocked/i }));
  await waitFor(() => {
    expect(screen.getByText(/no blocked users/i)).toBeInTheDocument();
  });
}

// Finds the closest ancestor that "looks like" a card containing the given name
function findCardContainerFromNamedLink(name: string) {
  const link = screen.getByRole('link', { name });
  let el: HTMLElement | null = link as HTMLElement;

  while (el) {
    const hasName = (el.textContent || '').includes(name);
    const hasProfileLink = !!el.querySelector('a[href^="/profile/"]');
    const hasAnyButton = el.querySelectorAll('button').length > 0;

    if (hasName && hasProfileLink && hasAnyButton) return el;

    el = el.parentElement;
  }

  throw new Error(`Could not find card container for "${name}"`);
}

describe('FriendsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner initially', async () => {
    // keep promise pending to observe loading UI
    getFriendsMock.mockReturnValue(new Promise(() => {}));

    render(<FriendsPage />);

    expect(screen.getByTestId('Loader2')).toBeInTheDocument();
  });

  it('shows error banner if fetching friends fails', async () => {
    getFriendsMock.mockRejectedValue(new Error('Network down'));

    render(<FriendsPage />);

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });

  it('renders header + quick links when data loads', async () => {
    getFriendsMock.mockResolvedValue({
      friends: [friend()],
      pendingReceived: [received()],
      pendingSent: [sent()],
    });

    render(<FriendsPage />);

    expect(
      await screen.findByRole('heading', { name: /friends/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/manage your connections and friend requests/i)
    ).toBeInTheDocument();

    const findPlayersCta = screen.getByRole('link', { name: /find players/i });
    expect(findPlayersCta).toHaveAttribute('href', '/players');

    expect(
      screen.getByRole('link', { name: /find new players/i })
    ).toHaveAttribute('href', '/players');
    expect(
      screen.getByRole('link', { name: /invite to game/i })
    ).toHaveAttribute('href', '/discover');
  });

  it('shows correct sidebar overview counts', async () => {
    getFriendsMock.mockResolvedValue({
      friends: [
        friend(),
        friend({ friendshipId: 'fr-2', displayName: 'Dana' }),
      ],
      pendingReceived: [received()],
      pendingSent: [sent(), sent({ friendshipId: 'ps-2', displayName: 'Eli' })],
    });

    render(<FriendsPage />);

    await screen.findByRole('heading', { name: /friends/i });
    expect(screen.getByText('Pending Requests')).toBeInTheDocument();

    expect(screen.getByText('Sent Requests')).toBeInTheDocument();
    // There are multiple "2" on the page potentially; scope to the Overview box
    const overviewBox = screen.getByText('Overview').closest('div')!;
    expect(within(overviewBox).getAllByText('2').length).toBeGreaterThan(0);
  });

  it('renders a friend card with profile link + details', async () => {
    getFriendsMock.mockResolvedValue({
      friends: [
        friend({
          displayName: 'Alice',
          friendUserId: 'u-1',
          location: 'Montreal',
          reliabilityScore: 88,
          gamesCount: 7,
        }),
      ],
      pendingReceived: [],
      pendingSent: [],
    });

    render(<FriendsPage />);

    await screen.findByRole('heading', { name: /friends/i });

    const profileLink = screen.getByRole('link', { name: 'Alice' });
    expect(profileLink).toHaveAttribute('href', '/profile/u-1');

    expect(screen.getByText(/montreal/i)).toBeInTheDocument();
    expect(screen.getByText(/88%/i)).toBeInTheDocument();
    expect(screen.getByText(/7 games/i)).toBeInTheDocument();
  });

  it('switches to Blocked tab and shows empty state', async () => {
    getFriendsMock.mockResolvedValue({
      friends: [friend()],
      pendingReceived: [],
      pendingSent: [],
    });

    render(<FriendsPage />);
    await screen.findByRole('heading', { name: /friends/i });

    await goToBlockedTab();

    expect(screen.getByText(/no blocked users/i)).toBeInTheDocument();
    expect(screen.getByTestId('UserX')).toBeInTheDocument();
  });

  it('removes a friend from the friends list', async () => {
    getFriendsMock.mockResolvedValue({
      friends: [friend({ friendshipId: 'fr-7', displayName: 'Alice' })],
      pendingReceived: [],
      pendingSent: [],
    });
    removeFriendMock.mockResolvedValue({});

    render(<FriendsPage />);
    await screen.findByRole('heading', { name: /friends/i });

    const card = findCardContainerFromNamedLink('Alice');
    const removeBtn = within(card).getByRole('button'); // FriendCard has only 1 button

    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(removeFriendMock).toHaveBeenCalledWith('fr-7');
    });

    await waitFor(() => {
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });

  it('shows per-item spinner + disables the friend remove button while action is loading', async () => {
    getFriendsMock.mockResolvedValue({
      friends: [friend({ friendshipId: 'fr-8', displayName: 'Alice' })],
      pendingReceived: [],
      pendingSent: [],
    });
    // keep remove pending
    removeFriendMock.mockReturnValue(new Promise(() => {}));

    render(<FriendsPage />);
    await screen.findByRole('heading', { name: /friends/i });

    const card = findCardContainerFromNamedLink('Alice');
    const removeBtn = within(card).getByRole('button');

    fireEvent.click(removeBtn);

    expect(removeFriendMock).toHaveBeenCalledWith('fr-8');
    expect(removeBtn).toBeDisabled();

    // spinner icon shows up inside the button
    expect(within(removeBtn).getByTestId('Loader2')).toBeInTheDocument();
  });

  it('shows error banner if an action (remove friend) fails', async () => {
    getFriendsMock.mockResolvedValue({
      friends: [friend({ friendshipId: 'fr-10', displayName: 'Alice' })],
      pendingReceived: [],
      pendingSent: [],
    });
    removeFriendMock.mockRejectedValue(new Error('Remove failed'));

    render(<FriendsPage />);
    await screen.findByRole('heading', { name: /friends/i });

    const card = findCardContainerFromNamedLink('Alice');
    fireEvent.click(within(card).getByRole('button'));

    expect(await screen.findByText(/remove failed/i)).toBeInTheDocument();
    // friend should still exist if remove failed
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
