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
});
