import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameRoom } from '../components/GameRoom';
import '@testing-library/jest-dom';

// Mock mocks
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'game-123' }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/useGames', () => ({
  useGame: jest.fn(),
}));

jest.mock('../lib/api', () => ({
  endorsementsApi: {
    create: jest.fn(),
  },
  gamesApi: {
     // ... mock other api calls if necessary
  }
}));

// Mock Lucide icons to avoid render issues (optional)
jest.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="icon-mappin" />,
  Clock: () => <div data-testid="icon-clock" />,
  Users: () => <div data-testid="icon-users" />,
  MessageCircle: () => <div data-testid="icon-message" />,
  Share2: () => <div data-testid="icon-share" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  ExternalLink: () => <div data-testid="icon-external" />,
  CheckCircle: () => <div data-testid="icon-check" />,
  TrendingUp: () => <div data-testid="icon-trending" />,
  Star: () => <div data-testid="icon-star" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
  Sun: () => <div data-testid="icon-sun" />,
  Loader2: () => <div data-testid="icon-loader" />,
  UserMinus: () => <div data-testid="icon-userminus" />,
  LogIn: () => <div data-testid="icon-login" />,
  Flag: () => <div data-testid="icon-flag" />,
  Medal: () => <div data-testid="icon-medal" role="img" title="Icon Medal" />,
}));

// Mock ChatPanel to avoid complex sub-component rendering
jest.mock('../components/chat/ChatPanel', () => ({
    ChatPanel: () => <div data-testid="chat-panel" />
}));

import { useAuth } from '../context/AuthContext';
import { useGame } from '../hooks/useGames';
import { endorsementsApi } from '../lib/api';

describe('GameRoom Endorsement UI', () => {
  const mockUser = { userId: 'organizer-id', displayName: 'Organizer', email: 'org@example.com' };
  
  const mockGame = {
    gameId: 'game-123',
    title: 'Test Game',
    startTime: new Date().toISOString(),
    organizer: { userId: 'organizer-id', displayName: 'Organizer' },
    maxPlayers: 10,
    status: 'FINISHED',
  };

  const mockRoster = {
    confirmed: [
      {
        participationId: 'p1',
        userId: 'organizer-id',
        displayName: 'Organizer',
        role: 'ORGANIZER',
        joinStatus: 'CONFIRMED',
        attendanceStatus: 'ATTENDED',
        reliabilityScore: 100
      },
      {
        participationId: 'p2',
        userId: 'player-id',
        displayName: 'Player One',
        role: 'PLAYER', 
        joinStatus: 'CONFIRMED',
        attendanceStatus: 'ATTENDED', // Eligible
        reliabilityScore: 90
      },
       {
        participationId: 'p3',
        userId: 'player-absent',
        displayName: 'Player Absent',
        role: 'PLAYER', 
        joinStatus: 'CONFIRMED',
        attendanceStatus: 'NO_SHOW', // Not Eligible
        reliabilityScore: 80
      }
    ],
    waitlisted: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders endorsement button for organizer when player attended', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, isAuthenticated: true });
    (useGame as jest.Mock).mockReturnValue({ 
      game: mockGame, 
      roster: mockRoster, 
      isLoading: false, 
      error: null,
      joinGame: jest.fn(),
      leaveGame: jest.fn()
    });

    render(<GameRoom />);

    // Switch to Lineup tab where the roster is displayed
    const lineupTab = screen.getByText(/Lineup/i);
    fireEvent.click(lineupTab);

    // Look for endorsement buttons (Medal icon)
    // We expect ONE button for 'Player One'.
    // Organizer (self) -> No button
    // Player One (Attended) -> Button
    // Player Absent (No Show) -> No button
    
    // Since Lucide icons are mocked, we look for the mock element or the title put on the button
    const endorseButtons = screen.getAllByTitle("Endorse as Organizer's Pick");
    expect(endorseButtons).toHaveLength(1);
  });

  it('calls endorsement API when button is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, isAuthenticated: true });
    (useGame as jest.Mock).mockReturnValue({ 
      game: mockGame, 
      roster: mockRoster, 
      isLoading: false, 
      error: null,
      joinGame: jest.fn(),
      leaveGame: jest.fn()
    });
    (endorsementsApi.create as jest.Mock).mockResolvedValue({});

    render(<GameRoom />);

    fireEvent.click(screen.getByText(/Lineup/i));

    const endorseButton = screen.getByTitle("Endorse as Organizer's Pick");
    fireEvent.click(endorseButton);

    await waitFor(() => {
      expect(endorsementsApi.create).toHaveBeenCalledWith({
        endorsedUserId: 'player-id',
        gameId: 'game-123'
      });
    });

    // Check for success message
    // Note: The code uses setTimeout to clear message, so findByText should work
    expect(await screen.findByText('Player endorsed successfully!')).toBeInTheDocument();
  });

  it('does NOT render endorsement button for non-organizers', () => {
    const regularUser = { userId: 'player-id', displayName: 'Player One' };
    (useAuth as jest.Mock).mockReturnValue({ user: regularUser, isAuthenticated: true });
    (useGame as jest.Mock).mockReturnValue({ 
      game: mockGame, 
      roster: mockRoster, 
      isLoading: false, 
      error: null,
      joinGame: jest.fn(),
      leaveGame: jest.fn()
    });

    render(<GameRoom />);
    fireEvent.click(screen.getByText(/Lineup/i));

    const endorseButtons = screen.queryAllByTitle("Endorse as Organizer's Pick");
    expect(endorseButtons).toHaveLength(0);
  });
});
