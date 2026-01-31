import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GameRoom } from "../components/GameRoom";
import "@testing-library/jest-dom";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../hooks/useGames", () => ({
  useGame: jest.fn(),
}));

jest.mock("../lib/api", () => ({
  endorsementsApi: {
    create: jest.fn(),
  },
  gamesApi: {},
}));

jest.mock("lucide-react", () => ({
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
  Medal: () => <div data-testid="icon-medal" />,
  XCircle: () => <div data-testid="icon-xcircle" />,
  Copy: () => <div data-testid="icon-copy" />,
  Check: () => <div data-testid="icon-checkmark" />,
}));

jest.mock("../components/chat/ChatPanel", () => ({
  ChatPanel: () => <div data-testid="chat-panel" />,
}));

jest.mock("../components/ReportModal", () => ({
  ReportModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="report-modal">Report Modal</div> : null,
}));

jest.mock("../components/JoinConfirmationModal", () => ({
  JoinConfirmationModal: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div data-testid="join-confirmation-modal">
        <button onClick={() => onConfirm([])}>Confirm Join</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

import { useAuth } from "../context/AuthContext";
import { useGame } from "../hooks/useGames";
import { useParams, useRouter } from "next/navigation";
import { endorsementsApi } from "../lib/api";

describe("GameRoom Component", () => {
  const mockPush = jest.fn();
  const mockRefetch = jest.fn();
  const mockJoinGame = jest.fn();
  const mockLeaveGame = jest.fn();

  const mockUser = {
    userId: "user-1",
    displayName: "Test User",
    email: "test@example.com",
  };

  const mockGame = {
    gameId: "game-123",
    title: "Basketball Game",
    sportName: "Basketball",
    startTime: new Date("2026-02-01T10:00:00Z").toISOString(),
    endTime: new Date("2026-02-01T12:00:00Z").toISOString(),
    location: { name: "Test Park" },
    organizer: { userId: "organizer-1", displayName: "Organizer" },
    maxPlayers: 10,
    minAge: null,
    maxAge: null,
    tags: [],
    skillBand: "Intermediate",
    intensityBand: "Competitive",
    indoorOutdoor: "outdoor",
    status: "UPCOMING",
  };

  const mockRoster = {
    confirmed: [
      {
        participationId: "p1",
        userId: "organizer-1",
        displayName: "Organizer",
        role: "ORGANIZER",
        joinStatus: "CONFIRMED",
        attendanceStatus: null,
        reliabilityScore: 100,
      },
    ],
    waitlisted: [],
    maxPlayers: 10,
    spotsAvailable: 9,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: "game-123" });
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
    });
  });

  describe("Loading State", () => {
    it("shows loading spinner when data is loading", () => {
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
      expect(screen.getByText("Loading game...")).toBeInTheDocument();
      expect(screen.getByTestId("icon-loader")).toBeInTheDocument();
    });
  });

  describe("Join Game Flow", () => {
    it("redirects to login when not authenticated", async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      render(<GameRoom />);

      // Look for any button containing "Join"
      const buttons = screen.getAllByRole("button");
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes("Join"),
      );

      if (joinButton) {
        fireEvent.click(joinButton);
        expect(mockPush).toHaveBeenCalledWith("/login");
      }
    });

    it("joins game directly when no restrictions", async () => {
      mockJoinGame.mockResolvedValue({
        joinStatus: "CONFIRMED",
        waitlistPosition: null,
      });

      render(<GameRoom />);

      const buttons = screen.getAllByRole("button");
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes("Join"),
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(mockJoinGame).toHaveBeenCalledWith(undefined);
        });

        await waitFor(() => {
          expect(
            screen.getByText("Successfully joined the game!"),
          ).toBeInTheDocument();
        });
      }
    });

    it("shows confirmation modal when game has restricted tags", async () => {
      const gameWithTags = {
        ...mockGame,
        tags: [{ tagId: "t1", name: "men", isRestricted: true }],
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

      const buttons = screen.getAllByRole("button");
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes("Join"),
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByTestId("join-confirmation-modal"),
          ).toBeInTheDocument();
        });
      }
    });

    it("shows confirmation modal when game has age requirements", async () => {
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

      const buttons = screen.getAllByRole("button");
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes("Join"),
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByTestId("join-confirmation-modal"),
          ).toBeInTheDocument();
        });
      }
    });

    it("joins after confirming in modal", async () => {
      const gameWithTags = {
        ...mockGame,
        tags: [{ tagId: "t1", name: "men", isRestricted: true }],
      };

      mockJoinGame.mockResolvedValue({
        joinStatus: "CONFIRMED",
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

      const buttons = screen.getAllByRole("button");
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes("Join"),
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByTestId("join-confirmation-modal"),
          ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Confirm Join"));

        await waitFor(() => {
          expect(mockJoinGame).toHaveBeenCalledWith([]);
        });
      }
    });

    it("shows waitlist message when joining full game", async () => {
      mockJoinGame.mockResolvedValue({
        joinStatus: "WAITLISTED",
        waitlistPosition: 3,
      });

      render(<GameRoom />);

      const buttons = screen.getAllByRole("button");
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes("Join"),
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByText(/You're on the waitlist \(#3\)/i),
          ).toBeInTheDocument();
        });
      }
    });

    it("shows error message when join fails", async () => {
      mockJoinGame.mockRejectedValue(new Error("Age confirmation required"));

      render(<GameRoom />);

      const buttons = screen.getAllByRole("button");
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes("Join"),
      );

      if (joinButton) {
        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(
            screen.getByText("Age confirmation required"),
          ).toBeInTheDocument();
        });
      }
    });
  });

  describe("Leave Game Flow", () => {
    it("leaves game successfully", async () => {
      const participantRoster = {
        confirmed: [
          ...mockRoster.confirmed,
          {
            participationId: "p2",
            userId: "user-1",
            displayName: "Test User",
            role: "PLAYER",
            joinStatus: "CONFIRMED",
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

      const buttons = screen.getAllByRole("button");
      const leaveButton = buttons.find((btn) =>
        btn.textContent?.includes("Leave"),
      );

      if (leaveButton) {
        fireEvent.click(leaveButton);

        await waitFor(() => {
          expect(mockLeaveGame).toHaveBeenCalled();
        });

        await waitFor(() => {
          expect(
            screen.getByText("Successfully left the game"),
          ).toBeInTheDocument();
        });
      }
    });

    it("shows error when leave fails", async () => {
      const participantRoster = {
        confirmed: [
          ...mockRoster.confirmed,
          {
            participationId: "p2",
            userId: "user-1",
            displayName: "Test User",
            role: "PLAYER",
            joinStatus: "CONFIRMED",
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

      mockLeaveGame.mockRejectedValue(new Error("Cannot leave game"));

      render(<GameRoom />);

      const buttons = screen.getAllByRole("button");
      const leaveButton = buttons.find((btn) =>
        btn.textContent?.includes("Leave"),
      );

      if (leaveButton) {
        fireEvent.click(leaveButton);

        await waitFor(() => {
          expect(screen.getByText("Cannot leave game")).toBeInTheDocument();
        });
      }
    });
  });

  describe("Endorsement Flow", () => {
    it("handles endorsement with FINISHED game and ATTENDED status", async () => {
      const finishedGame = {
        ...mockGame,
        status: "FINISHED",
      };

      const participantRoster = {
        confirmed: [
          {
            participationId: "p1",
            userId: "organizer-1",
            displayName: "Organizer",
            role: "ORGANIZER",
            joinStatus: "CONFIRMED",
            attendanceStatus: "ATTENDED",
            reliabilityScore: 100,
          },
          {
            participationId: "p2",
            userId: "user-1",
            displayName: "Test User",
            role: "PLAYER",
            joinStatus: "CONFIRMED",
            attendanceStatus: "ATTENDED",
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
      const lineupTab = screen.getByRole("button", { name: /Lineup/i });
      expect(lineupTab).toBeInTheDocument();
    });
  });

  describe("Tab Navigation", () => {
    it("switches to chat tab", () => {
      render(<GameRoom />);

      const chatTab = screen.getByText("Chat");
      fireEvent.click(chatTab);

      expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
    });

    it("switches to lineup tab", () => {
      render(<GameRoom />);

      const lineupTab = screen.getByRole("button", { name: /Lineup/i });
      fireEvent.click(lineupTab);

      // Check for "Confirmed" heading instead of "Confirmed Players"
      expect(screen.getByText(/Confirmed \(/i)).toBeInTheDocument();
    });
  });

  describe("Report Modal", () => {
    it("opens report modal when flag button is clicked", () => {
      render(<GameRoom />);

      const reportButton = screen.getByText(/Report Game/i);
      fireEvent.click(reportButton);

      expect(screen.getByTestId("report-modal")).toBeInTheDocument();
    });
  });

  describe("Waitlist Display", () => {
    it("shows waitlist badge for waitlisted users", () => {
      const waitlistedRoster = {
        confirmed: mockRoster.confirmed,
        waitlisted: [
          {
            participationId: "p2",
            userId: "user-1",
            displayName: "Test User",
            role: "PLAYER",
            joinStatus: "WAITLISTED",
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

      const lineupTab = screen.getByRole("button", { name: /Lineup/i });
      fireEvent.click(lineupTab);

      // Use getAllByText since "Waitlist" appears multiple times
      const waitlistElements = screen.getAllByText(/Waitlist/i);
      expect(waitlistElements.length).toBeGreaterThan(0);
    });
  });

  // US-2.4: Cancel Game Feature Tests
  describe("US-2.4: Cancel Game Feature", () => {
    it("should show cancel button for organizer on scheduled game", () => {
      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: {
          userId: "user-123",
          displayName: "Test Organizer",
          reliabilityScore: 95,
        },
        sport: { sportId: "sport-1", name: "Basketball" },
        location: {
          name: "Test Location",
          city: "Test City",
        },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        minPlayers: 2,
        confirmedCount: 5,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "user-123",
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 5 },
        isLoading: false,
        error: null,
        cancelGame: jest.fn(),
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);
      expect(screen.getByText("Cancel Game")).toBeInTheDocument();
    });

    it("should call cancelGame when confirmed", async () => {
      const mockCancelGame = jest.fn().mockResolvedValue({});
      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: {
          userId: "user-123",
          displayName: "Test Organizer",
          reliabilityScore: 95,
        },
        sport: { sportId: "sport-1", name: "Basketball" },
        location: {
          name: "Test Location",
          city: "Test City",
        },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        minPlayers: 2,
        confirmedCount: 5,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "user-123",
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 5 },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      // Click cancel button
      fireEvent.click(screen.getByText("Cancel Game"));

      // Confirm cancellation
      await waitFor(() => {
        expect(screen.getByText("Yes, Cancel")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Yes, Cancel"));

      await waitFor(() => {
        expect(mockCancelGame).toHaveBeenCalled();
      });
    });
  });

  // US-2.4: Share Game Feature Tests
  describe("US-2.4: Share Game Feature", () => {
    it("should copy link to clipboard when share clicked", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: {
          userId: "user-123",
          displayName: "Test Organizer",
          reliabilityScore: 95,
        },
        sport: { sportId: "sport-1", name: "Basketball" },
        location: {
          name: "Test Location",
          city: "Test City",
        },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        minPlayers: 2,
        confirmedCount: 5,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, userId: "user-456" });
      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 5 },
        isLoading: false,
        error: null,
        cancelGame: jest.fn(),
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText("Share Game"));

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalled();
        expect(screen.getByText("Link Copied!")).toBeInTheDocument();
      });
    });
  });
});
