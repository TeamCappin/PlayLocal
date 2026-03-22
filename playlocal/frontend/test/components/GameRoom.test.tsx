import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { GameRoom } from '../../components/GameRoom';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../hooks/useGames', () => ({
  useGame: jest.fn(),
}));

// Mock toast library for US-7.15
jest.mock('../../lib/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
  getActionableErrorMessage: jest.fn((err, action) => `Couldn't ${action}`),
}));

const mockGamesApiUpdate = jest.fn();

jest.mock('../../lib/api', () => {
  const createMockArrayFn = () => jest.fn(() => Promise.resolve([]));
  const createMockObjectFn = () => jest.fn(() => Promise.resolve({}));

  // Mock OQS data with proper structure
  const createMockOqsFn = () =>
    jest.fn(() =>
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
        confidenceDescription: 'Based on 10 games - score is highly reliable',
        lastCalculatedAt: '2024-01-15T10:00:00Z',
      })
    );

  const createMockOqsInfoCardFn = () =>
    jest.fn(() =>
      Promise.resolve({
        oqsScore: 85.0,
        overallDescription: 'Good organizer with reliable game history',
        gameCompletionRate: 90.0,
        completionRateDescription: 'Good reliability: 9 of 10 games completed',
        completedGames: 9,
        totalGames: 10,
        repeatPlayerRate: 75.0,
        repeatRateDescription:
          'Great retention! 20 of 50 players have returned',
        repeatPlayers: 20,
        totalUniquePlayers: 50,
        confidenceLevel: 'HIGH',
        confidenceDescription: 'Based on 10 games - score is highly reliable',
        gamesForNextLevel: 0,
      })
    );

  return {
    endorsementsApi: {
      create: jest.fn(),
    },
    gamesApi: {
      getUpcoming: createMockArrayFn(),
      getPast: createMockArrayFn(),
      getPastByUserNeedingAttendanceUpdate: createMockArrayFn(),
      getById: createMockObjectFn(),
      getRoster: createMockObjectFn(),
      getTags: createMockArrayFn(),
      create: createMockObjectFn(),
      join: createMockObjectFn(),
      leave: createMockObjectFn(),
      cancel: createMockObjectFn(),
      getGameParticipation: createMockObjectFn(),
      update: (...args: unknown[]) => mockGamesApiUpdate(...args),
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
    usersApi: {
      getProfile: createMockObjectFn(),
      getProfileBySlug: createMockObjectFn(),
      updateProfile: createMockObjectFn(),
      search: createMockObjectFn(),
      getConnectionSignals: createMockObjectFn(),
      getConnectionSignalsBatch: jest.fn(() =>
        Promise.resolve({ signalsByUserId: {} })
      ),
    },
  };
});

jest.mock('lucide-react', () => ({
  MapPin: () => <span data-testid="icon-mappin" />,
  Clock: () => <span data-testid="icon-clock" />,
  Users: () => <span data-testid="icon-users" />,
  MessageCircle: () => <span data-testid="icon-message" />,
  Share2: () => <span data-testid="icon-share" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  ExternalLink: () => <span data-testid="icon-external" />,
  CheckCircle: () => <span data-testid="icon-check" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
  Star: () => <span data-testid="icon-star" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  Sun: () => <span data-testid="icon-sun" />,
  Loader2: () => <span data-testid="icon-loader" />,
  UserMinus: () => <span data-testid="icon-userminus" />,
  LogIn: () => <span data-testid="icon-login" />,
  Flag: () => <span data-testid="icon-flag" />,
  Edit: () => <span data-testid="icon-edit" />,
  Medal: () => <span data-testid="icon-medal" />,
  XCircle: () => <span data-testid="icon-xcircle" />,
  Copy: () => <span data-testid="icon-copy" />,
  Check: () => <span data-testid="icon-checkmark" />,
  Archive: () => <span data-testid="icon-archive" />,
  Info: () => <div data-testid="icon-info" />,
  ChevronDown: () => <div data-testid="icon-chevrondown" />,
  ChevronUp: () => <div data-testid="icon-chevronup" />,
}));

jest.mock('../../components/chat/ChatPanel', () => ({
  ChatPanel: () => <div data-testid="chat-panel" />,
}));

jest.mock('../../components/ReportModal', () => ({
  ReportModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="report-modal">
        Report Modal
        <button onClick={onClose}>Close Report</button>
      </div>
    ) : null,
}));

jest.mock('../../components/JoinConfirmationModal', () => ({
  JoinConfirmationModal: ({ isOpen, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="join-confirmation-modal">
        <button onClick={() => onConfirm([])}>Confirm Join</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

jest.mock('../../components/OrganizerQualityBadge', () => ({
  OrganizerQualityBadge: () => <div data-testid="organizer-quality-badge" />,
}));

jest.mock('../../components/photos/PhotosPanel', () => ({
  PhotosPanel: () => <div data-testid="photos-panel">Photos Panel</div>,
}));

jest.mock('../../components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../hooks/useGames';
import { useParams, useRouter } from 'next/navigation';
import { endorsementsApi, usersApi, gamesApi } from '../../lib/api';

describe('GameRoom Component', () => {
  const mockPush = jest.fn();
  const mockRefetch = jest.fn();
  const mockJoinGame = jest.fn();
  const mockLeaveGame = jest.fn();
  const mockCancelGame = jest.fn();
  const mockCompleteGame = jest.fn();
  const mockArchiveGame = jest.fn();

  const mockUser = {
    userId: 'user-1',
    displayName: 'Test User',
    email: 'test@example.com',
    reliabilityScore: 85,
  };

  const mockGame = {
    gameId: 'game-123',
    title: 'Basketball Game',
    sportName: 'Basketball',
    startTime: new Date('2026-02-01T10:00:00Z').toISOString(),
    endTime: new Date('2026-02-01T12:00:00Z').toISOString(),
    location: { name: 'Test Park' },
    organizer: { userId: 'organizer-1', displayName: 'Organizer' },
    maxPlayers: 10,
    minAge: null,
    maxAge: null,
    tags: [],
    skillBand: 'Intermediate',
    intensityBand: 'Competitive',
    indoorOutdoor: 'outdoor',
    status: 'SCHEDULED',
  };

  const mockRoster = {
    confirmed: [
      {
        participationId: 'p1',
        userId: 'organizer-1',
        displayName: 'Organizer',
        role: 'ORGANIZER',
        joinStatus: 'CONFIRMED',
        attendanceStatus: null,
        reliabilityScore: 100,
      },
    ],
    waitlisted: [],
    maxPlayers: 10,
    spotsAvailable: 9,
  };

  /** Flush async updates (e.g. getConnectionSignalsBatch) to avoid act(...) warnings. */
  async function flushAsyncUpdates() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  let originalConsoleError: typeof console.error;
  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : String(args[0]);
      if (msg.includes('was not wrapped in act(...)')) return;
      originalConsoleError.apply(console, args);
    };
  });
  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (usersApi.getConnectionSignalsBatch as jest.Mock).mockResolvedValue({
      signalsByUserId: {},
    });
    (gamesApi.getTags as jest.Mock).mockResolvedValue([]);
    (useParams as jest.Mock).mockReturnValue({ id: 'game-123' });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
    (useGame as jest.Mock).mockReturnValue({
      game: mockGame,
      roster: mockRoster,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      joinGame: mockJoinGame,
      leaveGame: mockLeaveGame,
      cancelGame: mockCancelGame,
      completeGame: mockCompleteGame,
      archiveGame: mockArchiveGame,
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when data is loading', () => {
      (useGame as jest.Mock).mockReturnValue({
        game: null,
        roster: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });

      render(<GameRoom />);
      expect(screen.getByText('Loading game...')).toBeInTheDocument();
      expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
    });
  });

  describe('Connection signals (US-32)', () => {
    it('displays mutual and co-play counts for other roster players when batch returns signals', async () => {
      const rosterWithOtherPlayer = {
        ...mockRoster,
        confirmed: [
          mockRoster.confirmed[0],
          {
            participationId: 'p2',
            userId: 'player-2',
            displayName: 'Other Player',
            role: 'PLAYER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: 'ATTENDED',
            reliabilityScore: 80,
          },
        ],
      };
      (usersApi.getConnectionSignalsBatch as jest.Mock).mockResolvedValue({
        signalsByUserId: {
          'player-2': { mutualFriendCount: 2, coPlayCount: 3 },
        },
      });
      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: rosterWithOtherPlayer,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });

      render(<GameRoom />);
      await waitFor(() =>
        expect(usersApi.getConnectionSignalsBatch).toHaveBeenCalled()
      );
      await flushAsyncUpdates();

      fireEvent.click(screen.getByRole('button', { name: /Lineup/ }));
      expect(
        await screen.findByText('2 mutuals', {}, { timeout: 3000 })
      ).toBeInTheDocument();
      expect(screen.getByText('Played together 3× (60d)')).toBeInTheDocument();
    });

    it('handles getConnectionSignalsBatch rejection by showing no signals', async () => {
      (usersApi.getConnectionSignalsBatch as jest.Mock).mockRejectedValue(
        new Error('network')
      );
      render(<GameRoom />);
      await flushAsyncUpdates();
      await waitFor(() => {
        expect(usersApi.getConnectionSignalsBatch).toHaveBeenCalled();
      });
      expect(screen.getByText('Organizer')).toBeInTheDocument();
    });

    it('displays connection signals for waitlisted players when batch returns signals', async () => {
      const rosterWithWaitlist = {
        ...mockRoster,
        confirmed: mockRoster.confirmed,
        waitlisted: [
          {
            participationId: 'w1',
            userId: 'waitlist-1',
            displayName: 'Waitlister',
            role: 'PLAYER',
            joinStatus: 'WAITLISTED',
            attendanceStatus: null,
            reliabilityScore: 70,
            waitlistPosition: 1,
          },
        ],
      };
      (usersApi.getConnectionSignalsBatch as jest.Mock).mockResolvedValue({
        signalsByUserId: {
          'waitlist-1': { mutualFriendCount: 1, coPlayCount: 0 },
        },
      });
      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: rosterWithWaitlist,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });

      render(<GameRoom />);
      await waitFor(() =>
        expect(usersApi.getConnectionSignalsBatch).toHaveBeenCalled()
      );
      await flushAsyncUpdates();

      fireEvent.click(screen.getByRole('button', { name: /Lineup/ }));
      expect(
        await screen.findByText('Waitlist (1)', {}, { timeout: 2000 })
      ).toBeInTheDocument();
      expect(
        await screen.findByText(/1 mutual/, {}, { timeout: 3000 })
      ).toBeInTheDocument();
      expect(screen.getByText(/No games together yet/)).toBeInTheDocument();
    });
  });

  describe('Edit Game modal (US-4.3)', () => {
    const futureStart = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const futureEnd = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ).toISOString();
    const gameAsOrganizer = {
      ...mockGame,
      startTime: futureStart,
      endTime: futureEnd,
      organizer: {
        userId: 'user-1',
        displayName: 'Test User',
        reliabilityScore: 85,
      },
    };

    it('opens Edit Game modal, shows Community tags, toggles tag checkbox, and close button dismisses modal', async () => {
      (gamesApi.getTags as jest.Mock).mockResolvedValue([
        { tagId: 't1', name: 'casual', isRestricted: false },
        { tagId: 't2', name: 'competitive', isRestricted: true },
      ]);
      (useGame as jest.Mock).mockReturnValue({
        game: gameAsOrganizer,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });

      render(<GameRoom />);
      await waitFor(() => expect(gamesApi.getTags).toHaveBeenCalled());

      const editButton = screen.getByText('Edit Game').closest('button');
      expect(editButton).toBeInTheDocument();
      fireEvent.click(editButton!);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Community tags')).toBeInTheDocument();
      expect(screen.getByText('Casual')).toBeInTheDocument();
      expect(screen.getByText('Competitive')).toBeInTheDocument();
      expect(screen.getByText('!')).toBeInTheDocument();

      const casualCheckbox = screen.getByRole('checkbox', { name: /casual/i });
      expect(casualCheckbox).not.toBeChecked();
      fireEvent.click(casualCheckbox);
      expect(casualCheckbox).toBeChecked();
      fireEvent.click(casualCheckbox);
      expect(casualCheckbox).not.toBeChecked();

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
    });
  });

  describe('Join Game Flow', () => {
    it('redirects to login when not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      render(<GameRoom />);

      // Look for any button containing "Join"
      const buttons = screen.getAllByRole('button');
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes('Join')
      );

      if (joinButton) {
        fireEvent.click(joinButton);
        expect(mockPush).toHaveBeenCalledWith('/login');
      }
    });

    it('joins game directly when no restrictions', async () => {
      mockJoinGame.mockResolvedValue({
        joinStatus: 'CONFIRMED',
        waitlistPosition: null,
      });

      render(<GameRoom />);

      const buttons = screen.getAllByRole('button');
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes('Join')
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(mockJoinGame).toHaveBeenCalledWith(undefined);
        });

        await waitFor(() => {
          expect(
            screen.getByText('Successfully joined the game!')
          ).toBeInTheDocument();
        });
      }
    });

    it('US-4.1: shows error when user reliability below game minReliabilityRequired', async () => {
      const gameWithMinReliability = {
        ...mockGame,
        minReliabilityRequired: 90,
      };
      (useGame as jest.Mock).mockReturnValue({
        game: gameWithMinReliability,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, reliabilityScore: 70 },
        isAuthenticated: true,
      });

      render(<GameRoom />);

      const buttons = screen.getAllByRole('button');
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes('Join')
      );
      expect(joinButton).toBeDefined();
      fireEvent.click(joinButton!);

      await waitFor(() => {
        const errorEl = screen.getByText(
          (content) =>
            content.includes('Minimum reliability score required') &&
            content.includes('90') &&
            content.includes('70')
        );
        expect(errorEl).toBeInTheDocument();
      });
      expect(mockJoinGame).not.toHaveBeenCalled();
    });

    it('shows confirmation modal when game has restricted tags', async () => {
      const gameWithTags = {
        ...mockGame,
        tags: [{ tagId: 't1', name: 'men', isRestricted: true }],
      };

      (useGame as jest.Mock).mockReturnValue({
        game: gameWithTags,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });

      render(<GameRoom />);

      const buttons = screen.getAllByRole('button');
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes('Join')
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('join-confirmation-modal')
          ).toBeInTheDocument();
        });
      }
    });

    it('closes confirmation modal when cancel is clicked', async () => {
      const gameWithTags = {
        ...mockGame,
        tags: [{ tagId: 't1', name: 'men', isRestricted: true }],
      };

      (useGame as jest.Mock).mockReturnValue({
        game: gameWithTags,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });

      render(<GameRoom />);

      const joinButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Join'));

      expect(joinButton).toBeDefined();
      fireEvent.click(joinButton!);

      await waitFor(() =>
        expect(
          screen.getByTestId('join-confirmation-modal')
        ).toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
      await waitFor(() =>
        expect(
          screen.queryByTestId('join-confirmation-modal')
        ).not.toBeInTheDocument()
      );
    });

    it('shows confirmation modal when game has age requirements', async () => {
      const gameWithAge = {
        ...mockGame,
        minAge: 18,
        maxAge: 35,
      };

      (useGame as jest.Mock).mockReturnValue({
        game: gameWithAge,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });

      render(<GameRoom />);

      const buttons = screen.getAllByRole('button');
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes('Join')
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('join-confirmation-modal')
          ).toBeInTheDocument();
        });
      }
    });

    it('joins after confirming in modal', async () => {
      const gameWithTags = {
        ...mockGame,
        tags: [{ tagId: 't1', name: 'men', isRestricted: true }],
      };

      mockJoinGame.mockResolvedValue({
        joinStatus: 'CONFIRMED',
        waitlistPosition: null,
      });

      (useGame as jest.Mock).mockReturnValue({
        game: gameWithTags,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });

      render(<GameRoom />);

      const buttons = screen.getAllByRole('button');
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes('Join')
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByTestId('join-confirmation-modal')
          ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Confirm Join'));

        await waitFor(() => {
          expect(mockJoinGame).toHaveBeenCalledWith([]);
        });
      }
    });

    it('shows waitlist message when joining full game', async () => {
      mockJoinGame.mockResolvedValue({
        joinStatus: 'WAITLISTED',
        waitlistPosition: 3,
      });

      render(<GameRoom />);

      const buttons = screen.getAllByRole('button');
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes('Join')
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByText(/You're on the waitlist \(#3\)/i)
          ).toBeInTheDocument();
        });
      }
    });

    it('shows error message when join fails', async () => {
      mockJoinGame.mockRejectedValue(new Error('Age confirmation required'));

      render(<GameRoom />);

      const buttons = screen.getAllByRole('button');
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes('Join')
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByText('Age confirmation required')
          ).toBeInTheDocument();
        });
      }
    });

    it('shows fallback error when join fails with empty message', async () => {
      mockJoinGame.mockRejectedValue(new Error());

      render(<GameRoom />);

      const joinButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Join'));
      expect(joinButton).toBeDefined();
      fireEvent.click(joinButton!);

      await waitFor(() => {
        const { toast } = require('../../lib/toast');
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Leave Game Flow', () => {
    it('leaves game successfully', async () => {
      const participantRoster = {
        confirmed: [
          ...mockRoster.confirmed,
          {
            participationId: 'p2',
            userId: 'user-1',
            displayName: 'Test User',
            role: 'PLAYER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: null,
            reliabilityScore: 90,
          },
        ],
        waitlisted: [],
        maxPlayers: 10,
        spotsAvailable: 8,
      };

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: participantRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });

      mockLeaveGame.mockResolvedValue(undefined);

      render(<GameRoom />);

      const buttons = screen.getAllByRole('button');
      const leaveButton = buttons.find((btn) =>
        btn.textContent?.includes('Leave')
      );

      if (leaveButton) {
        fireEvent.click(leaveButton);

        await waitFor(() => {
          expect(mockLeaveGame).toHaveBeenCalled();
        });

        await waitFor(() => {
          expect(
            screen.getByText('Successfully left the game')
          ).toBeInTheDocument();
        });
      }
    });

    it('shows error when leave fails', async () => {
      const participantRoster = {
        confirmed: [
          ...mockRoster.confirmed,
          {
            participationId: 'p2',
            userId: 'user-1',
            displayName: 'Test User',
            role: 'PLAYER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: null,
            reliabilityScore: 90,
          },
        ],
        waitlisted: [],
        maxPlayers: 10,
        spotsAvailable: 8,
      };

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: participantRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });

      mockLeaveGame.mockRejectedValue(new Error('Cannot leave game'));

      render(<GameRoom />);

      const buttons = screen.getAllByRole('button');
      const leaveButton = buttons.find((btn) =>
        btn.textContent?.includes('Leave')
      );

      if (leaveButton) {
        fireEvent.click(leaveButton);

        await waitFor(() => {
          expect(screen.getByText('Cannot leave game')).toBeInTheDocument();
        });
      }
    });

    it('shows fallback error when leave fails with empty message', async () => {
      const participantRoster = {
        confirmed: [
          ...mockRoster.confirmed,
          {
            participationId: 'p2',
            userId: 'user-1',
            displayName: 'Test User',
            role: 'PLAYER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: null,
            reliabilityScore: 90,
          },
        ],
        waitlisted: [],
        maxPlayers: 10,
        spotsAvailable: 8,
      };

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: participantRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });

      mockLeaveGame.mockRejectedValue(new Error());

      render(<GameRoom />);

      const leaveButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Leave'));
      expect(leaveButton).toBeDefined();
      fireEvent.click(leaveButton!);

      await waitFor(() => {
        const { toast } = require('../../lib/toast');
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('US-4.1 Reliability requirements in Details', () => {
    it('shows You meet the requirement when user score >= minReliabilityRequired', () => {
      const gameWithMin = { ...mockGame, minReliabilityRequired: 80 };
      (useGame as jest.Mock).mockReturnValue({
        game: gameWithMin,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, reliabilityScore: 85 },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      expect(
        screen.getByText(/You meet the requirement!/i)
      ).toBeInTheDocument();
    });

    it('shows You need X% to join when user score < minReliabilityRequired', () => {
      const gameWithMin = { ...mockGame, minReliabilityRequired: 90 };
      (useGame as jest.Mock).mockReturnValue({
        game: gameWithMin,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, reliabilityScore: 70 },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      expect(screen.getByText(/You need 90% to join/i)).toBeInTheDocument();
    });

    it('displays Min X% Reliability badge when game has minReliabilityRequired', () => {
      const gameWithMin = { ...mockGame, minReliabilityRequired: 85 };
      (useGame as jest.Mock).mockReturnValue({
        game: gameWithMin,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
      });
      render(<GameRoom />);
      expect(screen.getByText(/Min 85% Reliability/i)).toBeInTheDocument();
    });
  });

  describe('Share, Edit and Cancel (coverage)', () => {
    const futureStart = () => new Date(Date.now() + 86400000).toISOString();
    const futureEnd = () =>
      new Date(Date.now() + 86400000 + 7200000).toISOString();

    it('organizer can open edit modal and cancel', async () => {
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        minReliabilityRequired: 85,
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1', reliabilityScore: 90 },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      const minReliabilityInput = screen.getByLabelText(/Minimum reliability/i);
      fireEvent.change(minReliabilityInput, { target: { value: '90' } });
      fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
    });

    it('organizer cancel game shows confirm then success', async () => {
      mockCancelGame.mockResolvedValue(undefined);
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /Delete Game/i }));
      await waitFor(() =>
        expect(screen.getByText(/Delete this game\?/i)).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole('button', { name: /Yes, Delete/i }));
      await waitFor(() =>
        expect(screen.getByText('Game has been deleted.')).toBeInTheDocument()
      );
    });

    it('organizer save edit modal calls update and shows success', async () => {
      mockGamesApiUpdate.mockResolvedValue(undefined);
      mockRefetch.mockResolvedValue(undefined);
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        minReliabilityRequired: 80,
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
      await waitFor(() =>
        expect(screen.getByText('Changes saved.')).toBeInTheDocument()
      );
      expect(mockGamesApiUpdate).toHaveBeenCalledWith(
        'game-123',
        expect.objectContaining({ minReliabilityRequired: 80 })
      );
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('edit form validation: min players < 2 shows error', async () => {
      mockGamesApiUpdate.mockResolvedValue(undefined);
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      const minPlayersInput = screen.getByLabelText(/Min players/i);
      fireEvent.change(minPlayersInput, { target: { value: '1' } });
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
      await waitFor(() =>
        expect(
          screen.getByText('Minimum players must be at least 2')
        ).toBeInTheDocument()
      );
      expect(mockGamesApiUpdate).not.toHaveBeenCalled();
    });

    it('edit form validation: max players < min shows error', async () => {
      mockGamesApiUpdate.mockResolvedValue(undefined);
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      const minPlayersInput = screen.getByLabelText(/Min players/i);
      const maxPlayersInput = screen.getByLabelText(/Max players/i);
      fireEvent.change(minPlayersInput, { target: { value: '10' } });
      fireEvent.change(maxPlayersInput, { target: { value: '5' } });
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
      await waitFor(() =>
        expect(
          screen.getByText('Maximum players must be at least the minimum')
        ).toBeInTheDocument()
      );
      expect(mockGamesApiUpdate).not.toHaveBeenCalled();
    });

    it('edit form fields: fills location, date/time, description, selects, and saves', async () => {
      mockGamesApiUpdate.mockResolvedValue(undefined);
      mockRefetch.mockResolvedValue(undefined);
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
        indoorOutdoor: 'outdoor',
        skillBand: 'INTERMEDIATE',
        intensityBand: 'COMPETITIVE',
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      const dialog = screen.getByRole('dialog');

      fireEvent.change(within(dialog).getByLabelText(/^Location$/i), {
        target: { value: 'New Venue' },
      });
      fireEvent.change(within(dialog).getByPlaceholderText(/Street address/i), {
        target: { value: '123 Main St' },
      });
      fireEvent.change(
        within(dialog).getByPlaceholderText(/^City \(optional\)$/i),
        { target: { value: 'Boston' } }
      );
      fireEvent.change(within(dialog).getByLabelText(/^Date$/i), {
        target: { value: '2026-03-15' },
      });
      fireEvent.change(within(dialog).getByLabelText(/Start time/i), {
        target: { value: '14:00' },
      });
      fireEvent.change(within(dialog).getByLabelText(/End time/i), {
        target: { value: '16:00' },
      });
      fireEvent.change(within(dialog).getByLabelText(/^Description$/i), {
        target: { value: 'Updated description' },
      });
      fireEvent.change(within(dialog).getByLabelText(/Location type/i), {
        target: { value: 'INDOOR' },
      });
      fireEvent.change(within(dialog).getByLabelText(/Skill level/i), {
        target: { value: 'ADVANCED' },
      });
      fireEvent.change(within(dialog).getByLabelText(/^Intensity$/i), {
        target: { value: 'CASUAL' },
      });
      fireEvent.change(within(dialog).getByLabelText(/Min players/i), {
        target: { value: '4' },
      });
      fireEvent.change(within(dialog).getByLabelText(/Max players/i), {
        target: { value: '12' },
      });
      fireEvent.click(within(dialog).getByLabelText(/Allow waitlist/i));
      fireEvent.change(within(dialog).getByLabelText(/Game visibility/i), {
        target: { value: 'friends' },
      });
      fireEvent.change(within(dialog).getByLabelText(/Min age/i), {
        target: { value: '18' },
      });
      fireEvent.change(within(dialog).getByLabelText(/Max age/i), {
        target: { value: '65' },
      });

      fireEvent.click(
        within(dialog).getByRole('button', { name: /Save Changes/i })
      );
      await waitFor(() =>
        expect(screen.getByText('Changes saved.')).toBeInTheDocument()
      );
      expect(mockGamesApiUpdate).toHaveBeenCalledWith(
        'game-123',
        expect.objectContaining({
          locationName: 'New Venue',
          addressLine: '123 Main St',
          city: 'Boston',
          description: 'Updated description',
          indoorOutdoor: 'INDOOR',
          skillBand: 'ADVANCED',
          intensityBand: 'CASUAL',
          minPlayers: 4,
          maxPlayers: 12,
          allowWaitlist: false,
          visibility: 'friends',
          minAge: 18,
          maxAge: 65,
        })
      );
    });

    it('edit modal closes when clicking backdrop', async () => {
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeTruthy();
      fireEvent.click(backdrop!);
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
    });

    it('edit modal closes when clicking Close button', async () => {
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
    });

    it('organizer save edit shows error when update fails', async () => {
      mockGamesApiUpdate.mockRejectedValue(new Error('Network error'));
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByTitle('Edit game settings'));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
      await waitFor(() => {
        const { toast } = require('../../lib/toast');
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Couldn't update game")
        );
      });
    });

    it('organizer save edit shows fallback error when update fails with empty message', async () => {
      mockGamesApiUpdate.mockRejectedValue(new Error());
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
      await waitFor(() => {
        const { toast } = require('../../lib/toast');
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('organizer can complete game and sees success message', async () => {
      mockCompleteGame.mockResolvedValue(undefined);
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });

      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /Mark Completed/i }));

      await waitFor(() => expect(mockCompleteGame).toHaveBeenCalled());
      await waitFor(() =>
        expect(
          screen.getByText('Game marked as completed.')
        ).toBeInTheDocument()
      );
    });

    it('shows error when complete game action fails', async () => {
      mockCompleteGame.mockRejectedValue(new Error('Cannot complete game'));
      const inProgressGame = {
        ...mockGame,
        status: 'IN_PROGRESS',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: inProgressGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });

      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /Mark Completed/i }));

      await waitFor(() =>
        expect(screen.getByText('Cannot complete game')).toBeInTheDocument()
      );
    });

    it('shows fallback error when complete game fails with empty message', async () => {
      mockCompleteGame.mockRejectedValue(new Error());
      const inProgressGame = {
        ...mockGame,
        status: 'IN_PROGRESS',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: inProgressGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });

      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /Mark Completed/i }));

      await waitFor(() => {
        const { toast } = require('../../lib/toast');
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('organizer can archive game and sees success message', async () => {
      mockArchiveGame.mockResolvedValue(undefined);
      const completedGame = {
        ...mockGame,
        status: 'COMPLETED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: completedGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });

      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /Archive Game/i }));

      await waitFor(() => expect(mockArchiveGame).toHaveBeenCalled());
      await waitFor(() =>
        expect(screen.getByText('Game archived.')).toBeInTheDocument()
      );
    });

    it('shows error when archive game action fails', async () => {
      mockArchiveGame.mockRejectedValue(new Error('Cannot archive game'));
      const cancelledGame = {
        ...mockGame,
        status: 'CANCELLED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: cancelledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });

      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /Archive Game/i }));

      await waitFor(() =>
        expect(screen.getByText('Cannot archive game')).toBeInTheDocument()
      );
    });

    it('shows fallback error when archive game fails with empty message', async () => {
      mockArchiveGame.mockRejectedValue(new Error());
      const completedGame = {
        ...mockGame,
        status: 'COMPLETED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: completedGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
        completeGame: mockCompleteGame,
        archiveGame: mockArchiveGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });

      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /Archive Game/i }));

      await waitFor(() => {
        const { toast } = require('../../lib/toast');
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('dispatches playlocal-refresh events on successful update', async () => {
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      mockGamesApiUpdate.mockResolvedValue(undefined);
      mockRefetch.mockResolvedValue(undefined);
      const scheduledGame = {
        ...mockGame,
        status: 'SCHEDULED',
        startTime: futureStart(),
        endTime: futureEnd(),
      };
      (useGame as jest.Mock).mockReturnValue({
        game: scheduledGame,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
      await waitFor(() =>
        expect(screen.getByText('Changes saved.')).toBeInTheDocument()
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'playlocal-refresh-notifications' })
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'playlocal-refresh-games' })
      );
      dispatchSpy.mockRestore();
    });
  });

  describe('Endorsement Flow', () => {
    it('handles endorsement with FINISHED game and ATTENDED status', async () => {
      const finishedGame = {
        ...mockGame,
        status: 'FINISHED',
      };

      const participantRoster = {
        confirmed: [
          {
            participationId: 'p1',
            userId: 'organizer-1',
            displayName: 'Organizer',
            role: 'ORGANIZER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: 'ATTENDED',
            reliabilityScore: 100,
          },
          {
            participationId: 'p2',
            userId: 'user-1',
            displayName: 'Test User',
            role: 'PLAYER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: 'ATTENDED',
            reliabilityScore: 90,
          },
        ],
        waitlisted: [],
        maxPlayers: 10,
        spotsAvailable: 8,
      };

      (useGame as jest.Mock).mockReturnValue({
        game: finishedGame,
        roster: participantRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });

      render(<GameRoom />);

      // Just verify the component renders with FINISHED status
      const lineupTab = screen.getByRole('button', { name: /Lineup/i });
      expect(lineupTab).toBeInTheDocument();
    });

    it('endorsement success shows success message', async () => {
      (endorsementsApi.create as jest.Mock).mockResolvedValue(undefined);
      const finishedGame = { ...mockGame, status: 'FINISHED' };
      const rosterWithAttended = {
        confirmed: [
          {
            participationId: 'p1',
            userId: 'organizer-1',
            displayName: 'Organizer',
            role: 'ORGANIZER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: 'ATTENDED',
            reliabilityScore: 100,
            isEndorsedByOrganizer: false,
          },
          {
            participationId: 'p2',
            userId: 'user-2',
            displayName: 'Other',
            role: 'PLAYER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: 'ATTENDED',
            reliabilityScore: 85,
            isEndorsedByOrganizer: false,
          },
        ],
        waitlisted: [],
        maxPlayers: 10,
        spotsAvailable: 8,
      };
      (useGame as jest.Mock).mockReturnValue({
        game: finishedGame,
        roster: rosterWithAttended,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /Lineup/i }));
      await waitFor(() =>
        expect(
          screen.getByTitle("Endorse as Organizer's Pick")
        ).toBeInTheDocument()
      );
      fireEvent.click(screen.getByTitle("Endorse as Organizer's Pick"));
      await waitFor(() =>
        expect(
          screen.getByText('Player endorsed successfully!')
        ).toBeInTheDocument()
      );
    });

    it('endorsement duplicate refetches without showing error', async () => {
      (endorsementsApi.create as jest.Mock).mockRejectedValue(
        new Error('Duplicate endorsement exists')
      );
      const finishedGame = { ...mockGame, status: 'FINISHED' };
      const rosterWithAttended = {
        confirmed: [
          {
            participationId: 'p1',
            userId: 'organizer-1',
            displayName: 'Organizer',
            role: 'ORGANIZER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: 'ATTENDED',
            reliabilityScore: 100,
            isEndorsedByOrganizer: false,
          },
          {
            participationId: 'p2',
            userId: 'user-2',
            displayName: 'Other',
            role: 'PLAYER',
            joinStatus: 'CONFIRMED',
            attendanceStatus: 'ATTENDED',
            reliabilityScore: 85,
            isEndorsedByOrganizer: false,
          },
        ],
        waitlisted: [],
        maxPlayers: 10,
        spotsAvailable: 8,
      };
      (useGame as jest.Mock).mockReturnValue({
        game: finishedGame,
        roster: rosterWithAttended,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, userId: 'organizer-1' },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole('button', { name: /Lineup/i }));
      await waitFor(() =>
        expect(
          screen.getByTitle("Endorse as Organizer's Pick")
        ).toBeInTheDocument()
      );
      fireEvent.click(screen.getByTitle("Endorse as Organizer's Pick"));
      await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
      expect(
        screen.queryByText('Failed to endorse player')
      ).not.toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to chat tab', () => {
      render(<GameRoom />);

      const chatTab = screen.getByText('Chat');
      fireEvent.click(chatTab);

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    });

    it('switches to lineup tab', () => {
      render(<GameRoom />);

      const lineupTab = screen.getByRole('button', { name: /Lineup/i });
      fireEvent.click(lineupTab);

      // Check for "Confirmed" heading instead of "Confirmed Players"
      expect(screen.getByText(/Confirmed \(/i)).toBeInTheDocument();
    });

    it('switches to photos tab and back to details tab', () => {
      render(<GameRoom />);

      fireEvent.click(screen.getByRole('button', { name: /Album/i }));
      expect(screen.getByTestId('photos-panel')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Details/i }));
      expect(screen.getByText(/About this game/i)).toBeInTheDocument();
    });
  });

  describe('Report Modal', () => {
    it('opens report modal when flag button is clicked', () => {
      render(<GameRoom />);

      const reportButton = screen.getByText(/Report Game/i);
      fireEvent.click(reportButton);

      expect(screen.getByTestId('report-modal')).toBeInTheDocument();
    });

    it('closes report modal when onClose is triggered', async () => {
      render(<GameRoom />);

      fireEvent.click(screen.getByText(/Report Game/i));
      expect(screen.getByTestId('report-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close Report'));
      await waitFor(() =>
        expect(screen.queryByTestId('report-modal')).not.toBeInTheDocument()
      );
    });
  });

  describe('Waitlist Display', () => {
    it('shows waitlist badge for waitlisted users', () => {
      const waitlistedRoster = {
        confirmed: mockRoster.confirmed,
        waitlisted: [
          {
            participationId: 'p2',
            userId: 'user-1',
            displayName: 'Test User',
            role: 'PLAYER',
            joinStatus: 'WAITLISTED',
            attendanceStatus: null,
            reliabilityScore: 90,
          },
        ],
        maxPlayers: 10,
        spotsAvailable: 0,
      };

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: waitlistedRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
      });

      render(<GameRoom />);

      const lineupTab = screen.getByRole('button', { name: /Lineup/i });
      fireEvent.click(lineupTab);

      // Use getAllByText since "Waitlist" appears multiple times
      const waitlistElements = screen.getAllByText(/Waitlist/i);
      expect(waitlistElements.length).toBeGreaterThan(0);
    });
  });

  // US-2.4: Share Game Feature Tests
  describe('US-2.4: Share Game Feature', () => {
    it('should copy link to clipboard when share clicked', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        configurable: true,
      });

      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        sport: { sportId: 'sport-1', name: 'Basketball' },
        location: {
          name: 'Test Location',
          city: 'Test City',
        },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        minPlayers: 2,
        confirmedCount: 5,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-456',
      });
      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 5,
        },
        isLoading: false,
        error: null,
        cancelGame: jest.fn(),
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText('Share Game'));

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalled();
        expect(screen.getByText('Link Copied!')).toBeInTheDocument();
      });
    });

    it('should use fallback copy method when clipboard API fails', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest
            .fn()
            .mockRejectedValue(new Error('Clipboard API not supported')),
        },
        configurable: true,
      });

      // Mock document.execCommand
      const mockExecCommand = jest.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-456',
      });
      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 5,
        },
        isLoading: false,
        error: null,
        cancelGame: jest.fn(),
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText('Share Game'));

      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
        expect(screen.getByText('Link Copied!')).toBeInTheDocument();
      });
    });
  });

  // US-2.4: Cancel Game Feature Tests
  describe('US-2.4: Cancel Game Feature', () => {
    const mockCancelGame = jest.fn();

    it('should show cancel button for organizer on scheduled game', () => {
      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-123',
        user: { userId: 'user-123' },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 10,
        },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);
      expect(screen.getByText('Delete Game')).toBeInTheDocument();
    });

    it('should not show cancel button for non-organizer', () => {
      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'organizer-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'different-user',
        user: { userId: 'different-user' },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 10,
        },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);
      expect(screen.queryByText('Delete Game')).not.toBeInTheDocument();
    });

    it('should show confirmation dialog when cancel button clicked', async () => {
      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-123',
        user: { userId: 'user-123' },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 10,
        },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText('Delete Game'));

      await waitFor(() => {
        expect(screen.getByText(/Delete this game\?/i)).toBeInTheDocument();
        expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
        expect(screen.getByText('Keep Game')).toBeInTheDocument();
      });
    });

    it('should cancel confirmation dialog when No Keep clicked', async () => {
      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-123',
        user: { userId: 'user-123' },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 10,
        },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText('Delete Game'));

      await waitFor(() => {
        expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Keep Game'));

      await waitFor(() => {
        expect(
          screen.queryByText(/Delete this game\?/i)
        ).not.toBeInTheDocument();
      });

      expect(mockCancelGame).not.toHaveBeenCalled();
    });

    it('should call cancelGame when confirmed', async () => {
      mockCancelGame.mockResolvedValue({});

      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-123',
        user: { userId: 'user-123' },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 10,
        },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText('Delete Game'));

      await waitFor(() => {
        expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Yes, Delete'));

      await waitFor(() => {
        expect(mockCancelGame).toHaveBeenCalled();
        expect(screen.getByText('Game has been deleted.')).toBeInTheDocument();
      });
    });

    it('should show error when cancel fails', async () => {
      mockCancelGame.mockRejectedValue(
        new Error('Only the organizer can cancel this game')
      );

      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-123',
        user: { userId: 'user-123' },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 10,
        },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText('Delete Game'));

      await waitFor(() => {
        expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Yes, Delete'));

      await waitFor(() => {
        const { toast } = require('../../lib/toast');
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Couldn't delete game")
        );
      });
    });

    it('should show fallback error when cancel fails with empty message', async () => {
      mockCancelGame.mockRejectedValue(new Error());

      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-123',
        user: { userId: 'user-123' },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 10,
        },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText('Delete Game'));

      await waitFor(() => {
        expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Yes, Delete'));

      await waitFor(() => {
        const { toast } = require('../../lib/toast');
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Couldn't delete game"));
      });
    });

    it('should show cancelled badge when game is cancelled', () => {
      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'CANCELLED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-456',
        user: { userId: 'user-456' },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 10,
        },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      expect(
        screen.getByText('This game has been deleted')
      ).toBeInTheDocument();
    });

    it('should not show cancel button for cancelled game', () => {
      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'CANCELLED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: 'user-123',
        user: { userId: 'user-123' },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: {
          confirmed: [],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 10,
        },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      expect(screen.queryByText('Cancel Game')).not.toBeInTheDocument();
    });
  });

  // BUG-2.2: Game Not Found State Tests
  describe('BUG-2.2: Game Not Found State', () => {
    it('should show not found message when game is null', () => {
      (useGame as jest.Mock).mockReturnValue({
        game: null,
        roster: null,
        isLoading: false,
        error: null,
        cancelGame: jest.fn(),
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      expect(screen.getByText('Game Not Found')).toBeInTheDocument();
      expect(
        screen.getByText(/This game may have been removed or doesn't exist/i)
      ).toBeInTheDocument();
      expect(screen.getByText('Browse Games')).toBeInTheDocument();
    });

    it('should show not found message when roster is null', () => {
      const mockGame = {
        gameId: 'test-id',
        title: 'Test Game',
        status: 'SCHEDULED',
        organizer: {
          userId: 'user-123',
          displayName: 'Test Organizer',
          reliabilityScore: 95,
        },
        location: { name: 'Test Location', city: 'Test City' },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        description: 'Test game',
        tags: [],
      };

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: null,
        isLoading: false,
        error: null,
        cancelGame: jest.fn(),
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      expect(screen.getByText('Game Not Found')).toBeInTheDocument();
    });
  });
  describe('Additional coverage: Location rendering & links', () => {
    it('renders exact location with lat/lng and builds Google Maps link using coordinates', () => {
      const gameWithCoords = {
        ...mockGame,
        hasExactLocationAccess: true,
        location: {
          name: 'Parc Jarry Courts',
          addressLine: '201 Rue Gary-Carter, Montréal, QC H2R 2W1',
          city: 'Montreal',
          latitude: 45.5312,
          longitude: -73.6205,
        },
      };

      (useGame as jest.Mock).mockReturnValue({
        game: gameWithCoords,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });

      render(<GameRoom />);

      expect(screen.getByText('Location')).toBeInTheDocument();

      const openMaps = screen.getByRole('link', {
        name: /Open in Google Maps/i,
      });
      expect(openMaps).toHaveAttribute(
        'href',
        expect.stringContaining('query=45.5312,-73.6205')
      );
    });

    it('renders exact location without lat/lng and builds Google Maps link using encoded address/name/city', () => {
      const gameWithAddressOnly = {
        ...mockGame,
        hasExactLocationAccess: true,
        location: {
          name: 'Test Park',
          addressLine: '123 Main St, Montreal, QC',
          city: 'Montreal',
          latitude: undefined,
          longitude: undefined,
        },
      };

      (useGame as jest.Mock).mockReturnValue({
        game: gameWithAddressOnly,
        roster: mockRoster,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
        cancelGame: mockCancelGame,
      });

      render(<GameRoom />);

      const openMaps = screen.getByRole('link', {
        name: /Open in Google Maps/i,
      });
      expect(openMaps).toHaveAttribute(
        'href',
        expect.stringContaining('query=123%20Main%20St%2C%20Montreal%2C%20QC')
      );
    });

    describe('Additional coverage: Endorsement error (non-duplicate)', () => {
      it('shows error message when endorsement fails for reasons other than duplicate', async () => {
        (endorsementsApi.create as jest.Mock).mockRejectedValue(
          new Error('Server is down')
        );

        const finishedGame = { ...mockGame, status: 'FINISHED' };
        const rosterWithAttended = {
          confirmed: [
            {
              participationId: 'p1',
              userId: 'organizer-1',
              displayName: 'Organizer',
              role: 'ORGANIZER',
              joinStatus: 'CONFIRMED',
              attendanceStatus: 'ATTENDED',
              reliabilityScore: 100,
              isEndorsedByOrganizer: false,
            },
            {
              participationId: 'p2',
              userId: 'user-2',
              displayName: 'Other Player',
              role: 'PLAYER',
              joinStatus: 'CONFIRMED',
              attendanceStatus: 'ATTENDED',
              reliabilityScore: 85,
              isEndorsedByOrganizer: false,
            },
          ],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 8,
        };

        (useAuth as jest.Mock).mockReturnValue({
          user: { ...mockUser, userId: 'organizer-1' },
          isAuthenticated: true,
        });

        (useGame as jest.Mock).mockReturnValue({
          game: finishedGame,
          roster: rosterWithAttended,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          joinGame: mockJoinGame,
          leaveGame: mockLeaveGame,
          cancelGame: mockCancelGame,
        });

        render(<GameRoom />);

        // Go to lineup where endorsement button exists
        fireEvent.click(screen.getByRole('button', { name: /Lineup/i }));

        await waitFor(() =>
          expect(
            screen.getByTitle("Endorse as Organizer's Pick")
          ).toBeInTheDocument()
        );

        fireEvent.click(screen.getByTitle("Endorse as Organizer's Pick"));

        await waitFor(() => {
          expect(screen.getByText('Server is down')).toBeInTheDocument();
        });

        // Ensure it didn't silently refetch like the duplicate path
        expect(mockRefetch).not.toHaveBeenCalled();
      });

      it('shows fallback error when endorsement fails with empty message', async () => {
        (endorsementsApi.create as jest.Mock).mockRejectedValue(new Error());

        const finishedGame = { ...mockGame, status: 'FINISHED' };
        const rosterWithAttended = {
          confirmed: [
            {
              participationId: 'p1',
              userId: 'organizer-1',
              displayName: 'Organizer',
              role: 'ORGANIZER',
              joinStatus: 'CONFIRMED',
              attendanceStatus: 'ATTENDED',
              reliabilityScore: 100,
              isEndorsedByOrganizer: false,
            },
            {
              participationId: 'p2',
              userId: 'user-2',
              displayName: 'Other Player',
              role: 'PLAYER',
              joinStatus: 'CONFIRMED',
              attendanceStatus: 'ATTENDED',
              reliabilityScore: 85,
              isEndorsedByOrganizer: false,
            },
          ],
          waitlisted: [],
          maxPlayers: 10,
          spotsAvailable: 8,
        };

        (useAuth as jest.Mock).mockReturnValue({
          user: { ...mockUser, userId: 'organizer-1' },
          isAuthenticated: true,
        });

        (useGame as jest.Mock).mockReturnValue({
          game: finishedGame,
          roster: rosterWithAttended,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          joinGame: mockJoinGame,
          leaveGame: mockLeaveGame,
          cancelGame: mockCancelGame,
        });

        render(<GameRoom />);

        fireEvent.click(screen.getByRole('button', { name: /Lineup/i }));

        await waitFor(() =>
          expect(
            screen.getByTitle("Endorse as Organizer's Pick")
          ).toBeInTheDocument()
        );

        fireEvent.click(screen.getByTitle("Endorse as Organizer's Pick"));

        await waitFor(() => {
          expect(
            screen.getByText('Failed to endorse player')
          ).toBeInTheDocument();
        });
      });
    });

    describe('Additional coverage: Edit modal clear + update undefined', () => {
      const futureStart = () => new Date(Date.now() + 86400000).toISOString();
      const futureEnd = () =>
        new Date(Date.now() + 86400000 + 7200000).toISOString();

      it('clearing minReliabilityRequired sends undefined in update payload', async () => {
        mockGamesApiUpdate.mockResolvedValue(undefined);
        mockRefetch.mockResolvedValue(undefined);

        const scheduledGame = {
          ...mockGame,
          status: 'SCHEDULED',
          startTime: futureStart(),
          endTime: futureEnd(),
          minReliabilityRequired: 80,
        };

        (useAuth as jest.Mock).mockReturnValue({
          user: { ...mockUser, userId: 'organizer-1' },
          isAuthenticated: true,
        });

        (useGame as jest.Mock).mockReturnValue({
          game: scheduledGame,
          roster: mockRoster,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          joinGame: mockJoinGame,
          leaveGame: mockLeaveGame,
          cancelGame: mockCancelGame,
        });

        render(<GameRoom />);

        // Open edit modal
        fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
        await waitFor(() =>
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        );

        // Clear input using the "Clear" button (branch coverage)
        fireEvent.click(screen.getByRole('button', { name: /Clear/i }));

        // Save changes
        fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

        await waitFor(() =>
          expect(mockGamesApiUpdate).toHaveBeenCalledWith(
            'game-123',
            expect.objectContaining({ minReliabilityRequired: undefined })
          )
        );
      });
    });

    describe('Additional coverage: Join when user is missing but authenticated', () => {
      it('allows join when user is null (meetsReliabilityRequirement path uses !user)', async () => {
        mockJoinGame.mockResolvedValue({
          joinStatus: 'CONFIRMED',
          waitlistPosition: null,
        });

        const gatedGame = { ...mockGame, minReliabilityRequired: 95 };

        (useAuth as jest.Mock).mockReturnValue({
          user: null,
          isAuthenticated: true,
        });

        (useGame as jest.Mock).mockReturnValue({
          game: gatedGame,
          roster: mockRoster,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          joinGame: mockJoinGame,
          leaveGame: mockLeaveGame,
          cancelGame: mockCancelGame,
        });

        render(<GameRoom />);

        const buttons = screen.getAllByRole('button');
        const joinButton = buttons.find((btn) =>
          btn.textContent?.includes('Join')
        );
        expect(joinButton).toBeDefined();

        fireEvent.click(joinButton!);

        await waitFor(() => {
          expect(mockJoinGame).toHaveBeenCalledWith(undefined);
        });
      });
    });

    describe('Additional coverage: statusKey, endTime fallback, tags filter', () => {
      const futureStart = () => new Date(Date.now() + 86400000).toISOString();

      it('handles game with null status (statusKey fallback to SCHEDULED)', () => {
        const gameNullStatus = { ...mockGame, status: null as any };
        (useGame as jest.Mock).mockReturnValue({
          game: gameNullStatus,
          roster: mockRoster,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          joinGame: mockJoinGame,
          leaveGame: mockLeaveGame,
          cancelGame: mockCancelGame,
        });
        render(<GameRoom />);
        expect(screen.getByText(/About this game/i)).toBeInTheDocument();
      });

      it('handles game with null endTime when opening edit modal', async () => {
        const gameNoEndTime = {
          ...mockGame,
          startTime: futureStart(),
          endTime: null as any,
          indoorOutdoor: 'outdoor',
          skillBand: 'INTERMEDIATE',
          intensityBand: 'COMPETITIVE',
          minAge: 18,
          maxAge: 65,
          tags: [{ tagId: 't1', name: 'women', isRestricted: true }],
        };
        (useGame as jest.Mock).mockReturnValue({
          game: gameNoEndTime,
          roster: mockRoster,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          joinGame: mockJoinGame,
          leaveGame: mockLeaveGame,
          cancelGame: mockCancelGame,
        });
        (useAuth as jest.Mock).mockReturnValue({
          user: { ...mockUser, userId: 'organizer-1' },
          isAuthenticated: true,
        });
        render(<GameRoom />);
        fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
        await waitFor(() =>
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        );
        const minAgeInput = screen.getByLabelText(
          /Min age/i
        ) as HTMLInputElement;
        const maxAgeInput = screen.getByLabelText(
          /Max age/i
        ) as HTMLInputElement;
        expect(String(minAgeInput.value)).toBe('18');
        expect(String(maxAgeInput.value)).toBe('65');
      });

      it('passes restricted tags to JoinConfirmationModal when game has isRestricted tags', async () => {
        const gameWithRestrictedTags = {
          ...mockGame,
          tags: [
            { tagId: 't1', name: 'women', isRestricted: true },
            { tagId: 't2', name: 'casual', isRestricted: false },
          ],
        };
        (useGame as jest.Mock).mockReturnValue({
          game: gameWithRestrictedTags,
          roster: mockRoster,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          joinGame: mockJoinGame,
          leaveGame: mockLeaveGame,
        });
        render(<GameRoom />);
        const joinButton = screen
          .getAllByRole('button')
          .find((btn) => btn.textContent?.includes('Join'));
        expect(joinButton).toBeDefined();
        fireEvent.click(joinButton!);
        await waitFor(() =>
          expect(
            screen.getByTestId('join-confirmation-modal')
          ).toBeInTheDocument()
        );
      });
    });

    describe('Additional coverage: handleUpdateGame early return when no id', () => {
      const futureStart = () => new Date(Date.now() + 86400000).toISOString();

      it('handleUpdateGame returns early when id is missing', async () => {
        (useParams as jest.Mock).mockReturnValue({});
        mockGamesApiUpdate.mockClear();
        const scheduledGame = {
          ...mockGame,
          status: 'SCHEDULED',
          startTime: futureStart(),
          endTime: new Date(Date.now() + 86400000 + 7200000).toISOString(),
        };
        (useGame as jest.Mock).mockReturnValue({
          game: scheduledGame,
          roster: mockRoster,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          joinGame: mockJoinGame,
          leaveGame: mockLeaveGame,
          cancelGame: mockCancelGame,
        });
        (useAuth as jest.Mock).mockReturnValue({
          user: { ...mockUser, userId: 'organizer-1' },
          isAuthenticated: true,
        });
        render(<GameRoom />);
        fireEvent.click(screen.getByRole('button', { name: /^Edit Game$/i }));
        await waitFor(() =>
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        );
        fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
        expect(mockGamesApiUpdate).not.toHaveBeenCalled();
      });
    });

    describe('Additional coverage: Spots Available Full label', () => {
      it('shows "Full" when spotsAvailable is 0', () => {
        const fullGame = { ...mockGame, maxPlayers: 1 };
        const fullRoster = {
          ...mockRoster,
          confirmed: [
            {
              participationId: 'p1',
              userId: 'organizer-1',
              displayName: 'Organizer',
              role: 'ORGANIZER',
              joinStatus: 'CONFIRMED',
              attendanceStatus: null,
              reliabilityScore: 100,
            },
          ],
          waitlisted: [],
          maxPlayers: 1,
          spotsAvailable: 0,
        };

        (useGame as jest.Mock).mockReturnValue({
          game: fullGame,
          roster: fullRoster,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
          joinGame: mockJoinGame,
          leaveGame: mockLeaveGame,
          cancelGame: mockCancelGame,
        });

        render(<GameRoom />);

        expect(screen.getByText('Spots Available')).toBeInTheDocument();
        expect(screen.getByText('Full')).toBeInTheDocument();
      });
    }); //describe
  });
});
