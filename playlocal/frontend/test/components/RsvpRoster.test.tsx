import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RsvpRoster } from '../../components/RsvpRoster';

const mockPush = jest.fn();
const mockRefetch = jest.fn();
const mockFetchPending = jest.fn();
const mockConfirmAttendance = jest.fn();

const mockGame = {
  gameId: 'g1',
  title: 'Sunday Soccer',
  sportName: 'Soccer',
  skillBand: 'Intermediate',
  intensityBand: 'Competitive',
  startTime: '2025-02-15T14:00:00Z',
  location: { name: 'Central Park' },
};

const mockPendingAllAttended = [
  { participationId: 'p1', attendanceStatus: 'ATTENDED' as const, userId: 'u2', sportId: 's1', requestedPositionRoleId: 'r1' },
];

const mockPendingOneUnknown = [
  { participationId: 'p1', attendanceStatus: 'UNKNOWN' as const, userId: 'u2', sportId: 's1', requestedPositionRoleId: 'r1' },
];

jest.mock('next/navigation', () => ({
  useParams: () => ({ gameId: 'g1' }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useGames', () => ({
  useGame: jest.fn(),
}));

jest.mock('@/hooks/useAttendance', () => ({
  useAttendance: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  usersApi: { getProfile: jest.fn().mockResolvedValue({ displayName: 'Alice', defaultIntensity: 'Casual' }) },
}));

const useAuth = require('../../context/AuthContext').useAuth;
const useGame = require('../../hooks/useGames').useGame;
const useAttendance = require('../../hooks/useAttendance').useAttendance;

function setDefaultMocks() {
  useAuth.mockReturnValue({ isAuthenticated: true, user: { userId: 'u1' } });
  useGame.mockReturnValue({
    game: mockGame,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  });
  useAttendance.mockReturnValue({
    pendingAttendance: mockPendingAllAttended,
    isLoading: false,
    isSubmitting: false,
    error: null,
    fetchPending: mockFetchPending,
    confirmAttendance: mockConfirmAttendance,
  });
}

describe('RsvpRoster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setDefaultMocks();
  });

  it('renders Confirm Player Attendance and RSVP Roster when loaded', async () => {
    render(<RsvpRoster />);

    await waitFor(() => {
      expect(screen.getByText('Confirm Player Attendance')).toBeInTheDocument();
    });

    expect(screen.getByText(/RSVP Roster/)).toBeInTheDocument();
    expect(screen.getByText('Submit Attendance')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null });
    render(<RsvpRoster />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('shows game loading state with Cancel button', () => {
    useGame.mockReturnValue({ game: null, isLoading: true, error: null, refetch: mockRefetch });
    useAttendance.mockReturnValue({
      pendingAttendance: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
      fetchPending: mockFetchPending,
      confirmAttendance: mockConfirmAttendance,
    });

    render(<RsvpRoster />);

    expect(screen.getByText('Loading game...')).toBeInTheDocument();
    const cancel = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancel);
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('shows game error state with Retry and Cancel', () => {
    useGame.mockReturnValue({ game: null, isLoading: false, error: 'Game not found', refetch: mockRefetch });
    useAttendance.mockReturnValue({
      pendingAttendance: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
      fetchPending: mockFetchPending,
      confirmAttendance: mockConfirmAttendance,
    });

    render(<RsvpRoster />);

    expect(screen.getByText('Game not found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(mockRefetch).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('shows attendance loading state', () => {
    useAttendance.mockReturnValue({
      pendingAttendance: [],
      isLoading: true,
      isSubmitting: false,
      error: null,
      fetchPending: mockFetchPending,
      confirmAttendance: mockConfirmAttendance,
    });

    render(<RsvpRoster />);

    expect(screen.getByText('Loading roster...')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('shows attendance error with Retry and Back', () => {
    useAttendance.mockReturnValue({
      pendingAttendance: [],
      isLoading: false,
      isSubmitting: false,
      error: 'Failed to load attendance',
      fetchPending: mockFetchPending,
      confirmAttendance: mockConfirmAttendance,
    });

    render(<RsvpRoster />);

    expect(screen.getByText('Failed to load attendance')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(mockFetchPending).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('shows "You must mark all players" when some not marked and Submit disabled', async () => {
    useAttendance.mockReturnValue({
      pendingAttendance: mockPendingOneUnknown,
      isLoading: false,
      isSubmitting: false,
      error: null,
      fetchPending: mockFetchPending,
      confirmAttendance: mockConfirmAttendance,
    });

    render(<RsvpRoster />);

    await waitFor(() => {
      expect(screen.getByText(/You must mark all players before submitting/)).toBeInTheDocument();
    });

    expect(screen.getByText(/players still need to be marked/)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: /Submit Attendance/i });
    expect(submit).toBeDisabled();
  });

  it('calls confirmAttendance and navigates to /profile on Submit success', async () => {
    mockConfirmAttendance.mockResolvedValue({ gameId: 'g1', attendedCount: 1, noShowCount: 0, updatedScores: [] });

    render(<RsvpRoster />);

    await waitFor(() => {
      expect(screen.getByText('Submit Attendance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Attendance/i }));

    await waitFor(() => {
      expect(mockConfirmAttendance).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  it('alerts on Submit failure', async () => {
    mockConfirmAttendance.mockRejectedValue(new Error('Server error'));
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<RsvpRoster />);

    await waitFor(() => {
      expect(screen.getByText('Submit Attendance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Attendance/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to submit attendance. Please try again.');
    });

    alertSpy.mockRestore();
  });

  it('shows Submitting... when isSubmitting', async () => {
    useAttendance.mockReturnValue({
      pendingAttendance: mockPendingAllAttended,
      isLoading: false,
      isSubmitting: true,
      error: null,
      fetchPending: mockFetchPending,
      confirmAttendance: mockConfirmAttendance,
    });

    render(<RsvpRoster />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submitting.../i })).toBeInTheDocument();
    });
  });

  it('Cancel in main flow navigates to /profile', async () => {
    render(<RsvpRoster />);

    await waitFor(() => {
      expect(screen.getByText('Submit Attendance')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('handleAttendanceChange updates status when clicking No show then Submit succeeds', async () => {
    useAttendance.mockReturnValue({
      pendingAttendance: [
        { participationId: 'p1', attendanceStatus: 'ATTENDED' as const, userId: 'u2', sportId: 's1', requestedPositionRoleId: 'r1' },
        { participationId: 'p2', attendanceStatus: 'UNKNOWN' as const, userId: 'u3', sportId: 's1', requestedPositionRoleId: 'r1' },
      ],
      isLoading: false,
      isSubmitting: false,
      error: null,
      fetchPending: mockFetchPending,
      confirmAttendance: mockConfirmAttendance,
    });

    mockConfirmAttendance.mockResolvedValue({ gameId: 'g1', attendedCount: 1, noShowCount: 1, updatedScores: [] });

    render(<RsvpRoster />);

    await waitFor(() => {
      expect(screen.getByText(/You must mark all players/)).toBeInTheDocument();
    });

    const noShowButtons = screen.getAllByText('No show');
    fireEvent.click(noShowButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Attendance/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Attendance/i }));

    await waitFor(() => {
      expect(mockConfirmAttendance).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });
});
