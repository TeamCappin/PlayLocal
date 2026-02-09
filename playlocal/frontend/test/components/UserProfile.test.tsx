import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from '../../components/UserProfile';
import '@testing-library/jest-dom';
import { usersApi, endorsementsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: () => ({ username: 'testuser' }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => {
  const createMockArrayFn = () => jest.fn(() => Promise.resolve([]));
  const createMockObjectFn = () => jest.fn(() => Promise.resolve({}));
  
  // Mock OQS data with proper structure
  const createMockOqsFn = () => jest.fn(() => Promise.resolve({
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
    confidenceDescription: 'Based on 10 games - score is highly reliable',
    lastCalculatedAt: '2024-01-15T10:00:00Z',
  }));
  
  const createMockOqsInfoCardFn = () => jest.fn(() => Promise.resolve({
    oqsScore: 85.0,
    overallDescription: 'Good organizer with reliable game history',
    gameCompletionRate: 90.0,
    completionRateDescription: 'Good reliability: 9 of 10 games completed',
    completedGames: 9,
    totalGames: 10,
    repeatPlayerRate: 75.0,
    repeatRateDescription: 'Great retention! 20 of 50 players have returned',
    repeatPlayers: 20,
    totalUniquePlayers: 50,
    confidenceLevel: 'HIGH',
    confidenceDescription: 'Based on 10 games - score is highly reliable',
    gamesForNextLevel: 0,
  }));
  
  return {
    usersApi: {
      getProfile: jest.fn(),
      getProfileBySlug: jest.fn(),
    },
    endorsementsApi: {
      getUserEndorsements: jest.fn(),
    },
    organizerQualityApi: {
      getOqs: createMockOqsFn(),
      getMyOqs: createMockOqsFn(),
      getOqsSummary: createMockObjectFn(),
      getOqsInfoCard: createMockOqsInfoCardFn(),
      getMyOqsInfoCard: createMockOqsInfoCardFn(),
      getOqsHistory: createMockObjectFn(),
      getMyOqsHistory: createMockObjectFn(),
      getWeights: createMockObjectFn(),
    },
    gamesApi: {
      getUpcoming: createMockArrayFn(),
      getPast: createMockArrayFn(),
      getPastByUserNeedingAttendanceUpdate: createMockArrayFn(),
      getById: createMockObjectFn(),
      getRoster: createMockObjectFn(),
      create: createMockObjectFn(),
      join: createMockObjectFn(),
      leave: createMockObjectFn(),
      cancel: createMockObjectFn(),
      getGameParticipation: createMockObjectFn(),
    },
  };
});

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div>LineChart</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
  RadarChart: () => <div>RadarChart</div>,
  PolarGrid: () => <div>PolarGrid</div>,
  PolarAngleAxis: () => <div>PolarAngleAxis</div>,
  PolarRadiusAxis: () => <div>PolarRadiusAxis</div>,
  Radar: () => <div>Radar</div>,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Medal: () => <div data-testid="icon-medal" />,
  // Add other icons used in UserProfile as needed, or just a generic proxy if possible.
  // For now simple mocks for icons to avoid errors
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
  // Icons used by OrganizerQualityBadge
  Info: () => <div />,
  XCircle: () => <div />,
  ChevronDown: () => <div />,
  ChevronUp: () => <div />,
}));

describe('UserProfile Endorsements', () => {
  const mockUser = {
    id: 1,
    displayName: 'Test User',
    userId: 101,
    gamesCount: 10,
    reliabilityScore: 95,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      refreshUser: jest.fn(),
    });
    (usersApi.getProfile as jest.Mock).mockResolvedValue(mockUser);
    (usersApi.getProfileBySlug as jest.Mock).mockResolvedValue(mockUser);
  });

  it('displays endorsement count and list when endorsements exist', async () => {
    const mockEndorsements = [
      {
        endorsementId: '1',
        endorserName: 'Organizer Bob',
        gameTitle: 'Saturday Basketball',
        gameDate: '2023-11-15T10:00:00',
      },
      {
        endorsementId: '2',
        endorserName: 'Organizer Alice',
        gameTitle: 'Sunday Soccer',
        gameDate: '2023-11-16T14:00:00',
      },
    ];

    (endorsementsApi.getUserEndorsements as jest.Mock).mockResolvedValue(mockEndorsements);

    render(<UserProfile />);

    await waitFor(() => {
        expect(endorsementsApi.getUserEndorsements).toHaveBeenCalledWith(101);
    });

    // Check for "Endorsements" text (appears in stats and section header)
    const endorsementTexts = screen.getAllByText('Endorsements');
    expect(endorsementTexts.length).toBeGreaterThanOrEqual(2);

    // Check for the count badge in the section header (found by text '2')
    // Note: '2' might appear multiple times if other stats are 2, but in our mock case:
    // gamesCount=10, gamesHosted=0 (default), reliability=95. So '2' should be unique to endorsements count.
    // However, safely, we can query by container if needed.
    // In our mock, Endorsement count is 2.
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);

    // Check for endorsement details
    const organizerPicks = screen.getAllByText('Organizer Pick');
    expect(organizerPicks.length).toBeGreaterThanOrEqual(1);
    
    expect(screen.getByText('by Organizer Bob')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Saturday Basketball'))).toBeInTheDocument();
  });

  it('displays "No endorsements yet" when list is empty', async () => {
    (endorsementsApi.getUserEndorsements as jest.Mock).mockResolvedValue([]);

    render(<UserProfile />);

    await waitFor(() => {
         expect(endorsementsApi.getUserEndorsements).toHaveBeenCalledWith(101);
    });

    expect(screen.getByText('No endorsements yet')).toBeInTheDocument();
  });

  it('calls refreshUser when viewing own profile', async () => {
    const mockRefreshUser = jest.fn();
    // Override useParams to match the mock user's slug (Test User -> test-user)
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({ username: 'test-user' });
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      refreshUser: mockRefreshUser,
    });
    (endorsementsApi.getUserEndorsements as jest.Mock).mockResolvedValue([]);

    render(<UserProfile />);

    await waitFor(() => {
      expect(mockRefreshUser).toHaveBeenCalled();
    });
  });

  it('shows "View All (N)" when endorsements > 5', async () => {
    // Arrange
    const manyEndorsements = Array.from({ length: 6 }).map((_, i) => ({
      endorsementId: String(i + 1),
      endorserName: `Organizer ${i + 1}`,
      gameTitle: `Game ${i + 1}`,
      gameDate: '2023-11-15T10:00:00',
    }));

    (endorsementsApi.getUserEndorsements as jest.Mock).mockResolvedValue(manyEndorsements);

    // Act
    render(<UserProfile />);

    // Assert
    await waitFor(() => {
      expect(endorsementsApi.getUserEndorsements).toHaveBeenCalledWith(101);
    });

    expect(screen.getByText('View All (6)')).toBeInTheDocument();
  });

  it('handles username param as array (uses first element)', async () => {
    // Arrange: username array case
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({ username: ['test-user'] });

    const refreshUserSpy = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      refreshUser: refreshUserSpy,
    });
    (endorsementsApi.getUserEndorsements as jest.Mock).mockResolvedValue([]);

    // Act
    render(<UserProfile />);

    // Assert: still treated as own profile -> refreshUser called
    await waitFor(() => expect(refreshUserSpy).toHaveBeenCalled());
  });

});
