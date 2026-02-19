import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ScoreHistoryList } from "../../components/ScoreHistoryList";

jest.mock("next/link", () => {
  return ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("lucide-react", () => ({
  TrendingUp: () => <div data-testid="icon-up" />,
  TrendingDown: () => <div data-testid="icon-down" />,
  Clock: () => <div data-testid="icon-clock" />,
  ChevronDown: () => <div data-testid="icon-chev" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Flag: () => <div data-testid="icon-flag" />,
}));

jest.mock("@/hooks/useScoreHistory", () => ({
  useScoreHistory: jest.fn(),
  formatScoreReason: jest.fn(() => ({ label: "No-show", color: "text-red-600", icon: "✗" })),
  formatDelta: jest.fn((d: number) => `${d}%`),
  getDeltaColor: jest.fn(() => "text-gray-600"),
}));

import { useScoreHistory } from "@/hooks/useScoreHistory";

describe("ScoreHistoryList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state when loading and empty", () => {
    // Arrange
    (useScoreHistory as jest.Mock).mockReturnValue({
      history: [],
      summary: null,
      isLoading: true,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });

    // Act
    render(<ScoreHistoryList />);

    // Assert
    expect(screen.getByText("Loading score history...")).toBeInTheDocument();
    expect(screen.getByTestId("icon-loader")).toBeInTheDocument();
  });

  it("shows error state and calls refresh on Retry", () => {
    // Arrange
    const refresh = jest.fn();
    (useScoreHistory as jest.Mock).mockReturnValue({
      history: [],
      summary: null,
      isLoading: false,
      error: "Boom",
      hasMore: false,
      loadMore: jest.fn(),
      refresh,
    });

    // Act
    render(<ScoreHistoryList />);

    // Assert
    expect(screen.getByText("Boom")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Retry"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("renders entries and expands on click", () => {
    // Arrange
    (useScoreHistory as jest.Mock).mockReturnValue({
      history: [
        {
          scoreHistoryId: "s1",
          reason: "NO_SHOW",
          delta: -5,
          createdAt: new Date().toISOString(),
          previousScore: 100,
          newScore: 95,
          description: "Details text",
          gameTitle: "Game A",
          gameId: "g1",
        },
      ],
      summary: null,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });

    // Act
    render(<ScoreHistoryList />);

    // Assert (collapsed)
    expect(screen.getByText("Game A")).toBeInTheDocument();
    expect(screen.queryByText("Details text")).not.toBeInTheDocument();

    // Act (expand)
    fireEvent.click(screen.getByRole("button"));

    // Assert (expanded)
    expect(screen.getByText("Details text")).toBeInTheDocument();
  });

  it("shows Report Issue button for NO_SHOW when expanded and triggers callback", () => {
    // Arrange
    const onDisputeClick = jest.fn();
    const entry = {
      scoreHistoryId: "s2",
      reason: "NO_SHOW",
      delta: -2,
      createdAt: new Date().toISOString(),
      previousScore: 90,
      newScore: 88,
      description: "No show details",
    };

    (useScoreHistory as jest.Mock).mockReturnValue({
      history: [entry],
      summary: null,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });

    // Act
    render(<ScoreHistoryList onDisputeClick={onDisputeClick} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    // Click report
    fireEvent.click(screen.getByText("Report Issue"));

    // Assert
    expect(onDisputeClick).toHaveBeenCalledTimes(1);
    expect(onDisputeClick).toHaveBeenCalledWith(entry);
  });
});
