import { render, screen, waitFor } from '@testing-library/react';
import { RsvpRoster } from './RsvpRoster';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ gameId: 'g1' }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { userId: 'u1' } }),
}));

jest.mock('@/hooks/useGames', () => ({
  useGame: () => ({
    game: {
      gameId: 'g1',
      title: 'Sunday Soccer',
      sportName: 'Soccer',
      skillBand: 'Intermediate',
      intensityBand: 'Competitive',
      startTime: '2025-02-15T14:00:00Z',
      location: { name: 'Central Park' },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/hooks/useAttendance', () => ({
  useAttendance: () => ({
    pendingAttendance: [
      {
        participationId: 'p1',
        attendanceStatus: 'ATTENDED' as const,
        userId: 'u2',
        sportId: 's1',
        requestedPositionRoleId: 'r1',
      },
    ],
    isLoading: false,
    isSubmitting: false,
    error: null,
    fetchPending: jest.fn(),
    confirmAttendance: jest.fn(),
  }),
}));

jest.mock('@/lib/api', () => ({
  usersApi: { getProfile: jest.fn().mockResolvedValue({ displayName: 'Alice', defaultIntensity: 'Casual' }) },
}));

describe('RsvpRoster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Confirm Player Attendance and RSVP Roster when loaded', async () => {
    render(<RsvpRoster />);

    await waitFor(() => {
      expect(screen.getByText('Confirm Player Attendance')).toBeInTheDocument();
    });

    expect(screen.getByText(/RSVP Roster/)).toBeInTheDocument();
    expect(screen.getByText('Submit Attendance')).toBeInTheDocument();
  });
});
