import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from '../components/UserProfile';
import '@testing-library/jest-dom';
import { usersApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const mockUseParams = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/useGames', () => ({
  usePastGames: () => ({ games: [] }),
  usePastGamesByUserNeedingAttendanceUpdate: () => ({ games: [] }),
}));

jest.mock('../lib/api', () => {
  const mockOqs = () =>
    Promise.resolve({
      userId: 'test-user-id',
      displayName: 'Test Organizer',
      oqsScore: 85.0,
      gameCompletionRate: 90.0,
      repeatPlayerRate: 75.0,
      totalGamesHosted: 10,
      completedGames: 9,
      cancelledGames: 1,
      totalUniquePlayers: 50,
      repeatPlayers: 20,
      confidenceLevel: 'HIGH',
      confidenceDescription: 'Based on 10 games',
      lastCalculatedAt: '2024-01-15T10:00:00Z',
    });
  const mockOqsInfoCard = () =>
    Promise.resolve({
      oqsScore: 85.0,
      overallDescription: 'Good organizer',
      gameCompletionRate: 90.0,
      completionRateDescription: 'Good reliability',
      completedGames: 9,
      totalGames: 10,
      repeatPlayerRate: 75.0,
      repeatRateDescription: 'Great retention',
      repeatPlayers: 20,
      totalUniquePlayers: 50,
      confidenceLevel: 'HIGH',
      confidenceDescription: 'Based on 10 games',
      gamesForNextLevel: 0,
    });
  const mockEmpty = () => Promise.resolve([]);
  const mockObj = () => Promise.resolve({});
  return {
    usersApi: {
      getProfile: jest.fn(),
      getProfileBySlug: jest.fn(),
      getConnectionSignals: jest.fn(() =>
        Promise.resolve({ mutualFriendCount: 0, coPlayCount: 0 })
      ),
    },
    endorsementsApi: {
      getUserEndorsements: jest.fn(() => Promise.resolve([])),
    },
    organizerQualityApi: {
      getOqs: jest.fn(mockOqs),
      getMyOqs: jest.fn(mockOqs),
      getOqsSummary: jest.fn(mockObj),
      getOqsInfoCard: jest.fn(mockOqsInfoCard),
      getMyOqsInfoCard: jest.fn(mockOqsInfoCard),
      getOqsHistory: jest.fn(mockObj),
      getMyOqsHistory: jest.fn(mockObj),
      getWeights: jest.fn(mockObj),
    },
    gamesApi: {
      getUpcoming: jest.fn(mockEmpty),
      getPast: jest.fn(mockEmpty),
      getPastByUserNeedingAttendanceUpdate: jest.fn(mockEmpty),
      getById: jest.fn(mockObj),
      getRoster: jest.fn(mockObj),
      create: jest.fn(mockObj),
      join: jest.fn(mockObj),
      leave: jest.fn(mockObj),
      cancel: jest.fn(mockObj),
      getGameParticipation: jest.fn(mockObj),
    },
  };
});

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div>LineChart</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
}));

jest.mock('@/hooks/useStats', () => ({
  useStats: () => ({
    showUpRate: { data: null, isLoading: false, error: null },
    skillTrend: { data: null, isLoading: false, error: null },
    attendanceRate: { data: null, isLoading: false, error: null },
    timeframe: '30',
    setTimeframe: jest.fn(),
  }),
}));

jest.mock('lucide-react', () => ({
  Medal: () => <div />,
  MapPin: () => <div />,
  Calendar: () => <div />,
  TrendingUp: () => <div />,
  Award: () => <div />,
  Users: () => <div />,
  Star: () => <div />,
  CheckCircle: () => <div />,
  Edit: () => <div />,
  Settings: () => <div />,
  Flag: () => <div />,
  Loader2: () => <div />,
  AlertCircle: () => <div />,
  Info: () => <div />,
  XCircle: () => <div />,
  ChevronDown: () => <div />,
  ChevronUp: () => <div />,
  UserPlus: () => <div />,
  Gamepad2: () => <div />,
}));

const mockOtherUser = {
  userId: '550e8400-e29b-42d4-a716-446655440000',
  displayName: 'Other User',
  email: 'other@test.com',
  reliabilityScore: 80,
  gamesCount: 5,
  slug: 'other-user',
};

describe('UserProfile load by slug vs userId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        userId: 'current-user-id',
        displayName: 'Current User',
        email: 'current@test.com',
        reliabilityScore: 100,
        gamesCount: 0,
      },
      isAuthenticated: true,
      refreshUser: jest.fn(),
    });
    (usersApi.getProfile as jest.Mock).mockResolvedValue(mockOtherUser);
    (usersApi.getProfileBySlug as jest.Mock).mockResolvedValue(mockOtherUser);
  });

  it('calls getProfileBySlug when URL param is a slug (e.g. other-user)', async () => {
    mockUseParams.mockReturnValue({ username: 'other-user' });

    render(<UserProfile />);

    await waitFor(() => {
      expect(usersApi.getProfileBySlug).toHaveBeenCalledWith('other-user');
    });
    expect(usersApi.getProfile).not.toHaveBeenCalled();
  });

  it('calls getProfile when URL param is a UUID (e.g. from Friends/PlayerSearch links)', async () => {
    const userId = '550e8400-e29b-42d4-a716-446655440000';
    mockUseParams.mockReturnValue({ username: userId });

    render(<UserProfile />);

    await waitFor(() => {
      expect(usersApi.getProfile).toHaveBeenCalledWith(userId);
    });
    expect(usersApi.getProfileBySlug).not.toHaveBeenCalled();
  });

  it('treats "me" as own profile and does not fetch other user', async () => {
    mockUseParams.mockReturnValue({ username: 'me' });

    render(<UserProfile />);

    await waitFor(() => {
      expect(usersApi.getProfile).not.toHaveBeenCalled();
      expect(usersApi.getProfileBySlug).not.toHaveBeenCalled();
    });
  });

  it('treats matching current user slug as own profile and does not fetch', async () => {
    mockUseParams.mockReturnValue({ username: 'current-user' });

    render(<UserProfile />);

    await waitFor(() => {
      expect(usersApi.getProfile).not.toHaveBeenCalled();
      expect(usersApi.getProfileBySlug).not.toHaveBeenCalled();
    });
  });

  it('calls getConnectionSignals when viewing another user and shows mutual/co-play when resolved', async () => {
    mockUseParams.mockReturnValue({ username: 'other-user' });
    (usersApi.getConnectionSignals as jest.Mock).mockResolvedValue({
      mutualFriendCount: 2,
      coPlayCount: 1,
    });

    render(<UserProfile />);

    await waitFor(() =>
      expect(usersApi.getProfileBySlug).toHaveBeenCalledWith('other-user')
    );
    await waitFor(() =>
      expect(usersApi.getConnectionSignals).toHaveBeenCalledWith(
        mockOtherUser.userId
      )
    );

    expect(
      await screen.findByText('2 mutual friends', {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Played together 1 time in last 60 days/)
    ).toBeInTheDocument();
  });

  it('shows No mutuals yet and No games together yet when getConnectionSignals returns zeros', async () => {
    mockUseParams.mockReturnValue({ username: 'other-user' });
    (usersApi.getConnectionSignals as jest.Mock).mockResolvedValue({
      mutualFriendCount: 0,
      coPlayCount: 0,
    });

    render(<UserProfile />);

    await waitFor(() =>
      expect(usersApi.getConnectionSignals).toHaveBeenCalled()
    );
    expect(
      await screen.findByText('No mutuals yet', {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(screen.getByText('No games together yet')).toBeInTheDocument();
  });

  it('shows profile error when getProfileBySlug fails', async () => {
    mockUseParams.mockReturnValue({ username: 'other-user' });
    (usersApi.getProfileBySlug as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(<UserProfile />);

    await waitFor(() => expect(usersApi.getProfileBySlug).toHaveBeenCalled());
    expect(
      await screen.findByText(/Failed to load profile/, {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });

  it('shows No mutuals yet when getConnectionSignals rejects', async () => {
    mockUseParams.mockReturnValue({ username: 'other-user' });
    (usersApi.getConnectionSignals as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    render(<UserProfile />);

    await waitFor(() =>
      expect(usersApi.getConnectionSignals).toHaveBeenCalled()
    );
    expect(
      await screen.findByText('No mutuals yet', {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(screen.getByText('No games together yet')).toBeInTheDocument();
  });
});
