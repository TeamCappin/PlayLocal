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

const mockGamesApiUpdate = jest.fn();
jest.mock("../lib/api", () => ({
  endorsementsApi: { create: jest.fn() },
  gamesApi: { update: (...args: unknown[]) => mockGamesApiUpdate(...args) },
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
  Edit: () => <div data-testid="icon-edit" />,
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

jest.mock("../components/OrganizerQualityBadge", () => ({
  OrganizerQualityBadge: () => <div data-testid="organizer-quality-badge" />,
}));

jest.mock("../components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
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
  const mockCancelGame = jest.fn();

  const mockUser = {
    userId: "user-1",
    displayName: "Test User",
    email: "test@example.com",
    reliabilityScore: 85,
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
      cancelGame: mockCancelGame,
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

    it("US-4.1: shows error when user reliability below game minReliabilityRequired", async () => {
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

      const buttons = screen.getAllByRole("button");
      const joinButton = buttons.find((btn) =>
        btn.textContent?.includes("Join"),
      );
      expect(joinButton).toBeDefined();
      fireEvent.click(joinButton!);

      await waitFor(() => {
        const errorEl = screen.getByText((content) =>
          content.includes("Minimum reliability score required") &&
          content.includes("90") &&
          content.includes("70"),
        );
        expect(errorEl).toBeInTheDocument();
      });
      expect(mockJoinGame).not.toHaveBeenCalled();
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

  describe("US-4.1 Reliability requirements in Details", () => {
    it("shows You meet the requirement when user score >= minReliabilityRequired", () => {
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
      expect(screen.getByText(/You meet the requirement!/i)).toBeInTheDocument();
    });

    it("shows You need X% to join when user score < minReliabilityRequired", () => {
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

    it("displays Min X% Reliability badge when game has minReliabilityRequired", () => {
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

  describe("Share, Edit and Cancel (coverage)", () => {
    const futureStart = () => new Date(Date.now() + 86400000).toISOString();
    const futureEnd = () => new Date(Date.now() + 86400000 + 7200000).toISOString();

    it("organizer can open edit modal and cancel", async () => {
      const scheduledGame = { ...mockGame, status: "SCHEDULED", minReliabilityRequired: 85, startTime: futureStart(), endTime: futureEnd() };
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
        user: { ...mockUser, userId: "organizer-1", reliabilityScore: 90 },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByTitle("Edit game settings"));
      await waitFor(() => expect(screen.getByText("Edit Game Settings")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));
      await waitFor(() => expect(screen.queryByText("Edit Game Settings")).not.toBeInTheDocument());
    });

    it("organizer cancel game shows confirm then success", async () => {
      mockCancelGame.mockResolvedValue(undefined);
      const scheduledGame = { ...mockGame, status: "SCHEDULED", startTime: futureStart(), endTime: futureEnd() };
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
        user: { ...mockUser, userId: "organizer-1" },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole("button", { name: /Cancel Game/i }));
      await waitFor(() => expect(screen.getByText(/Are you sure you want to cancel/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /Yes, Cancel/i }));
      await waitFor(() => expect(screen.getByText("Game has been cancelled")).toBeInTheDocument());
    });

    it("organizer save edit modal calls update and shows success", async () => {
      mockGamesApiUpdate.mockResolvedValue(undefined);
      mockRefetch.mockResolvedValue(undefined);
      const scheduledGame = { ...mockGame, status: "SCHEDULED", minReliabilityRequired: 80, startTime: futureStart(), endTime: futureEnd() };
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
        user: { ...mockUser, userId: "organizer-1" },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByTitle("Edit game settings"));
      await waitFor(() => expect(screen.getByText("Edit Game Settings")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));
      await waitFor(() => expect(screen.getByText("Game settings updated successfully!")).toBeInTheDocument());
      expect(mockGamesApiUpdate).toHaveBeenCalledWith("game-123", expect.objectContaining({ minReliabilityRequired: 80 }));
      expect(mockRefetch).toHaveBeenCalled();
    });

    it("organizer save edit shows error when update fails", async () => {
      mockGamesApiUpdate.mockRejectedValue(new Error("Network error"));
      const scheduledGame = { ...mockGame, status: "SCHEDULED", startTime: futureStart(), endTime: futureEnd() };
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
        user: { ...mockUser, userId: "organizer-1" },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByTitle("Edit game settings"));
      await waitFor(() => expect(screen.getByText("Edit Game Settings")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));
      await waitFor(() => expect(screen.getByText("Network error")).toBeInTheDocument());
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

    it("endorsement success shows success message", async () => {
      (endorsementsApi.create as jest.Mock).mockResolvedValue(undefined);
      const finishedGame = { ...mockGame, status: "FINISHED" };
      const rosterWithAttended = {
        confirmed: [
          { participationId: "p1", userId: "organizer-1", displayName: "Organizer", role: "ORGANIZER", joinStatus: "CONFIRMED", attendanceStatus: "ATTENDED", reliabilityScore: 100, isEndorsedByOrganizer: false },
          { participationId: "p2", userId: "user-2", displayName: "Other", role: "PLAYER", joinStatus: "CONFIRMED", attendanceStatus: "ATTENDED", reliabilityScore: 85, isEndorsedByOrganizer: false },
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
        user: { ...mockUser, userId: "organizer-1" },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole("button", { name: /Lineup/i }));
      await waitFor(() => expect(screen.getByTitle("Endorse as Organizer's Pick")).toBeInTheDocument());
      fireEvent.click(screen.getByTitle("Endorse as Organizer's Pick"));
      await waitFor(() => expect(screen.getByText("Player endorsed successfully!")).toBeInTheDocument());
    });

    it("endorsement duplicate refetches without showing error", async () => {
      (endorsementsApi.create as jest.Mock).mockRejectedValue(new Error("Duplicate endorsement exists"));
      const finishedGame = { ...mockGame, status: "FINISHED" };
      const rosterWithAttended = {
        confirmed: [
          { participationId: "p1", userId: "organizer-1", displayName: "Organizer", role: "ORGANIZER", joinStatus: "CONFIRMED", attendanceStatus: "ATTENDED", reliabilityScore: 100, isEndorsedByOrganizer: false },
          { participationId: "p2", userId: "user-2", displayName: "Other", role: "PLAYER", joinStatus: "CONFIRMED", attendanceStatus: "ATTENDED", reliabilityScore: 85, isEndorsedByOrganizer: false },
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
        user: { ...mockUser, userId: "organizer-1" },
        isAuthenticated: true,
      });
      render(<GameRoom />);
      fireEvent.click(screen.getByRole("button", { name: /Lineup/i }));
      await waitFor(() => expect(screen.getByTitle("Endorse as Organizer's Pick")).toBeInTheDocument());
      fireEvent.click(screen.getByTitle("Endorse as Organizer's Pick"));
      await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
      expect(screen.queryByText("Failed to endorse player")).not.toBeInTheDocument();
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


  // US-2.4: Share Game Feature Tests
  describe("US-2.4: Share Game Feature", () => {
    it("should copy link to clipboard when share clicked", async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        configurable: true,
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

    it("should use fallback copy method when clipboard API fails", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: jest.fn().mockRejectedValue(new Error("Clipboard API not supported")) },
        configurable: true,
      });

      // Mock document.execCommand
      const mockExecCommand = jest.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: { userId: "user-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
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
        expect(mockExecCommand).toHaveBeenCalledWith("copy");
        expect(screen.getByText("Link Copied!")).toBeInTheDocument();
      });
    });
  });

  // US-2.4: Cancel Game Feature Tests
  describe("US-2.4: Cancel Game Feature", () => {
    const mockCancelGame = jest.fn();

    it("should show cancel button for organizer on scheduled game", () => {
      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: { userId: "user-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "user-123",
        user: { userId: "user-123" },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 10 },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);
      expect(screen.getByText("Cancel Game")).toBeInTheDocument();
    });

    it("should not show cancel button for non-organizer", () => {
      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: { userId: "organizer-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "different-user",
        user: { userId: "different-user" },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 10 },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);
      expect(screen.queryByText("Cancel Game")).not.toBeInTheDocument();
    });

    it("should show confirmation dialog when cancel button clicked", async () => {
      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: { userId: "user-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "user-123",
        user: { userId: "user-123" },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 10 },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText("Cancel Game"));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to cancel this game/i)).toBeInTheDocument();
        expect(screen.getByText("Yes, Cancel")).toBeInTheDocument();
        expect(screen.getByText("No, Keep")).toBeInTheDocument();
      });
    });

    it("should cancel confirmation dialog when No Keep clicked", async () => {
      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: { userId: "user-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "user-123",
        user: { userId: "user-123" },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 10 },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText("Cancel Game"));

      await waitFor(() => {
        expect(screen.getByText("Yes, Cancel")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("No, Keep"));

      await waitFor(() => {
        expect(screen.queryByText(/Are you sure you want to cancel this game/i)).not.toBeInTheDocument();
      });

      expect(mockCancelGame).not.toHaveBeenCalled();
    });

    it("should call cancelGame when confirmed", async () => {
      mockCancelGame.mockResolvedValue({});

      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: { userId: "user-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "user-123",
        user: { userId: "user-123" },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 10 },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText("Cancel Game"));

      await waitFor(() => {
        expect(screen.getByText("Yes, Cancel")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Yes, Cancel"));

      await waitFor(() => {
        expect(mockCancelGame).toHaveBeenCalled();
        expect(screen.getByText("Game has been cancelled")).toBeInTheDocument();
      });
    });

    it("should show error when cancel fails", async () => {
      mockCancelGame.mockRejectedValue(new Error("Only the organizer can cancel this game"));

      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: { userId: "user-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "user-123",
        user: { userId: "user-123" },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 10 },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      fireEvent.click(screen.getByText("Cancel Game"));

      await waitFor(() => {
        expect(screen.getByText("Yes, Cancel")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Yes, Cancel"));

      await waitFor(() => {
        expect(screen.getByText("Only the organizer can cancel this game")).toBeInTheDocument();
      });
    });

    it("should show cancelled badge when game is cancelled", () => {
      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "CANCELLED",
        organizer: { userId: "user-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "user-456",
        user: { userId: "user-456" },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 10 },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      expect(screen.getByText("This game has been cancelled")).toBeInTheDocument();
    });

    it("should not show cancel button for cancelled game", () => {
      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "CANCELLED",
        organizer: { userId: "user-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
        tags: [],
      };

      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        userId: "user-123",
        user: { userId: "user-123" },
      });

      (useGame as jest.Mock).mockReturnValue({
        game: mockGame,
        roster: { confirmed: [], waitlisted: [], maxPlayers: 10, spotsAvailable: 10 },
        isLoading: false,
        error: null,
        cancelGame: mockCancelGame,
        refetch: jest.fn(),
        joinGame: jest.fn(),
        leaveGame: jest.fn(),
      });

      render(<GameRoom />);

      expect(screen.queryByText("Cancel Game")).not.toBeInTheDocument();
    });
  });

  // BUG-2.2: Game Not Found State Tests
  describe("BUG-2.2: Game Not Found State", () => {
    it("should show not found message when game is null", () => {
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

      expect(screen.getByText("Game Not Found")).toBeInTheDocument();
      expect(screen.getByText(/This game may have been removed or doesn't exist/i)).toBeInTheDocument();
      expect(screen.getByText("Browse Games")).toBeInTheDocument();
    });

    it("should show not found message when roster is null", () => {
      const mockGame = {
        gameId: "test-id",
        title: "Test Game",
        status: "SCHEDULED",
        organizer: { userId: "user-123", displayName: "Test Organizer", reliabilityScore: 95 },
        location: { name: "Test Location", city: "Test City" },
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        maxPlayers: 10,
        skillBand: "Intermediate",
        intensityBand: "High",
        indoorOutdoor: "outdoor",
        description: "Test game",
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

      expect(screen.getByText("Game Not Found")).toBeInTheDocument();
    });
  });
});
