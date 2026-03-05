import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LandingPage } from '@/components/LandingPage';
import { useAuth } from '@/context/AuthContext';
import { gamesApi } from '@/lib/api';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/link', () => {
  return ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  gamesApi: {
    getUpcoming: jest.fn(),
  },
}));

jest.mock('lucide-react', () => {
  const icon = (name: string) => () => <svg data-testid={name} />;
  return {
    MapPin: icon('MapPin'),
    Users: icon('Users'),
    Trophy: icon('Trophy'),
    Calendar: icon('Calendar'),
    BarChart3: icon('BarChart3'),
    Share2: icon('Share2'),
    Shield: icon('Shield'),
    Zap: icon('Zap'),
    Heart: icon('Heart'),
    MessageCircle: icon('MessageCircle'),
    Star: icon('Star'),
    ArrowRight: icon('ArrowRight'),
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockGame = (overrides: Record<string, any> = {}) => ({
  id: 'g1',
  title: 'Basketball Pickup',
  sportName: 'Basketball',
  confirmedCount: 4,
  ...overrides,
});

function setupAuth(authenticated = false) {
  (useAuth as jest.Mock).mockReturnValue({
    user: authenticated ? { id: 'u1' } : null,
    isLoading: false,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Baseline render ──────────────────────────────────────────────────────

  it('renders hero headline', async () => {
    setupAuth();
    (gamesApi.getUpcoming as jest.Mock).mockResolvedValue([]);

    render(<LandingPage />);

    expect(screen.getByText(/Find Your Game/i)).toBeInTheDocument();
  });

  it('renders unauthenticated CTA ("Get Started") when not logged in', async () => {
    setupAuth(false);
    (gamesApi.getUpcoming as jest.Mock).mockResolvedValue([]);

    render(<LandingPage />);

    // Multiple "Get Started*" links exist (nav + CTA); assert at least one points to /register
    const links = screen.getAllByRole('link', { name: /Get Started/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links.some((l) => l.getAttribute('href') === '/register')).toBe(true);
  });

  it('renders authenticated CTA ("My Games") when logged in', async () => {
    setupAuth(true);
    (gamesApi.getUpcoming as jest.Mock).mockResolvedValue([]);

    render(<LandingPage />);

    expect(screen.getByRole('link', { name: /My Games/i })).toBeInTheDocument();
  });

  // ── Stats block – happy path ─────────────────────────────────────────────

  it('shows stats section when getUpcoming returns games', async () => {
    setupAuth();
    (gamesApi.getUpcoming as jest.Mock).mockResolvedValue([
      mockGame({ confirmedCount: 5, sportName: 'Basketball' }),
      mockGame({ id: 'g2', confirmedCount: 3, sportName: 'Soccer' }),
    ]);

    render(<LandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Active Players')).toBeInTheDocument();
    });

    // 5 + 3 = 8 confirmed players across 2 games with 2 unique sports
    expect(screen.getByText('Upcoming Games')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
  });

  it('computes confirmedCount sum correctly (uses ?? 0 for missing counts)', async () => {
    setupAuth();
    (gamesApi.getUpcoming as jest.Mock).mockResolvedValue([
      mockGame({ confirmedCount: undefined, sportName: 'Tennis' }),
      mockGame({ id: 'g2', confirmedCount: 7, sportName: 'Tennis' }),
    ]);

    render(<LandingPage />);

    await waitFor(() => {
      expect(screen.getByText(/7\+/i)).toBeInTheDocument(); // activePlayers: 0 + 7 = 7
    });
  });

  it('counts unique sports correctly', async () => {
    setupAuth();
    (gamesApi.getUpcoming as jest.Mock).mockResolvedValue([
      mockGame({ sportName: 'Soccer' }),
      mockGame({ id: 'g2', sportName: 'Soccer' }),
      mockGame({ id: 'g3', sportName: 'Basketball' }),
    ]);

    render(<LandingPage />);

    await waitFor(() => {
      // 2 unique sports → displays "2+"
      expect(screen.getByText('2+')).toBeInTheDocument();
    });
  });

  // ── Stats block – no-data / error paths ──────────────────────────────────

  it('does NOT show stats section when getUpcoming returns an empty array', async () => {
    setupAuth();
    (gamesApi.getUpcoming as jest.Mock).mockResolvedValue([]);

    render(<LandingPage />);

    // Wait long enough for the effect to resolve
    await waitFor(() => {
      expect(gamesApi.getUpcoming).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText(/Active Players/i)).not.toBeInTheDocument();
  });

  it('does NOT show stats section when getUpcoming returns null', async () => {
    setupAuth();
    (gamesApi.getUpcoming as jest.Mock).mockResolvedValue(null);

    render(<LandingPage />);

    await waitFor(() => {
      expect(gamesApi.getUpcoming).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText(/Active Players/i)).not.toBeInTheDocument();
  });

  it('does NOT show stats section when getUpcoming rejects (API error)', async () => {
    setupAuth();
    (gamesApi.getUpcoming as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<LandingPage />);

    await waitFor(() => {
      expect(gamesApi.getUpcoming).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText(/Active Players/i)).not.toBeInTheDocument();
  });
});
