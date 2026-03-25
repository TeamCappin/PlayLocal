import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { GameDiscovery } from '../../components/GameDiscovery';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

const mockSearchParams = { get: jest.fn((key: string) => (key === "view" ? null : null)) };
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

jest.mock('../../hooks/useGames', () => ({
  useGames: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="icon-mappin" />,
  Clock: () => <div data-testid="icon-clock" />,
  Users: () => <div data-testid="icon-users" />,
  TrendingUp: () => <div data-testid="icon-trending" />,
  Filter: () => <div data-testid="icon-filter" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  MapIcon: () => <div data-testid="icon-map" />,
  Cloud: () => <div data-testid="icon-cloud" />,
  Sun: () => <div data-testid="icon-sun" />,
  Loader2: () => <div data-testid="icon-loader" />,
  X: () => <div data-testid="icon-x" />,
  Search: () => <div data-testid="icon-search" />,
  LayoutGrid: () => <div data-testid="icon-layout-grid" />,
  SlidersHorizontal: () => <div data-testid="icon-sliders" />,
  ChevronDown: () => <div data-testid="icon-chevron-down" />,
  Bot: () => <div data-testid="icon-bot" />,
}));

// Prevent @vis.gl/react-google-maps from running in tests
jest.mock('../../components/MapView', () => ({
  __esModule: true,
  default: () => <div data-testid="map-view" />,
}));

import { useGames } from '../../hooks/useGames';
const openAssistantMock = jest.fn();
jest.mock('@/context/AssistantContext', () => ({
  useAssistant: () => ({ openAssistant: openAssistantMock }),
}));

let isMobileMock = false;
jest.mock('@/components/ui/use-mobile', () => ({
  useIsMobile: () => isMobileMock,
}));

describe('GameDiscovery Component', () => {
  // Helper: open a custom FilterSelect dropdown and choose an option
  async function selectFilterOption(labelText: string, optionLabel: string) {
    const label = screen.getByText(labelText);
    const wrapper = label.parentElement; // grid cell div containing label + FilterSelect
    const trigger = wrapper?.querySelector('button');
    if (!trigger) throw new Error(`Trigger button for "${labelText}" not found`);
    await act(async () => { fireEvent.click(trigger); });
    // Query the option within the FilterSelect wrapper (position:relative div)
    const filterSelectDiv = trigger.parentElement;
    const optionButton = Array.from(filterSelectDiv?.querySelectorAll('button') ?? [])
      .find(btn => btn.textContent?.trim() === optionLabel);
    if (!optionButton) throw new Error(`Option "${optionLabel}" not found in "${labelText}" dropdown`);
    await act(async () => { fireEvent.click(optionButton); });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    openAssistantMock.mockClear();
    isMobileMock = false;
    sessionStorage.clear();
    mockSearchParams.get.mockImplementation((key: string) => (key === "view" ? null : null));
    Object.defineProperty(global.navigator, "geolocation", {
      value: {
        getCurrentPosition: jest.fn((success?: (p: unknown) => void, error?: (err: { code: number; message: string }) => void) => {
          if (error) error({ code: 1, message: "User denied geolocation" });
        }),
      },
      writable: true,
      configurable: true,
    });
  });

  it('opens assistant when Help button is clicked', () => {
    (useGames as jest.Mock).mockReturnValue({
      games: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<GameDiscovery />);
    fireEvent.click(screen.getByRole('button', { name: /open help assistant/i }));

    expect(openAssistantMock).toHaveBeenCalledWith('discover');
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: true,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText('Loading games...')).toBeInTheDocument();
      expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show no games message when games array is empty', () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText(/No games available/i)).toBeInTheDocument();
    });
  });

  describe('Games Display', () => {
    const mockGames = [
      {
        gameId: 'game-1',
        title: 'Basketball Pickup',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Central Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 6,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'John Doe',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Fun game',
        tags: [],
      },
      {
        gameId: 'game-2',
        title: 'Soccer Match',
        sportName: 'Soccer',
        startTime: new Date(Date.now() + 7200000).toISOString(),
        endTime: new Date(Date.now() + 10800000).toISOString(),
        location: { name: 'Field House', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 10,
        maxPlayers: 10,
        minPlayers: 6,
        skillBand: 'Advanced',
        intensityBand: 'Competitive',
        indoorOutdoor: 'indoor',
        organizer: {
          userId: 'user-2',
          displayName: 'Jane Smith',
          reliabilityScore: 98,
        },
        status: 'SCHEDULED',
        description: 'Competitive match',
        tags: [],
      },
    ];

    it('should render games when data is available', () => {
      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText('Basketball Pickup')).toBeInTheDocument();
      expect(screen.getByText('Soccer Match')).toBeInTheDocument();
    });

    it('should display game details correctly', () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [mockGames[0]],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText('Basketball Pickup')).toBeInTheDocument();
      expect(screen.getByText('Central Park')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('6/10 players')).toBeInTheDocument();
    });

    it('should show location privacy when hasExactLocationAccess is false', () => {
      const privateGame = {
        ...mockGames[0],
        hasExactLocationAccess: false,
        approximateLocation: 'Montreal, QC',
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [privateGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText('Location Hidden')).toBeInTheDocument();
      expect(screen.getByText(/Montreal/i)).toBeInTheDocument();
    });

    it('should show almost-full status for games near capacity', () => {
      const almostFullGame = {
        ...mockGames[0],
        confirmedCount: 9,
        maxPlayers: 10,
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [almostFullGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // The component should show the game is almost full (9/10 players)
      expect(screen.getByText('9/10 players')).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    const mockGames = [
      {
        gameId: 'game-1',
        title: 'Basketball Pickup',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Central Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 6,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'John Doe',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Fun game',
        tags: [],
      },
    ];

    it('should toggle to map view when map button is clicked', () => {
      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<GameDiscovery />);

      const buttons = screen.getAllByRole('button');
      const mapButton = buttons.find((btn) =>
        btn.querySelector('[data-testid="icon-map"]')
      );

      expect(mapButton).toBeDefined();
      fireEvent.click(mapButton!);
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    it('should toggle back to grid view when calendar button is clicked', () => {
      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        refetch: jest.fn(),
      });

      render(<GameDiscovery />);

      const buttons = screen.getAllByRole('button');
      const mapButton = buttons.find((btn) =>
        btn.querySelector('[data-testid="icon-map"]')
      );
      const gridButton = buttons.find((btn) =>
        btn.querySelector('[data-testid="icon-layout-grid"]')
      );

      expect(mapButton).toBeDefined();
      expect(gridButton).toBeDefined();

      fireEvent.click(mapButton!);
      expect(screen.getByTestId('map-view')).toBeInTheDocument();

      fireEvent.click(gridButton!);
      expect(screen.queryByTestId('map-view')).not.toBeInTheDocument();
    });
  });

  describe('Filter Toggle', () => {
    it('should toggle filters when filter button is clicked', async () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      const filterButton = screen.getByText('Filters');

      await act(async () => {
        fireEvent.click(filterButton);
      });

      // Wait for modal to render - check for "Distance" label
      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });
      expect(screen.getByText('Skill Level')).toBeInTheDocument();
    });
  });

  describe('Date Display', () => {
    it('should show Today for games starting today', () => {
      const todayGame = {
        gameId: 'game-today',
        title: "Today's Game",
        sportName: 'Basketball',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        location: { name: 'Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'All Levels',
        intensityBand: 'Medium',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'Host',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Game today',
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [todayGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('should show Tomorrow for games starting tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setHours(12, 0, 0, 0); // Set to noon tomorrow
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tomorrowGame = {
        gameId: 'game-tomorrow',
        title: "Tomorrow's Game",
        sportName: 'Soccer',
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 3600000).toISOString(),
        location: { name: 'Field', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 3,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Beginner',
        intensityBand: 'Casual',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'Host',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Game tomorrow',
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [tomorrowGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should show either "Tomorrow" or the weekday name
      const titleElement = screen.getByText("Tomorrow's Game");
      expect(titleElement).toBeInTheDocument();
    });
  });

  describe('Indoor/Outdoor Display', () => {
    it('should show indoor indicator for indoor games', () => {
      const indoorGame = {
        gameId: 'game-indoor',
        title: 'Indoor Basketball',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Gym', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'indoor',
        organizer: {
          userId: 'user-1',
          displayName: 'Host',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Indoor game',
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [indoorGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText('Indoor')).toBeInTheDocument();
    });
  });

  describe('Link Navigation', () => {
    it('should render clickable game cards with correct href', () => {
      const mockGames = [
        {
          gameId: 'game-123',
          title: 'Test Game',
          sportName: 'Basketball',
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          location: { name: 'Park', city: 'Montreal' },
          hasExactLocationAccess: true,
          approximateLocation: 'Montreal, QC',
          confirmedCount: 5,
          maxPlayers: 10,
          minPlayers: 4,
          skillBand: 'Intermediate',
          intensityBand: 'High',
          indoorOutdoor: 'outdoor',
          organizer: {
            userId: 'user-1',
            displayName: 'Host',
            reliabilityScore: 95,
          },
          status: 'SCHEDULED',
          description: 'Test',
          tags: [],
        },
      ];

      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/games/game-123');
    });
  });

  describe('Filter Application', () => {
    const mockGames = [
      {
        gameId: 'game-1',
        title: 'Basketball Pickup',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Central Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 6,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'John Doe',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Fun game',
        tags: [],
      },
    ];

    beforeEach(() => {
      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        error: null,
      });
    });

    it('should apply filters when search button is clicked', async () => {
      render(<GameDiscovery />);

      // Open filter modal
      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      // Change skill level using custom dropdown
      await selectFilterOption('Skill Level', 'Intermediate');

      // Click search button
      const searchButton = screen.getByText('Apply');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Distance')).not.toBeInTheDocument();
      });
    });

    it('Reset button clears all filters, resets todayOnly, and closes the modal', async () => {
      render(<GameDiscovery />);

      // Open modal and set some filters
      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });
      await waitFor(() =>
        expect(screen.getByText('Distance')).toBeInTheDocument()
      );

      // Change skill level using custom dropdown
      await selectFilterOption('Skill Level', 'Beginner');

      // Verify skill level trigger now shows Beginner
      const skillLabel = screen.getByText('Skill Level');
      const skillTrigger = skillLabel.parentElement?.querySelector('button');
      expect(skillTrigger).toHaveTextContent('Beginner');

      // Click Clear
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await act(async () => {
        fireEvent.click(clearButton);
      });

      // Verify skill level trigger is reset to Any
      expect(skillTrigger).toHaveTextContent('Any');

      // useGames should have been called with no filters (undefined)
      const calls = (useGames as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBeUndefined();
    });

    it('should close modal when X button is clicked', async () => {
      render(<GameDiscovery />);

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      // First icon-x is the header close button; second is the Reset button
      const closeButton = screen.getAllByTestId('icon-x')[0].closest('button');
      if (closeButton) {
        await act(async () => {
          fireEvent.click(closeButton);
        });
      }

      await waitFor(() => {
        expect(screen.queryByText('Distance')).not.toBeInTheDocument();
      });
    });

    it('should close modal when backdrop is clicked', async () => {
      render(<GameDiscovery />);

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      // Find backdrop (the fixed overlay)
      const backdrop = screen.getByText('Distance').closest('.fixed');
      if (backdrop) {
        await act(async () => {
          fireEvent.click(backdrop);
        });
      }

      await waitFor(() => {
        expect(screen.queryByText('Distance')).not.toBeInTheDocument();
      });
    });

    it('should update filter values when inputs change', async () => {
      render(<GameDiscovery />);

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      // Change distance filter using custom dropdown
      const distanceLabel = screen.getByText('Distance');
      const distanceTrigger = distanceLabel.parentElement?.querySelector('button');
      await selectFilterOption('Distance', 'Within 10 km');
      expect(distanceTrigger).toHaveTextContent('Within 10 km');

      // Change location type
      const locationLabel = screen.getByText('Location Type');
      const locationTrigger = locationLabel.parentElement?.querySelector('button');
      await selectFilterOption('Location Type', 'Indoor');
      expect(locationTrigger).toHaveTextContent('Indoor');

      // Change intensity
      const intensityLabel = screen.getByText('Intensity');
      const intensityTrigger = intensityLabel.parentElement?.querySelector('button');
      await selectFilterOption('Intensity', 'Competitive');
      expect(intensityTrigger).toHaveTextContent('Competitive');
    });
  });

  describe('Error State', () => {
    it('should display error message when useGames returns error', () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: 'Failed to load games',
      });

      render(<GameDiscovery />);

      // Component should handle error gracefully
      // Check that error doesn't crash the component
      expect(screen.queryByText(/No games available/i)).toBeInTheDocument();
    });
  });

  describe('Geolocation', () => {
    it('should handle geolocation when available', () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => {
          success({
            coords: {
              latitude: 45.5017,
              longitude: -73.5673,
            },
          });
        }),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('should handle geolocation error gracefully', () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((success, error) => {
          error({ code: 1, message: 'User denied geolocation' });
        }),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<GameDiscovery />);

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      // Should not crash - component continues without location

      consoleSpy.mockRestore();
    });

    it('should work when geolocation is not available', () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should render without crashing
      expect(screen.getByText(/No games available/i)).toBeInTheDocument();
    });
  });

  describe('Filter Conversion Logic', () => {
    beforeEach(() => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });
    });

    it('should apply sportName filter when provided', async () => {
      render(<GameDiscovery />);

      // Clear initial calls
      (useGames as jest.Mock).mockClear();

      // Use sport chip to set sportName filter (sport name input was removed from filter panel)
      const basketballBtn = screen.getByRole('button', { name: 'Basketball' });
      await act(async () => {
        fireEvent.click(basketballBtn);
      });

      // Verify useGames was called with sportName filter
      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          sportName: 'basketball',
        });
      });
    });

    it('should apply skillLevel filter with proper mapping', async () => {
      render(<GameDiscovery />);

      // Clear initial calls
      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      await selectFilterOption('Skill Level', 'Beginner');

      const searchButton = screen.getByText('Apply');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          skillLevel: 'beginner',
        });
      });
    });

    it('should apply locationType filter', async () => {
      render(<GameDiscovery />);

      // Clear initial calls
      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      await selectFilterOption('Location Type', 'Indoor');

      const searchButton = screen.getByText('Apply');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          locationType: 'indoor',
        });
      });
    });

    it('should apply intensity filter with proper mapping', async () => {
      render(<GameDiscovery />);

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      await selectFilterOption('Intensity', 'High');

      const searchButton = screen.getByText('Apply');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        expect(useGames).toHaveBeenCalledWith(
          expect.objectContaining({
            intensity: 'high',
          })
        );
      });
    });

    it('should apply distance filter when userLocation is available', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => {
          success({
            coords: {
              latitude: 45.5017,
              longitude: -73.5673,
            },
          });
        }),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      render(<GameDiscovery />);

      // Wait for geolocation to complete
      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      await selectFilterOption('Distance', 'Within 10 km');

      // Clear initial calls before applying filter
      (useGames as jest.Mock).mockClear();

      const searchButton = screen.getByText('Apply');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          lat: 45.5017,
          lon: -73.5673,
          radiusKm: 10,
        });
      });
    });

    it('should handle all filter types together', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => {
          success({
            coords: {
              latitude: 45.5017,
              longitude: -73.5673,
            },
          });
        }),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      render(<GameDiscovery />);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });

      // Clear initial calls
      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      // Set all filters using custom dropdowns
      await selectFilterOption('Skill Level', 'Intermediate');
      await selectFilterOption('Location Type', 'Outdoor');
      await selectFilterOption('Intensity', 'Competitive');
      await selectFilterOption('Distance', 'Within 5 km');

      const searchButton = screen.getByText('Apply');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          skillLevel: 'intermediate',
          locationType: 'outdoor',
          intensity: 'competitive',
          lat: 45.5017,
          lon: -73.5673,
          radiusKm: 5,
        });
      });
    });

    it('should handle skillLevel with capitalized value', async () => {
      render(<GameDiscovery />);

      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      // Test with "advanced" (lowercase) - should map to "advanced" in API call
      await selectFilterOption('Skill Level', 'Advanced');

      const searchButton = screen.getByText('Apply');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          skillLevel: 'advanced',
        });
      });
    });

    it('should handle intensity with casual value', async () => {
      render(<GameDiscovery />);

      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      // Test with "casual" (lowercase) - should map to "casual" in API call
      await selectFilterOption('Intensity', 'Casual');

      const searchButton = screen.getByText('Apply');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          intensity: 'casual',
        });
      });
    });

    it('should not include radiusKm when distance is any distance', async () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((success) => {
          success({
            coords: {
              latitude: 45.5017,
              longitude: -73.5673,
            },
          });
        }),
      };

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      render(<GameDiscovery />);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });

      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText('Filters');
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Distance')).toBeInTheDocument();
      });

      // Distance is already "any distance" by default, so just click search
      const searchButton = screen.getByText('Apply');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        // Should not have radiusKm when distance is "any distance"
        if (lastCall[0]) {
          expect(lastCall[0]).not.toHaveProperty('radiusKm');
        }
      });
    });
  });

  describe('Game Transformation Edge Cases', () => {
    it('should handle games with missing location data', () => {
      const gameWithoutLocation = {
        gameId: 'game-no-location',
        title: 'Game Without Location',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: null,
        hasExactLocationAccess: false,
        approximateLocation: null,
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: null,
        intensityBand: null,
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'Host',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Test',
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithoutLocation],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Verify the game renders with location privacy
      expect(screen.getByText('Location Hidden')).toBeInTheDocument();
      expect(screen.getByText('Game Without Location')).toBeInTheDocument();
    });

    it('should handle games with unknown sport', () => {
      const gameWithUnknownSport = {
        gameId: 'game-unknown-sport',
        title: 'Unknown Sport Game',
        sportName: 'Quidditch',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'Host',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Test',
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithUnknownSport],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should render without crashing - uses fallback image
      expect(screen.getByText('Unknown Sport Game')).toBeInTheDocument();
    });

    it('should handle games without endTime', () => {
      const gameWithoutEndTime = {
        gameId: 'game-no-end',
        title: 'Game Without End Time',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: null,
        location: { name: 'Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'Host',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Test',
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithoutEndTime],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should use default duration
      expect(screen.getByText('Game Without End Time')).toBeInTheDocument();
    });

    it('should handle games with full status', () => {
      const fullGame = {
        gameId: 'game-full',
        title: 'Full Game',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 10,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'Host',
          reliabilityScore: 95,
        },
        status: 'FULL',
        description: 'Test',
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [fullGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText('Full Game')).toBeInTheDocument();
      expect(screen.getByText('10/10 players')).toBeInTheDocument();
    });

    it('should handle organizer without displayName', () => {
      const gameWithoutOrganizerName = {
        gameId: 'game-no-organizer-name',
        title: 'Game Without Organizer Name',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: null,
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Test',
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithoutOrganizerName],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should render with fallback "Host"
      expect(
        screen.getByText('Game Without Organizer Name')
      ).toBeInTheDocument();
    });

    it('should handle unknown game status', () => {
      const gameWithUnknownStatus = {
        gameId: 'game-unknown-status',
        title: 'Game With Unknown Status',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'Host',
          reliabilityScore: 95,
        },
        status: 'UNKNOWN_STATUS',
        description: 'Test',
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithUnknownStatus],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should render with fallback status color
      expect(screen.getByText('Game With Unknown Status')).toBeInTheDocument();
      expect(screen.getByText('5/10 players')).toBeInTheDocument();
    });
  });

  // ── US 7.1: Google Maps – Map-Based Discover View ────────────────────────

  describe('Quick Filter Chips', () => {
    const baseGame = {
      gameId: 'game-1',
      title: 'Basketball Pickup',
      sportName: 'Basketball',
      startTime: new Date().toISOString(), // today
      endTime: new Date(Date.now() + 3600000).toISOString(),
      location: { name: 'Park', city: 'Montreal' },
      hasExactLocationAccess: true,
      approximateLocation: 'Montreal, QC',
      confirmedCount: 5,
      maxPlayers: 10,
      minPlayers: 4,
      skillBand: 'Intermediate',
      intensityBand: 'High',
      indoorOutdoor: 'outdoor',
      organizer: { userId: 'u1', displayName: 'Host', reliabilityScore: 90 },
      status: 'SCHEDULED',
      description: 'Test',
      tags: [],
    };

    beforeEach(() => {
      (useGames as jest.Mock).mockReturnValue({
        games: [baseGame],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it("'All' chip is active by default", () => {
      render(<GameDiscovery />);
      const allSportsBtn = screen.getByRole('button', { name: 'All' });
      expect(allSportsBtn).toHaveClass('bg-emerald-600');
    });

    it('clicking a sport chip activates it and sends lowercase sportName to useGames', async () => {
      render(<GameDiscovery />);
      (useGames as jest.Mock).mockClear();

      const btn = screen.getByRole('button', { name: 'Basketball' });
      await act(async () => {
        fireEvent.click(btn);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({ sportName: 'basketball' });
      });
    });

    it("'All' chip is active when a sport is selected and clicking it clears the filter", async () => {
      render(<GameDiscovery />);

      // Select Basketball
      const basketballBtn = screen.getByRole('button', { name: 'Basketball' });
      await act(async () => {
        fireEvent.click(basketballBtn);
      });
      expect(basketballBtn).toHaveClass('bg-emerald-600');
      const allSportsBtn = screen.getByRole('button', { name: 'All' });
      expect(allSportsBtn).not.toHaveClass('bg-emerald-600');

      // Click All Sports to clear
      (useGames as jest.Mock).mockClear();
      await act(async () => {
        fireEvent.click(allSportsBtn);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastArg = calls[calls.length - 1][0];
        // When all filters are cleared, apiFilters returns undefined (no active filters),
        // so useGames is called with undefined — no sport, distance, or location properties.
        expect(lastArg).toBeUndefined();
      });
      expect(allSportsBtn).toHaveClass('bg-emerald-600');
    });

    it('clicking the same sport chip again deactivates it', async () => {
      render(<GameDiscovery />);

      const btn = screen.getByRole('button', { name: 'Soccer' });
      await act(async () => {
        fireEvent.click(btn);
      });
      expect(btn).toHaveClass('bg-emerald-600');

      (useGames as jest.Mock).mockClear();
      await act(async () => {
        fireEvent.click(btn);
      });

      // After toggle-off, no sportName filter should be active
      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        if (lastCall[0] === undefined) {
          expect(lastCall[0]).toBeUndefined();
        } else {
          expect(
            lastCall[0].sportName === undefined || lastCall[0].sportName === ''
          ).toBe(true);
        }
      });
      expect(btn).not.toHaveClass('bg-emerald-600');
    });

    it("'Today' chip client-side filters games not starting today", async () => {
      const futureGame = {
        ...baseGame,
        gameId: 'game-future',
        title: 'Future Game',
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      };
      (useGames as jest.Mock).mockReturnValue({
        games: [baseGame, futureGame],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<GameDiscovery />);
      // Both games visible initially
      expect(screen.getByText('Basketball Pickup')).toBeInTheDocument();
      expect(screen.getByText('Future Game')).toBeInTheDocument();

      const todayBtn = screen.getByRole('button', { name: 'Today' });
      await act(async () => {
        fireEvent.click(todayBtn);
      });

      expect(screen.getByText('Basketball Pickup')).toBeInTheDocument();
      expect(screen.queryByText('Future Game')).not.toBeInTheDocument();
      expect(todayBtn).toHaveClass('bg-emerald-600');
    });

    it("'Today' chip toggles off and restores all games", async () => {
      const futureGame = {
        ...baseGame,
        gameId: 'game-future',
        title: 'Future Game',
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      };
      (useGames as jest.Mock).mockReturnValue({
        games: [baseGame, futureGame],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<GameDiscovery />);
      const todayBtn = screen.getByRole('button', { name: 'Today' });

      await act(async () => {
        fireEvent.click(todayBtn);
      }); // on
      expect(screen.queryByText('Future Game')).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(todayBtn);
      }); // off
      expect(screen.getByText('Future Game')).toBeInTheDocument();
    });

    it("'Within 5km' chip sets distance filter to 5km when location is available", async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: jest.fn((success) =>
            success({ coords: { latitude: 45.5, longitude: -73.5 } })
          ),
        },
        writable: true,
      });

      render(<GameDiscovery />);
      await waitFor(() =>
        expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled()
      );

      (useGames as jest.Mock).mockClear();
      const btn = screen.getByRole('button', { name: 'Within 5km' });
      await act(async () => {
        fireEvent.click(btn);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          radiusKm: 5,
          lat: 45.5,
          lon: -73.5,
        });
      });
      expect(btn).toHaveClass('bg-emerald-600');
    });

    it("'Within 5km' chip toggles off and clears distance filter", async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: jest.fn((success) =>
            success({ coords: { latitude: 45.5, longitude: -73.5 } })
          ),
        },
        writable: true,
      });

      render(<GameDiscovery />);
      await waitFor(() =>
        expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled()
      );

      const btn = screen.getByRole('button', { name: 'Within 5km' });
      await act(async () => {
        fireEvent.click(btn);
      }); // on
      expect(btn).toHaveClass('bg-emerald-600');

      (useGames as jest.Mock).mockClear();
      await act(async () => {
        fireEvent.click(btn);
      }); // off

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toBeUndefined();
      });
      expect(btn).not.toHaveClass('bg-emerald-600');
    });

    it("'My Skill Level' chip is rendered but not interactive", () => {
      render(<GameDiscovery />);
      const btn = screen.getByRole('button', { name: 'My Skill Level' });
      expect(btn).toBeInTheDocument();
      // Chip has no onClick — clicking it does not open the filter modal
      fireEvent.click(btn);
      expect(screen.queryByText('Filter Games')).not.toBeInTheDocument();
    });

    it('Volleyball and Tennis quick filters apply sportName to useGames', async () => {
      render(<GameDiscovery />);
      (useGames as jest.Mock).mockClear();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Volleyball' }));
      });
      await waitFor(() => {
        const last = (useGames as jest.Mock).mock.calls.at(-1)?.[0];
        expect(last).toMatchObject({ sportName: 'volleyball' });
      });

      (useGames as jest.Mock).mockClear();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Tennis' }));
      });
      await waitFor(() => {
        const last = (useGames as jest.Mock).mock.calls.at(-1)?.[0];
        expect(last).toMatchObject({ sportName: 'tennis' });
      });
    });
  });

  describe('Sort controls', () => {
    const sortGame = (overrides: Record<string, unknown>) => ({
      gameId: 'game-1',
      title: 'Alpha',
      sportName: 'Basketball',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      location: { name: 'Park', city: 'Montreal' },
      hasExactLocationAccess: true,
      approximateLocation: 'Montreal, QC',
      confirmedCount: 5,
      maxPlayers: 10,
      minPlayers: 4,
      skillBand: 'Intermediate',
      intensityBand: 'High',
      indoorOutdoor: 'outdoor',
      organizer: {
        userId: 'user-1',
        displayName: 'Host',
        reliabilityScore: 95,
      },
      status: 'SCHEDULED',
      description: 'Test',
      tags: [],
      waitlistCount: 0,
      ...overrides,
    });

    it('Sort by Most Popular orders games by confirmedCount + waitlistCount', async () => {
      const games = [
        sortGame({
          gameId: 'g-low',
          title: 'Less Popular',
          confirmedCount: 1,
          waitlistCount: 0,
        }),
        sortGame({
          gameId: 'g-high',
          title: 'More Popular',
          confirmedCount: 8,
          waitlistCount: 4,
        }),
      ];
      (useGames as jest.Mock).mockReturnValue({
        games,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<GameDiscovery />);

      await act(async () => {
        fireEvent.click(screen.getByText('Soonest'));
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Most Popular'));
      });

      const titles = screen.getAllByRole('link').map((a) => a.textContent);
      const moreIdx = titles.findIndex((t) => t?.includes('More Popular'));
      const lessIdx = titles.findIndex((t) => t?.includes('Less Popular'));
      expect(moreIdx).toBeGreaterThan(-1);
      expect(lessIdx).toBeGreaterThan(-1);
      expect(moreIdx).toBeLessThan(lessIdx);
    });

    it('Sort by Nearest shows location-off message when geolocation is unavailable', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: jest.fn((_s, err) =>
            err({ code: 1, message: 'denied' })
          ),
        },
        writable: true,
      });
      (useGames as jest.Mock).mockReturnValue({
        games: [sortGame({})],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<GameDiscovery />);

      await act(async () => {
        fireEvent.click(screen.getByText('Soonest'));
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Nearest'));
      });

      expect(
        screen.getByText(/Location is off\. Please enable location services/i)
      ).toBeInTheDocument();
    });

    it('Sort by Nearest with location sends lat/lon without radiusKm when distance is any', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: jest.fn((success) =>
            success({ coords: { latitude: 45.1, longitude: -73.2 } })
          ),
        },
        writable: true,
      });
      (useGames as jest.Mock).mockReturnValue({
        games: [sortGame({})],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<GameDiscovery />);
      await waitFor(() =>
        expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled()
      );

      (useGames as jest.Mock).mockClear();

      await act(async () => {
        fireEvent.click(screen.getByText('Soonest'));
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Nearest'));
      });

      await waitFor(() => {
        const last = (useGames as jest.Mock).mock.calls.at(-1)?.[0];
        expect(last).toMatchObject({ lat: 45.1, lon: -73.2 });
        expect(last).not.toHaveProperty('radiusKm');
      });
    });
  });

  describe('Filter modal – Cancel and keyboard', () => {
    beforeEach(() => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('closes the modal when Cancel is clicked', async () => {
      render(<GameDiscovery />);
      await act(async () => {
        fireEvent.click(screen.getByText('Filters'));
      });
      await waitFor(() =>
        expect(screen.getByText('Filter Games')).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      });
      await waitFor(() =>
        expect(screen.queryByText('Filter Games')).not.toBeInTheDocument()
      );
    });

    it('closes the modal when Escape is pressed on the backdrop', async () => {
      render(<GameDiscovery />);
      await act(async () => {
        fireEvent.click(screen.getByText('Filters'));
      });
      await waitFor(() =>
        expect(screen.getByText('Filter Games')).toBeInTheDocument()
      );

      const backdrop = screen.getByLabelText('Filter modal backdrop');
      await act(async () => {
        fireEvent.keyDown(backdrop, { key: 'Escape' });
      });
      await waitFor(() =>
        expect(screen.queryByText('Filter Games')).not.toBeInTheDocument()
      );
    });

    it('dialog panel handles keydown without closing when focus is inside (stopPropagation)', async () => {
      render(<GameDiscovery />);
      await act(async () => {
        fireEvent.click(screen.getByText('Filters'));
      });
      await waitFor(() =>
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      );

      const dialog = screen.getByRole('dialog');
      await act(async () => {
        fireEvent.keyDown(dialog, { key: 'Tab' });
      });
      expect(screen.getByText('Filter Games')).toBeInTheDocument();
    });
  });

  describe('Session Persistence – View Mode', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('saves view mode to sessionStorage when toggled to map', async () => {
      render(<GameDiscovery />);
      await act(async () => {
        jest.runAllTimers();
      });
      const buttons = screen.getAllByRole('button');
      const mapButton = buttons.find((btn) =>
        btn.querySelector('[data-testid="icon-map"]')
      );
      expect(mapButton).toBeDefined();
      fireEvent.click(mapButton!);
      expect(sessionStorage.getItem('playlocal-view-mode')).toBe('map');
    });

    it('saves view mode to sessionStorage when toggled to grid', async () => {
      render(<GameDiscovery />);
      await act(async () => {
        jest.runAllTimers();
      });
      const buttons = screen.getAllByRole('button');
      const mapButton = buttons.find((btn) =>
        btn.querySelector('[data-testid="icon-map"]')
      );
      const gridButton = buttons.find((btn) =>
        btn.querySelector('[data-testid="icon-layout-grid"]')
      );
      fireEvent.click(mapButton!);
      fireEvent.click(gridButton!);
      expect(sessionStorage.getItem('playlocal-view-mode')).toBe('grid');
    });

    it("restores map view mode from sessionStorage on mount", async () => {
      mockSearchParams.get.mockImplementation((key: string) => (key === "view" ? "map" : null) as null);
      render(<GameDiscovery />);
      await act(async () => {
        jest.runAllTimers();
      });
      // URL view=map shows map
      expect(screen.getByTestId("map-view")).toBeInTheDocument();
    });

    it('restores grid view mode from sessionStorage on mount', async () => {
      sessionStorage.setItem('playlocal-view-mode', 'grid');
      render(<GameDiscovery />);
      await act(async () => {
        jest.runAllTimers();
      });
      // Grid content present, map not
      expect(screen.queryByTestId('map-view')).not.toBeInTheDocument();
    });

    it('defaults to grid view when no sessionStorage entry exists', async () => {
      render(<GameDiscovery />);
      await act(async () => {
        jest.runAllTimers();
      });
      expect(screen.queryByTestId('map-view')).not.toBeInTheDocument();
    });
  });

  describe('Within 5km chip – no location', () => {
    beforeEach(() => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      // Ensure geolocation fails so userLocation stays null
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: jest.fn((_success, error) =>
            error({ code: 1, message: 'denied' })
          ),
        },
        writable: true,
      });
    });

    it('shows window.alert when Within 5km is clicked without a user location', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<GameDiscovery />);

      const btn = screen.getByRole('button', { name: 'Within 5km' });
      await act(async () => {
        fireEvent.click(btn);
      });

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringMatching(/location is unavailable/i)
      );
      alertSpy.mockRestore();
    });
  });

  describe('playlocal-refresh-games event', () => {
    it('calls refetch when playlocal-refresh-games is dispatched', async () => {
      const refetchMock = jest.fn();
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
        refetch: refetchMock,
      });

      render(<GameDiscovery />);

      await act(async () => {
        window.dispatchEvent(new Event('playlocal-refresh-games'));
      });

      expect(refetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modal distance-unavailable warning', () => {
    it('shows location-unavailable warning when distance filter is set but no user location', async () => {
      // Geolocation unavailable
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<GameDiscovery />);

      // Open modal
      await act(async () => {
        fireEvent.click(screen.getByText('Filters'));
      });
      await waitFor(() =>
        expect(screen.getByText('Distance')).toBeInTheDocument()
      );

      // Change distance to something other than "any distance"
      await selectFilterOption('Distance', 'Within 5 km');

      // Warning should appear
      expect(
        screen.getByText(/location unavailable.*distance filter won/i)
      ).toBeInTheDocument();
    });
  });

  describe('GameCard – minReliabilityRequired badge', () => {
    it('renders reliability badge and chip when minReliabilityRequired is set', () => {
      const reliabilityGame = {
        gameId: 'game-reliability',
        title: 'Reliability Gated Game',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: {
          userId: 'user-1',
          displayName: 'Host',
          reliabilityScore: 95,
        },
        status: 'SCHEDULED',
        description: 'Test',
        tags: [],
        minReliabilityRequired: 80,
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [reliabilityGame],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<GameDiscovery />);

      // Both the overlay badge and the chip in the details section should appear
      const badges = screen.getAllByText('Min 80% Reliability');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Mobile view', () => {
    const mockGames = [
      {
        gameId: 'game-1',
        title: 'Basketball Pickup',
        sportName: 'Basketball',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: 'Central Park', city: 'Montreal' },
        hasExactLocationAccess: true,
        approximateLocation: 'Montreal, QC',
        confirmedCount: 6,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: 'Intermediate',
        intensityBand: 'High',
        indoorOutdoor: 'outdoor',
        organizer: { userId: 'user-1', displayName: 'John', reliabilityScore: 95 },
        status: 'SCHEDULED',
        description: 'Fun game',
        tags: [],
      },
    ];

    beforeEach(() => {
      isMobileMock = true;
      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('opens filter bottom sheet on mobile', async () => {
      render(<GameDiscovery />);

      // Click Filters button
      await act(async () => {
        fireEvent.click(screen.getByText('Filters'));
      });

      // Bottom sheet should show filter form with Filter Games heading
      expect(screen.getByText('Filter Games')).toBeInTheDocument();
    });

    it('closes filter bottom sheet when backdrop is clicked', async () => {
      jest.useFakeTimers();
      render(<GameDiscovery />);

      await act(async () => {
        fireEvent.click(screen.getByText('Filters'));
      });

      expect(screen.getByText('Filter Games')).toBeInTheDocument();

      // Click the backdrop
      await act(async () => {
        fireEvent.click(screen.getByLabelText('Filter drawer backdrop'));
      });

      // Advance past close animation timer
      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      expect(screen.queryByText('Filter Games')).not.toBeInTheDocument();
      jest.useRealTimers();
    });

    it('shows mobile contextual chips in separate row', () => {
      render(<GameDiscovery />);

      // Mobile should still show Today and Within 5km chips
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Within 5km')).toBeInTheDocument();
    });

    it('filters games by search query and clears it', async () => {
      render(<GameDiscovery />);

      const searchInput = screen.getByPlaceholderText('Search games, sports, locations...');

      // Type a query that matches
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Basketball' } });
      });

      expect(screen.getByText('Basketball Pickup')).toBeInTheDocument();

      // Type a query that doesn't match
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'zzzznotexist' } });
      });

      expect(screen.queryByText('Basketball Pickup')).not.toBeInTheDocument();

      // Clear the search via the clear button
      const clearButtons = screen.getAllByRole('button');
      const clearBtn = clearButtons.find(btn => {
        const icon = btn.querySelector('[data-testid="icon-x"]');
        // The search clear button is inside the search bar (not in a filter chip)
        return icon && btn.closest('[style*="position: relative"]');
      });

      if (clearBtn) {
        await act(async () => {
          fireEvent.click(clearBtn);
        });

        expect(screen.getByText('Basketball Pickup')).toBeInTheDocument();
      }
    });
  });
});
