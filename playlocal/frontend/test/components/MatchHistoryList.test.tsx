import { render, screen, waitFor } from '@testing-library/react';
import { MatchHistoryList } from '../../components/sub-components/MatchHistoryList';
import { gamesApi } from '@/lib/api';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/lib/api', () => ({
  gamesApi: {
    getGameParticipation: jest.fn(),
  },
}));

const mockGetGameParticipation =
  gamesApi.getGameParticipation as jest.MockedFunction<
    typeof gamesApi.getGameParticipation
  >;

describe('MatchHistoryList', () => {
  const game = {
    gameId: 'g1',
    title: 'Saturday Soccer',
    startTime: '2025-02-01T10:00:00Z',
    location: { name: 'Riverside Fields' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders game title and location', async () => {
    mockGetGameParticipation.mockResolvedValue({
      role: 'PARTICIPANT',
      attendanceStatus: 'ATTENDED',
    } as any);

    render(<MatchHistoryList game={game} />);

    expect(screen.getByText('Saturday Soccer')).toBeInTheDocument();
    expect(screen.getByText('Riverside Fields')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetGameParticipation).toHaveBeenCalledWith('g1');
    });
  });

  it('shows Attendance Confirmed when participation is ATTENDED', async () => {
    mockGetGameParticipation.mockResolvedValue({
      role: 'PARTICIPANT',
      attendanceStatus: 'ATTENDED',
    } as any);

    render(<MatchHistoryList game={game} />);

    await waitFor(() => {
      expect(screen.getByText('Attendance Confirmed')).toBeInTheDocument();
    });
  });

  it('shows Confirm Attendance link when organizer and attendance UNKNOWN', async () => {
    mockGetGameParticipation.mockResolvedValue({
      role: 'ORGANIZER',
      attendanceStatus: 'UNKNOWN',
    } as any);

    render(<MatchHistoryList game={game} />);

    await waitFor(() => {
      expect(screen.getByText('Confirm Attendance')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: /Confirm Attendance/i });
    expect(link).toHaveAttribute('href', '/rsvpRoster/g1');
  });

  it('shows No Show when participation is NO_SHOW', async () => {
    mockGetGameParticipation.mockResolvedValue({
      role: 'PARTICIPANT',
      attendanceStatus: 'NO_SHOW',
    } as any);

    render(<MatchHistoryList game={game} />);

    await waitFor(() => {
      expect(screen.getByText('No Show')).toBeInTheDocument();
    });
  });

  it('shows Report Issue when participant and attendance UNKNOWN', async () => {
    mockGetGameParticipation.mockResolvedValue({
      role: 'PARTICIPANT',
      attendanceStatus: 'UNKNOWN',
    } as any);

    render(<MatchHistoryList game={game} />);

    await waitFor(() => {
      expect(screen.getByText('Report Issue')).toBeInTheDocument();
    });
    expect(screen.queryByText('Confirm Attendance')).not.toBeInTheDocument();
  });

  it('does not fetch when game is null', () => {
    render(<MatchHistoryList game={null} />);

    expect(mockGetGameParticipation).not.toHaveBeenCalled();
  });

  it('handles fetch error gracefully', async () => {
    mockGetGameParticipation.mockRejectedValue(new Error('Network error'));

    render(<MatchHistoryList game={game} />);

    await waitFor(() => {
      expect(mockGetGameParticipation).toHaveBeenCalledWith('g1');
    });

    expect(screen.getByText('Saturday Soccer')).toBeInTheDocument();
  });

  it('shows default Attendance Status for unexpected participation status', async () => {
    mockGetGameParticipation.mockResolvedValue({
      role: 'PARTICIPANT',
      attendanceStatus: 'PENDING',
    } as any);

    render(<MatchHistoryList game={game} />);

    await waitFor(() => {
      expect(screen.getByText('Attendance Status')).toBeInTheDocument();
    });
  });
});
