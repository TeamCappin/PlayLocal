import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchRecap } from '../../components/MatchRecap';
import { useParams } from 'next/navigation';
import { gamesApi } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

jest.mock('lucide-react', () => ({
  Share2: () => <div data-testid="icon-share" />,
  Download: () => <div data-testid="icon-download" />,
  Trophy: () => <div data-testid="icon-trophy" />,
  Users: () => <div data-testid="icon-users" />,
  MapPin: () => <div data-testid="icon-map" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  Star: () => <div data-testid="icon-star" />,
  TrendingUp: () => <div data-testid="icon-trending" />,
  Camera: () => <div data-testid="icon-camera" />,
  MessageCircle: () => <div data-testid="icon-message" />,
  ThumbsUp: () => <div data-testid="icon-thumbs-up" />,
  Award: () => <div data-testid="icon-award" />,
  X: () => <div data-testid="icon-x" />,
  Loader2: () => <div data-testid="icon-loader" />
}));

jest.mock('@/lib/api', () => ({
  gamesApi: {
    getMatchRecap: jest.fn(),
    getById: jest.fn(),
    getRoster: jest.fn()
  }
}));

describe('MatchRecap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: 'game-1' });
    ((gamesApi as any).getMatchRecap as jest.Mock).mockResolvedValue({
      id: 'game-1',
      gameTitle: '5v5 Basketball Pickup',
      sport: 'Basketball',
      date: 'December 18, 2024',
      location: 'Downtown Rec Center',
      duration: '90m',
      score: '84 - 76', // Team A won
      teamA: {
        name: 'Team A',
        players: [{ id: '1', name: 'Alex' }]
      },
      teamB: {
        name: 'Team B',
        players: [{ id: '2', name: 'Bob' }]
      },
      mvp: {
        id: '1',
        name: 'Alex'
      },
      stats: {
        teamAPoints: 84,
        teamBPoints: 76,
      }
    });
    
    (gamesApi.getById as jest.Mock).mockResolvedValue({
       title: '5v5 Basketball Pickup',
       status: 'COMPLETED',
       sportName: 'Basketball',
       startTime: '2024-12-18T18:00:00Z',
       endTime: '2024-12-18T20:00:00Z',
       location: { name: 'Downtown Rec Center' }
    });
    
    (gamesApi.getRoster as jest.Mock).mockResolvedValue({
      confirmed: [
        { userId: '1', displayName: 'Alex', attendanceStatus: 'ATTENDED' },
        { userId: '2', displayName: 'Bob', attendanceStatus: 'ATTENDED' }
      ]
    });
  });

  it('renders match recap tabs', async () => {
    render(<MatchRecap />);
    // Just simple wait to allow whatever effects
    await waitFor(() => {
      expect(screen.getByText('5v5 Basketball Pickup')).toBeInTheDocument();
    });
    
    // Tab switching
    const statsTab = screen.getByText('Player Stats');
    fireEvent.click(statsTab);
    
    // There shouldn't strictly be Highlights tab if not visible, maybe only these two?
    const summaryTab = screen.getByText('Summary');
    fireEvent.click(summaryTab);
  });
  
  it('opens rate modal', async () => {
    render(<MatchRecap />);
    
    await waitFor(() => {
      const rateButtons = screen.getAllByRole('button', { name: /Rate/i });
      expect(rateButtons.length).toBeGreaterThan(0);
      fireEvent.click(rateButtons[0]);
    });
  });
});
