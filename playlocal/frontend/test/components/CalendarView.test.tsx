// __tests__/components/CalendarView.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalendarView } from '@/components/CalendarView';

// ---- Mocks ----
const mockUseGames = jest.fn();
jest.mock('@/hooks/useGames', () => ({
  useGames: () => mockUseGames(),
}));

const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// next/link -> render as <a> so we can assert href/text
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname} {...rest}>
      {children}
    </a>
  );
});

// lucide-react icons -> simple placeholders
jest.mock('lucide-react', () => ({
  ChevronLeft: (props: any) => <svg data-testid="ChevronLeft" {...props} />,
  ChevronRight: (props: any) => <svg data-testid="ChevronRight" {...props} />,
  Calendar: (props: any) => <svg data-testid="Calendar" {...props} />,
  MapPin: (props: any) => <svg data-testid="MapPin" {...props} />,
  Users: (props: any) => <svg data-testid="Users" {...props} />,
  Clock: (props: any) => <svg data-testid="Clock" {...props} />,
  Plus: (props: any) => <svg data-testid="Plus" {...props} />,
  Loader2: (props: any) => <svg data-testid="Loader2" {...props} />,
}));

// Helper: build a local date string reliably
function isoLocal(
  year: number,
  monthIndex0: number,
  day: number,
  hour24 = 12,
  min = 0
) {
  const d = new Date(year, monthIndex0, day, hour24, min, 0, 0);
  return d.toISOString();
}

describe('CalendarView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 1, 9, 12, 0, 0)); // Feb 9, 2026 @ 12:00
    mockUseGames.mockReset();
    mockUseAuth.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders header and Create Game link', () => {
    mockUseAuth.mockReturnValue({
      user: { userId: 'u1' },
      isAuthenticated: true,
    });
    mockUseGames.mockReturnValue({ games: [], isLoading: false });

    render(<CalendarView />);

    expect(screen.getByText('My Calendar')).toBeInTheDocument();
    expect(
      screen.getByText('View and manage your upcoming games')
    ).toBeInTheDocument();

    const createLink = screen.getByRole('link', { name: /create game/i });
    expect(createLink).toHaveAttribute('href', '/games/create');
  });

  it('shows month/year title based on currentDate and can go prev/next month', () => {
    mockUseAuth.mockReturnValue({
      user: { userId: 'u1' },
      isAuthenticated: true,
    });
    mockUseGames.mockReturnValue({ games: [], isLoading: false });

    render(<CalendarView />);

    // initial system time: Feb 2026
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'February 2026'
    );

    const buttons = screen.getAllByRole('button');
    // month navigation buttons are icon-only; we can pick by order: [prev, Today, next] in that header group
    // safer: click the first and last icon buttons that contain our mocked svgs
    const prevBtn = screen.getByTestId('ChevronLeft').closest('button')!;
    const nextBtn = screen.getByTestId('ChevronRight').closest('button')!;

    fireEvent.click(prevBtn);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'January 2026'
    );

    fireEvent.click(nextBtn);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'February 2026'
    );

    fireEvent.click(nextBtn);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'March 2026'
    );
  });

  it('Today button resets the month/year back to today', () => {
    mockUseAuth.mockReturnValue({
      user: { userId: 'u1' },
      isAuthenticated: true,
    });
    mockUseGames.mockReturnValue({ games: [], isLoading: false });

    render(<CalendarView />);

    const prevBtn = screen.getByTestId('ChevronLeft').closest('button')!;
    fireEvent.click(prevBtn);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'January 2026'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'February 2026'
    );
  });

  it('toggles view state Month/Week/Day and applies selected styling', () => {
    mockUseAuth.mockReturnValue({
      user: { userId: 'u1' },
      isAuthenticated: true,
    });
    mockUseGames.mockReturnValue({ games: [], isLoading: false });

    render(<CalendarView />);

    const monthBtn = screen.getByRole('button', { name: 'Month' });
    const weekBtn = screen.getByRole('button', { name: 'Week' });
    const dayBtn = screen.getByRole('button', { name: 'Day' });

    // default = month
    expect(monthBtn.className).toMatch(/bg-emerald-100/);
    expect(weekBtn.className).not.toMatch(/bg-emerald-100/);

    fireEvent.click(weekBtn);
    expect(weekBtn.className).toMatch(/bg-emerald-100/);
    expect(monthBtn.className).not.toMatch(/bg-emerald-100/);

    fireEvent.click(dayBtn);
    expect(dayBtn.className).toMatch(/bg-emerald-100/);
    expect(weekBtn.className).not.toMatch(/bg-emerald-100/);
  });

  it('maps API games into calendar games and shows them in Upcoming Games (sorted, future only, limit 5)', () => {
    mockUseAuth.mockReturnValue({
      user: { userId: 'host-1' },
      isAuthenticated: true,
    });

    // Today = Feb 9, 2026. Create 6 future games and 1 past game.
    const apiGames = [
      // past (should be filtered out)
      {
        gameId: 'past-1',
        title: 'Past Game',
        startTime: isoLocal(2026, 1, 1, 10, 0), // Feb 1
        sportName: 'Soccer',
        organizer: { userId: 'host-1' },
        location: { name: 'Past Park' },
      },
      // future games (unsorted)
      {
        gameId: 'g3',
        title: 'Game 3',
        startTime: isoLocal(2026, 1, 12, 18, 0), // Feb 12
        sportName: 'Tennis',
        organizer: { userId: 'someone-else' },
        location: { name: 'Court A' },
      },
      {
        gameId: 'g1',
        title: 'Game 1',
        startTime: isoLocal(2026, 1, 10, 9, 0), // Feb 10
        sportName: 'Basketball',
        organizer: { userId: 'host-1' }, // host
        location: { name: 'Gym' },
      },
      {
        gameId: 'g2',
        title: 'Game 2',
        startTime: isoLocal(2026, 1, 10, 8, 0), // Feb 10 earlier
        sportName: 'Volleyball',
        organizer: { userId: 'someone-else' },
        location: { name: 'Court B' },
      },
      {
        gameId: 'g4',
        title: 'Game 4',
        startTime: isoLocal(2026, 1, 20, 12, 0), // Feb 20
        sportName: 'Badminton',
        organizer: { userId: 'someone-else' },
        location: { name: 'Hall' },
      },
      {
        gameId: 'g5',
        title: 'Game 5',
        startTime: isoLocal(2026, 2, 1, 12, 0), // Mar 1
        sportName: 'Hockey',
        organizer: { userId: 'someone-else' },
        location: { name: 'Rink' },
      },
      {
        gameId: 'g6',
        title: 'Game 6',
        startTime: isoLocal(2026, 2, 2, 12, 0), // Mar 2
        sportName: 'Soccer',
        organizer: { userId: 'someone-else' },
        location: { name: 'Field' },
      },
    ];

    mockUseGames.mockReturnValue({ games: apiGames, isLoading: false });

    render(<CalendarView />);

    // Sidebar items are links to /games/:id. Only 5 future games should show (g6 excluded).
    const upcomingLinks = screen.getAllByRole('link').filter((a) => {
      const href = a.getAttribute('href') || '';
      return href.startsWith('/games/') && href !== '/games/create';
    });

    // Calendar grid also has links for games; so to focus on sidebar,
    // we assert presence of unique text blocks from the sidebar cards.
    // We'll assert that Game 6 is not present and that the earliest is shown first in sidebar.
    expect(screen.queryByText('Game 6')).not.toBeInTheDocument();
    expect(screen.queryByText('Past Game')).not.toBeInTheDocument();

    // Host badge should show for g1
    expect(screen.getByText('Host')).toBeInTheDocument();

    // Check sorting: Feb 10 8:00 (Game 2) should appear before Feb 10 9:00 (Game 1)
    const game2 = screen.getByText('Game 2');
    const game1 = screen.getByText('Game 1');

    // compare DOM position
    const pos = (node: HTMLElement) => {
      const all = Array.from(document.body.querySelectorAll('*'));
      return all.indexOf(node);
    };
    expect(pos(game2)).toBeLessThan(pos(game1));

    // Check link href mapping exists at least for one
    const game1Link = game1.closest('a');
    expect(game1Link).toHaveAttribute('href', '/games/g1');
  });

  it("renders day cell links for games and shows '+N more' when more than 2 games on a day", () => {
    mockUseAuth.mockReturnValue({
      user: { userId: 'host-1' },
      isAuthenticated: true,
    });

    // Put 3 games on Feb 10, 2026
    const apiGames = [
      {
        gameId: 'a',
        title: 'A',
        startTime: isoLocal(2026, 1, 10, 8, 0),
        sportName: 'Soccer',
        organizer: { userId: 'host-1' }, // host (purple styling path)
        location: { name: 'Field' },
      },
      {
        gameId: 'b',
        title: 'B',
        startTime: isoLocal(2026, 1, 10, 9, 0),
        sportName: 'Basketball',
        organizer: { userId: 'x' },
        location: { name: 'Gym' },
      },
      {
        gameId: 'c',
        title: 'C',
        startTime: isoLocal(2026, 1, 10, 10, 0),
        sportName: 'Tennis',
        organizer: { userId: 'x' },
        location: { name: 'Court' },
      },
    ];
    mockUseGames.mockReturnValue({ games: apiGames, isLoading: false });

    render(<CalendarView />);

    // In the month grid, it will render only first 2 links and a "+1 more"
    expect(screen.getByText(/\+1 more/i)).toBeInTheDocument();

    // It should contain links for two of them: /games/a, /games/b (order not critical here)
    const linkA = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/games/a');
    const linkB = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/games/b');
    expect(linkA).toBeTruthy();
    expect(linkB).toBeTruthy();
  });

  it("uses 'TBD' location when API game has no location name", () => {
    mockUseAuth.mockReturnValue({
      user: { userId: 'u1' },
      isAuthenticated: true,
    });
    mockUseGames.mockReturnValue({
      games: [
        {
          gameId: 'g1',
          title: 'No Location',
          startTime: isoLocal(2026, 1, 10, 9, 0),
          sportName: 'Basketball',
          organizer: { userId: 'u1' },
          location: null,
        },
      ],
      isLoading: false,
    });

    render(<CalendarView />);

    // Appears in Upcoming Games sidebar
    expect(screen.getByText('TBD')).toBeInTheDocument();
  });

  it("highlights today's date badge in the grid (rendered as a rounded emerald circle)", () => {
    mockUseAuth.mockReturnValue({
      user: { userId: 'u1' },
      isAuthenticated: true,
    });
    mockUseGames.mockReturnValue({ games: [], isLoading: false });

    render(<CalendarView />);

    // Today is Feb 9, 2026 -> day number "9" should have the special class
    // There will be many '9' occurrences sometimes, but the "today" one is wrapped in a div with specific classes.
    const todayBadge = Array.from(screen.getAllByText('9')).find(
      (el) =>
        el.className.includes('bg-emerald-600') &&
        el.className.includes('rounded-full')
    );
    expect(todayBadge).toBeTruthy();
  });
});
