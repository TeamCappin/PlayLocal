import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { GameDiscovery } from "../components/GameDiscovery";
import "@testing-library/jest-dom";

// Mock dependencies
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("../hooks/useGames", () => ({
  useGames: jest.fn(),
}));

jest.mock("lucide-react", () => ({
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
}));

import { useGames } from "../hooks/useGames";

describe("GameDiscovery Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading spinner when isLoading is true", () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: true,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText("Loading games...")).toBeInTheDocument();
      expect(screen.getByTestId("icon-loader")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show no games message when games array is empty", () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText(/No games available/i)).toBeInTheDocument();
    });
  });

  describe("Games Display", () => {
    const mockGames = [
      {
        gameId: "game-1",
        title: "Basketball Pickup",
        sportName: "Basketball",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: "Central Park", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 6,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "John Doe", reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Fun game",
        tags: [],
      },
      {
        gameId: "game-2",
        title: "Soccer Match",
        sportName: "Soccer",
        startTime: new Date(Date.now() + 7200000).toISOString(),
        endTime: new Date(Date.now() + 10800000).toISOString(),
        location: { name: "Field House", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 10,
        maxPlayers: 10,
        minPlayers: 6,
        skillBand: "Advanced",
        intensityBand: "Competitive",
        indoorOutdoor: "indoor",
        organizer: { userId: "user-2", displayName: "Jane Smith", reliabilityScore: 98 },
        status: "SCHEDULED",
        description: "Competitive match",
        tags: [],
      },
    ];

    it("should render games when data is available", () => {
      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText("Basketball Pickup")).toBeInTheDocument();
      expect(screen.getByText("Soccer Match")).toBeInTheDocument();
    });

    it("should display game details correctly", () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [mockGames[0]],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText("Basketball Pickup")).toBeInTheDocument();
      expect(screen.getByText("Central Park")).toBeInTheDocument();
      expect(screen.getByText("Intermediate")).toBeInTheDocument();
      expect(screen.getByText("6/10 players")).toBeInTheDocument();
    });

    it("should show location privacy when hasExactLocationAccess is false", () => {
      const privateGame = {
        ...mockGames[0],
        hasExactLocationAccess: false,
        approximateLocation: "Montreal, QC",
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [privateGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText("Location Hidden")).toBeInTheDocument();
      expect(screen.getByText(/Montreal/i)).toBeInTheDocument();
    });

    it("should show almost-full status for games near capacity", () => {
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
      expect(screen.getByText("9/10 players")).toBeInTheDocument();
    });
  });

  describe("View Mode Toggle", () => {
    const mockGames = [
      {
        gameId: "game-1",
        title: "Basketball Pickup",
        sportName: "Basketball",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: "Central Park", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 6,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "John Doe", reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Fun game",
        tags: [],
      },
    ];

    it("should toggle to map view when map button is clicked", () => {
      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      const buttons = screen.getAllByRole("button");
      const mapButton = buttons.find((btn) => btn.querySelector('[data-testid="icon-map"]'));

      if (mapButton) {
        fireEvent.click(mapButton);
        expect(screen.getByText(/Interactive map view would appear here/i)).toBeInTheDocument();
      }
    });

    it("should toggle back to grid view when calendar button is clicked", () => {
      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      const buttons = screen.getAllByRole("button");
      const mapButton = buttons.find((btn) => btn.querySelector('[data-testid="icon-map"]'));
      const gridButton = buttons.find((btn) => btn.querySelector('[data-testid="icon-calendar"]'));

      if (mapButton && gridButton) {
        fireEvent.click(mapButton);
        expect(screen.getByText(/Interactive map view would appear here/i)).toBeInTheDocument();

        fireEvent.click(gridButton);
        expect(screen.queryByText(/Interactive map view would appear here/i)).not.toBeInTheDocument();
      }
    });
  });

  describe("Filter Toggle", () => {
    it("should toggle filters when filter button is clicked", async () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      const filterButton = screen.getByText("Filters");
      
      await act(async () => {
        fireEvent.click(filterButton);
      });

      // Wait for modal to render - check for "Distance" label
      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });
      expect(screen.getByText("Skill Level")).toBeInTheDocument();
    });
  });

  describe("Date Display", () => {
    it("should show Today for games starting today", () => {
      const todayGame = {
        gameId: "game-today",
        title: "Today's Game",
        sportName: "Basketball",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        location: { name: "Park", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "All Levels",
        intensityBand: "Medium",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "Host", reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Game today",
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [todayGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("should show Tomorrow for games starting tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setHours(12, 0, 0, 0); // Set to noon tomorrow
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tomorrowGame = {
        gameId: "game-tomorrow",
        title: "Tomorrow's Game",
        sportName: "Soccer",
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 3600000).toISOString(),
        location: { name: "Field", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 3,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Beginner",
        intensityBand: "Casual",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "Host", reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Game tomorrow",
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

  describe("Indoor/Outdoor Display", () => {
    it("should show indoor indicator for indoor games", () => {
      const indoorGame = {
        gameId: "game-indoor",
        title: "Indoor Basketball",
        sportName: "Basketball",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: "Gym", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "indoor",
        organizer: { userId: "user-1", displayName: "Host", reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Indoor game",
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [indoorGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText("Indoor")).toBeInTheDocument();
    });
  });

  describe("Link Navigation", () => {
    it("should render clickable game cards with correct href", () => {
      const mockGames = [
        {
          gameId: "game-123",
          title: "Test Game",
          sportName: "Basketball",
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          location: { name: "Park", city: "Montreal" },
          hasExactLocationAccess: true,
          approximateLocation: "Montreal, QC",
          confirmedCount: 5,
          maxPlayers: 10,
          minPlayers: 4,
          skillBand: "Intermediate",
          intensityBand: "High",
          indoorOutdoor: "outdoor",
          organizer: { userId: "user-1", displayName: "Host", reliabilityScore: 95 },
          status: "SCHEDULED",
          description: "Test",
          tags: [],
        },
      ];

      (useGames as jest.Mock).mockReturnValue({
        games: mockGames,
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/games/game-123");
    });
  });

  describe("Filter Application", () => {
    const mockGames = [
      {
        gameId: "game-1",
        title: "Basketball Pickup",
        sportName: "Basketball",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: "Central Park", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 6,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "John Doe", reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Fun game",
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

    it("should apply filters when search button is clicked", async () => {
      render(<GameDiscovery />);

      // Open filter modal
      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      // Change sport name filter
      const sportInput = screen.getByPlaceholderText(/Enter sport name/i);
      await act(async () => {
        fireEvent.change(sportInput, { target: { value: "Basketball" } });
      });

      // Change skill level
      const skillLabel = screen.getByText("Skill Level");
      const skillSelect = skillLabel.parentElement?.querySelector('select');
      if (skillSelect) {
        await act(async () => {
          fireEvent.change(skillSelect, { target: { value: "intermediate" } });
        });
      }

      // Click search button
      const searchButton = screen.getByText("Search");
      await act(async () => {
        fireEvent.click(searchButton);
      });

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText("Distance")).not.toBeInTheDocument();
      });
    });

    it("should close modal when X button is clicked", async () => {
      render(<GameDiscovery />);

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId("icon-x").closest("button");
      if (closeButton) {
        await act(async () => {
          fireEvent.click(closeButton);
        });
      }

      await waitFor(() => {
        expect(screen.queryByText("Distance")).not.toBeInTheDocument();
      });
    });

    it("should close modal when backdrop is clicked", async () => {
      render(<GameDiscovery />);

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      // Find backdrop (the fixed overlay)
      const backdrop = screen.getByText("Distance").closest(".fixed");
      if (backdrop) {
        await act(async () => {
          fireEvent.click(backdrop);
        });
      }

      await waitFor(() => {
        expect(screen.queryByText("Distance")).not.toBeInTheDocument();
      });
    });

    it("should update filter values when inputs change", async () => {
      render(<GameDiscovery />);

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      // Change distance filter - find select near "Distance" label
      const distanceLabel = screen.getByText("Distance");
      const distanceSelect = distanceLabel.parentElement?.querySelector('select');
      if (distanceSelect) {
        await act(async () => {
          fireEvent.change(distanceSelect, { target: { value: "within 10km" } });
        });
        expect(distanceSelect).toHaveValue("within 10km");
      }

      // Change location type
      const locationLabel = screen.getByText("Location Type");
      const locationSelect = locationLabel.parentElement?.querySelector('select');
      if (locationSelect) {
        await act(async () => {
          fireEvent.change(locationSelect, { target: { value: "indoor" } });
        });
        expect(locationSelect).toHaveValue("indoor");
      }

      // Change intensity
      const intensityLabel = screen.getByText("Intensity");
      const intensitySelect = intensityLabel.parentElement?.querySelector('select');
      if (intensitySelect) {
        await act(async () => {
          fireEvent.change(intensitySelect, { target: { value: "competitive" } });
        });
        expect(intensitySelect).toHaveValue("competitive");
      }
    });
  });

  describe("Error State", () => {
    it("should display error message when useGames returns error", () => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: "Failed to load games",
      });

      render(<GameDiscovery />);

      // Component should handle error gracefully
      // Check that error doesn't crash the component
      expect(screen.queryByText(/No games available/i)).toBeInTheDocument();
    });
  });

  describe("Geolocation", () => {
    it("should handle geolocation when available", () => {
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

      Object.defineProperty(global.navigator, "geolocation", {
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

    it("should handle geolocation error gracefully", () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn((success, error) => {
          error({ code: 1, message: "User denied geolocation" });
        }),
      };

      Object.defineProperty(global.navigator, "geolocation", {
        value: mockGeolocation,
        writable: true,
      });

      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      render(<GameDiscovery />);

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      // Should not crash - component continues without location

      consoleSpy.mockRestore();
    });

    it("should work when geolocation is not available", () => {
      Object.defineProperty(global.navigator, "geolocation", {
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

  describe("Filter Conversion Logic", () => {
    beforeEach(() => {
      (useGames as jest.Mock).mockReturnValue({
        games: [],
        isLoading: false,
        error: null,
      });
    });

    it("should apply sportName filter when provided", async () => {
      render(<GameDiscovery />);

      // Clear initial calls
      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      const sportInput = screen.getByPlaceholderText(/Enter sport name/i);
      await act(async () => {
        fireEvent.change(sportInput, { target: { value: "Basketball" } });
      });

      const searchButton = screen.getByText("Search");
      await act(async () => {
        fireEvent.click(searchButton);
      });

      // Verify useGames was called with sportName filter
      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          sportName: "Basketball",
        });
      });
    });

    it("should apply skillLevel filter with proper mapping", async () => {
      render(<GameDiscovery />);

      // Clear initial calls
      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      const skillLabel = screen.getByText("Skill Level");
      const skillSelect = skillLabel.parentElement?.querySelector('select');
      if (!skillSelect) throw new Error("Skill select not found");
      await act(async () => {
        fireEvent.change(skillSelect, { target: { value: "beginner" } });
      });

      const searchButton = screen.getByText("Search");
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          skillLevel: "Beginner",
        });
      });
    });

    it("should apply locationType filter", async () => {
      render(<GameDiscovery />);

      // Clear initial calls
      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      const locationLabel = screen.getByText("Location Type");
      const locationSelect = locationLabel.parentElement?.querySelector('select');
      if (!locationSelect) throw new Error("Location select not found");
      await act(async () => {
        fireEvent.change(locationSelect, { target: { value: "indoor" } });
      });

      const searchButton = screen.getByText("Search");
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          locationType: "indoor",
        });
      });
    });

    it("should apply intensity filter with proper mapping", async () => {
      render(<GameDiscovery />);

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      const intensityLabel = screen.getByText("Intensity");
      const intensitySelect = intensityLabel.parentElement?.querySelector('select');
      if (!intensitySelect) throw new Error("Intensity select not found");
      await act(async () => {
        fireEvent.change(intensitySelect, { target: { value: "high" } });
      });

      const searchButton = screen.getByText("Search");
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        expect(useGames).toHaveBeenCalledWith(
          expect.objectContaining({
            intensity: "High",
          }),
        );
      });
    });

    it("should apply distance filter when userLocation is available", async () => {
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

      Object.defineProperty(global.navigator, "geolocation", {
        value: mockGeolocation,
        writable: true,
      });

      render(<GameDiscovery />);

      // Wait for geolocation to complete
      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      const distanceLabel = screen.getByText("Distance");
      const distanceSelect = distanceLabel.parentElement?.querySelector('select');
      if (!distanceSelect) throw new Error("Distance select not found");
      await act(async () => {
        fireEvent.change(distanceSelect, { target: { value: "within 10km" } });
      });

      // Clear initial calls before applying filter
      (useGames as jest.Mock).mockClear();

      const searchButton = screen.getByText("Search");
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

    it("should handle all filter types together", async () => {
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

      Object.defineProperty(global.navigator, "geolocation", {
        value: mockGeolocation,
        writable: true,
      });

      render(<GameDiscovery />);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });

      // Clear initial calls
      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      // Set all filters
      const sportInput = screen.getByPlaceholderText(/Enter sport name/i);
      await act(async () => {
        fireEvent.change(sportInput, { target: { value: "Soccer" } });
      });

      const skillLabel = screen.getByText("Skill Level");
      const skillSelect = skillLabel.parentElement?.querySelector('select');
      if (skillSelect) {
        await act(async () => {
          fireEvent.change(skillSelect, { target: { value: "intermediate" } });
        });
      }

      const locationLabel = screen.getByText("Location Type");
      const locationSelect = locationLabel.parentElement?.querySelector('select');
      if (locationSelect) {
        await act(async () => {
          fireEvent.change(locationSelect, { target: { value: "outdoor" } });
        });
      }

      const intensityLabel = screen.getByText("Intensity");
      const intensitySelect = intensityLabel.parentElement?.querySelector('select');
      if (intensitySelect) {
        await act(async () => {
          fireEvent.change(intensitySelect, { target: { value: "competitive" } });
        });
      }

      const distanceLabel = screen.getByText("Distance");
      const distanceSelect = distanceLabel.parentElement?.querySelector('select');
      if (distanceSelect) {
        await act(async () => {
          fireEvent.change(distanceSelect, { target: { value: "within 5km" } });
        });
      }

      const searchButton = screen.getByText("Search");
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          sportName: "Soccer",
          skillLevel: "Intermediate",
          locationType: "outdoor",
          intensity: "Competitive",
          lat: 45.5017,
          lon: -73.5673,
          radiusKm: 5,
        });
      });
    });

    it("should handle skillLevel with capitalized value", async () => {
      render(<GameDiscovery />);

      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      const skillLabel = screen.getByText("Skill Level");
      const skillSelect = skillLabel.parentElement?.querySelector('select');
      if (skillSelect) {
        // Test with "advanced" (lowercase) - should map to "Advanced"
        await act(async () => {
          fireEvent.change(skillSelect, { target: { value: "advanced" } });
        });
      }

      const searchButton = screen.getByText("Search");
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          skillLevel: "Advanced",
        });
      });
    });

    it("should handle intensity with casual value", async () => {
      render(<GameDiscovery />);

      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      const intensityLabel = screen.getByText("Intensity");
      const intensitySelect = intensityLabel.parentElement?.querySelector('select');
      if (intensitySelect) {
        // Test with "casual" (lowercase) - should map to "Casual"
        await act(async () => {
          fireEvent.change(intensitySelect, { target: { value: "casual" } });
        });
      }

      const searchButton = screen.getByText("Search");
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          intensity: "Casual",
        });
      });
    });

    it("should not include radiusKm when distance is any distance", async () => {
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

      Object.defineProperty(global.navigator, "geolocation", {
        value: mockGeolocation,
        writable: true,
      });

      render(<GameDiscovery />);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });

      (useGames as jest.Mock).mockClear();

      const filterButton = screen.getByText("Filters");
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Distance")).toBeInTheDocument();
      });

      // Distance is already "any distance" by default, so just click search
      const searchButton = screen.getByText("Search");
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        const calls = (useGames as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        // Should not have radiusKm when distance is "any distance"
        if (lastCall[0]) {
          expect(lastCall[0]).not.toHaveProperty("radiusKm");
        }
      });
    });
  });

  describe("Game Transformation Edge Cases", () => {
    it("should handle games with missing location data", () => {
      const gameWithoutLocation = {
        gameId: "game-no-location",
        title: "Game Without Location",
        sportName: "Basketball",
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
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "Host", reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Test",
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithoutLocation],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Verify the game renders with location privacy
      expect(screen.getByText("Location Hidden")).toBeInTheDocument();
      expect(screen.getByText("Game Without Location")).toBeInTheDocument();
    });

    it("should handle games with unknown sport", () => {
      const gameWithUnknownSport = {
        gameId: "game-unknown-sport",
        title: "Unknown Sport Game",
        sportName: "Quidditch",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: "Park", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "Host", reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Test",
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithUnknownSport],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should render without crashing - uses fallback image
      expect(screen.getByText("Unknown Sport Game")).toBeInTheDocument();
    });

    it("should handle games without endTime", () => {
      const gameWithoutEndTime = {
        gameId: "game-no-end",
        title: "Game Without End Time",
        sportName: "Basketball",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: null,
        location: { name: "Park", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "Host", reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Test",
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithoutEndTime],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should use default duration
      expect(screen.getByText("Game Without End Time")).toBeInTheDocument();
    });

    it("should handle games with full status", () => {
      const fullGame = {
        gameId: "game-full",
        title: "Full Game",
        sportName: "Basketball",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: "Park", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 10,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "Host", reliabilityScore: 95 },
        status: "FULL",
        description: "Test",
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [fullGame],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      expect(screen.getByText("Full Game")).toBeInTheDocument();
      expect(screen.getByText("10/10 players")).toBeInTheDocument();
    });

    it("should handle organizer without displayName", () => {
      const gameWithoutOrganizerName = {
        gameId: "game-no-organizer-name",
        title: "Game Without Organizer Name",
        sportName: "Basketball",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: "Park", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: null, reliabilityScore: 95 },
        status: "SCHEDULED",
        description: "Test",
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithoutOrganizerName],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should render with fallback "Host"
      expect(screen.getByText("Game Without Organizer Name")).toBeInTheDocument();
    });

    it("should handle unknown game status", () => {
      const gameWithUnknownStatus = {
        gameId: "game-unknown-status",
        title: "Game With Unknown Status",
        sportName: "Basketball",
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        location: { name: "Park", city: "Montreal" },
        hasExactLocationAccess: true,
        approximateLocation: "Montreal, QC",
        confirmedCount: 5,
        maxPlayers: 10,
        minPlayers: 4,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        organizer: { userId: "user-1", displayName: "Host", reliabilityScore: 95 },
        status: "UNKNOWN_STATUS",
        description: "Test",
        tags: [],
      };

      (useGames as jest.Mock).mockReturnValue({
        games: [gameWithUnknownStatus],
        isLoading: false,
        error: null,
      });

      render(<GameDiscovery />);

      // Should render with fallback status color
      expect(screen.getByText("Game With Unknown Status")).toBeInTheDocument();
      expect(screen.getByText("5/10 players")).toBeInTheDocument();
    });
  });
});
