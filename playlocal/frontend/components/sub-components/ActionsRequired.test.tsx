import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ActionsRequired } from './ActionsRequired';

const mockPush = jest.fn();

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useGames', () => ({
  usePastGamesByUserNeedingAttendanceUpdate: jest.fn(),
}));

const useAuth = require('@/context/AuthContext').useAuth;
const usePastGamesByUserNeedingAttendanceUpdate = require('@/hooks/useGames').usePastGamesByUserNeedingAttendanceUpdate;

const mockGames = [
  { gameId: 'g1', title: 'Past Basketball Game', startTime: '2025-01-20T14:00:00Z' },
];

describe('ActionsRequired', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ isAuthenticated: true, user: { userId: 'u1' } });
    usePastGamesByUserNeedingAttendanceUpdate.mockReturnValue({
      games: mockGames,
      isLoading: false,
      error: null,
    });
  });

  it('renders Actions Required section when games need attendance update', async () => {
    render(<ActionsRequired />);

    await waitFor(() => {
      expect(screen.getByText('Actions Required')).toBeInTheDocument();
    });

    expect(screen.getByText('Past Basketball Game')).toBeInTheDocument();
    expect(screen.getByText('Confirm Attendance')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Confirm Attendance/i });
    expect(link).toHaveAttribute('href', '/rsvpRoster/g1');
  });

  it('does not render Actions Required when no games need update', () => {
    usePastGamesByUserNeedingAttendanceUpdate.mockReturnValue({
      games: [],
      isLoading: false,
      error: null,
    });

    render(<ActionsRequired />);

    expect(screen.queryByText('Actions Required')).not.toBeInTheDocument();
  });

  it('navigates to /login when unauthenticated user clicks Confirm Attendance', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null });

    render(<ActionsRequired />);

    await waitFor(() => {
      expect(screen.getByText('Confirm Attendance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm Attendance'));

    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
