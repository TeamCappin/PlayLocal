import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from '../../components/UserProfile';

// Mock all internal hooks and components that might break or clutter tests
jest.mock('../../components/stats/WinRateCard', () => ({ WinRateCard: () => <div data-testid="winrate-card" /> }));
jest.mock('../../components/stats/AttendanceRateCard', () => ({ AttendanceRateCard: () => <div data-testid="attendance-card" /> }));
jest.mock('../../components/stats/SkillTrendChart', () => ({ SkillTrendChart: () => <div data-testid="skill-chart" /> }));
jest.mock('../../hooks/useStats', () => ({
  useStats: () => ({
    timeframe: '30',
    setTimeframe: jest.fn(),
    refresh: jest.fn(),
    winRate: { data: { value: 50 }, isLoading: false, error: null },
    attendanceRate: { data: { rate: 80 }, isLoading: false, error: null },
    skillTrend: { data: { data: [] }, isLoading: false, error: null },
  }),
}));
jest.mock('../../components/OrganizerQualityBadge', () => ({
  OrganizerQualityBadge: () => <div data-testid="oqs-badge" />
}));

const getMockUser = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  slug: 'john-doe',
  bio: 'A bio',
  profileRestricted: false,
  sports: [],
  location: 'City',
  joinedDate: '2023-01-01',
  stats: {
    gamesPlayed: 10,
    gamesHosted: 5,
    reliabilityScore: 90,
    averageRating: 4.5,
  },
  ...overrides,
});

describe('UserProfile Tabs & Stats (US-7.6)', () => {
  it('renders the overview tab by default', () => {
    render(<UserProfile user={{...getMockUser(), profileRestricted: false}} currentUser={null} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('switches through all available tabs to render content', async () => {
    // Current user viewing their own profile
    render(<UserProfile user={getMockUser()} currentUser={{id: '1', displayName: 'John Doe', userId: 1, slug: 'john-doe'}} />);
    
    // Check Stats tab
    const statsTab = screen.getByRole('button', { name: /Stats & Analytics/i });
    fireEvent.click(statsTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('winrate-card')).toBeInTheDocument();
      expect(screen.getByTestId('attendance-card')).toBeInTheDocument();
      expect(screen.getByTestId('skill-chart')).toBeInTheDocument();
    });

    // Check Sports Profiles tab
    const sportsTab = screen.getByRole('button', { name: /Sport Profiles/i });
    fireEvent.click(sportsTab);
    await waitFor(() => {
      // The actual rendering logic depends on the sport profiles data
      expect(sportsTab).toHaveClass('border-emerald-600');
    });

    // Check Match History tab
    const matchHistoryTab = screen.getByRole('button', { name: /Match History/i });
    fireEvent.click(matchHistoryTab);
    await waitFor(() => {
      expect(matchHistoryTab).toHaveClass('border-emerald-600');
    });

    // Check Score History tab
    const scoreHistoryTab = screen.getByRole('button', { name: /Score History/i });
    fireEvent.click(scoreHistoryTab);
    await waitFor(() => {
      expect(scoreHistoryTab).toHaveClass('border-emerald-600');
    });
  });

  it('handles restricted profiles correctly', () => {
    // Other viewer on restricted profile
    render(<UserProfile 
      user={getMockUser({ profileRestricted: true, userId: 99 })} 
      currentUser={{id: '2', displayName: 'Jane', userId: 2, slug: 'jane'}} 
    />);
    
    expect(screen.getByText('Some profile details are private')).toBeInTheDocument();
    expect(screen.getByTestId('oqs-badge')).toBeInTheDocument();
  });
});
