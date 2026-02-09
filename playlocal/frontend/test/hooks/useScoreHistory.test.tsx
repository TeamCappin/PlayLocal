import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  useScoreHistory,
  formatDelta,
  getDeltaColor,
  formatScoreReason,
} from "../../hooks/useScoreHistory";

jest.mock("@/lib/api", () => ({
  scoreHistoryApi: {
    getMyHistory: jest.fn(),
    getMySummary: jest.fn(),
    getHistory: jest.fn(),
    getSummary: jest.fn(),
  },
}));

import { scoreHistoryApi } from "@/lib/api";

function Harness(props: { userId?: string; autoFetch?: boolean }) {
  const {
    history,
    currentScore,
    error,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  } = useScoreHistory({ userId: props.userId, autoFetch: props.autoFetch });

  return (
    <div>
      <div data-testid="len">{history.length}</div>
      <div data-testid="score">{currentScore}</div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="error">{error ?? ""}</div>
      <div data-testid="hasMore">{String(hasMore)}</div>

      <button onClick={loadMore}>LoadMore</button>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

describe("useScoreHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("autoFetch (no userId) calls getMyHistory + getMySummary and sets state", async () => {
    // Arrange
    (scoreHistoryApi.getMyHistory as jest.Mock).mockResolvedValue({
      history: [{ scoreHistoryId: "h1" }],
      currentScore: 90,
      currentPage: 0,
      totalPages: 1,
      totalEntries: 1,
    });

    (scoreHistoryApi.getMySummary as jest.Mock).mockResolvedValue({
      currentScore: 90,
      attendedCount: 1,
      noShowCount: 0,
      gamesCount: 1,
      attendanceRate: 100,
    });

    // Act
    render(<Harness autoFetch={true} />);

    // Assert
    await waitFor(() => {
      expect(scoreHistoryApi.getMyHistory).toHaveBeenCalledWith(0, 10);
      expect(scoreHistoryApi.getMySummary).toHaveBeenCalledTimes(1);

      expect(screen.getByTestId("len")).toHaveTextContent("1");
      expect(screen.getByTestId("score")).toHaveTextContent("90");
      expect(screen.getByTestId("error")).toHaveTextContent("");
    });
  });

  it("autoFetch (with userId) calls getHistory + getSummary", async () => {
    // Arrange
    (scoreHistoryApi.getHistory as jest.Mock).mockResolvedValue({
      history: [{ scoreHistoryId: "h1" }],
      currentScore: 80,
      currentPage: 0,
      totalPages: 1,
      totalEntries: 1,
    });

    (scoreHistoryApi.getSummary as jest.Mock).mockResolvedValue({
      currentScore: 80,
      attendedCount: 0,
      noShowCount: 1,
      gamesCount: 1,
      attendanceRate: 0,
    });

    // Act
    render(<Harness userId="user-123" autoFetch={true} />);

    // Assert
    await waitFor(() => {
      expect(scoreHistoryApi.getHistory).toHaveBeenCalledWith("user-123", 0, 10);
      expect(scoreHistoryApi.getSummary).toHaveBeenCalledWith("user-123");
      expect(screen.getByTestId("score")).toHaveTextContent("80");
    });
  });

  it("loadMore fetches next page and appends history when hasMore", async () => {
    // Arrange
    (scoreHistoryApi.getMySummary as jest.Mock).mockResolvedValue({
      currentScore: 95,
      attendedCount: 0,
      noShowCount: 0,
      gamesCount: 0,
      attendanceRate: 0,
    });

    (scoreHistoryApi.getMyHistory as jest.Mock).mockImplementation(async (page: number) => {
      if (page === 0) {
        return {
          history: [{ scoreHistoryId: "p0" }],
          currentScore: 95,
          currentPage: 0,
          totalPages: 2,
          totalEntries: 2,
        };
      }
      return {
        history: [{ scoreHistoryId: "p1" }],
        currentScore: 95,
        currentPage: 1,
        totalPages: 2,
        totalEntries: 2,
      };
    });

    render(<Harness autoFetch={true} />);

    await waitFor(() => {
      expect(screen.getByTestId("len")).toHaveTextContent("1");
      expect(screen.getByTestId("hasMore")).toHaveTextContent("true");
    });

    // Act
    await act(async () => {
      fireEvent.click(screen.getByText("LoadMore"));
    });

    // Assert
    await waitFor(() => {
      expect(scoreHistoryApi.getMyHistory).toHaveBeenCalledWith(1, 10);
      expect(screen.getByTestId("len")).toHaveTextContent("2");
    });
  });

  it("format helpers behave correctly", () => {
    // Arrange + Act + Assert
    expect(formatDelta(2.34)).toBe("+2.3%");
    expect(formatDelta(-2.34)).toBe("-2.3%");
    expect(formatDelta(0)).toBe("0%");

    expect(getDeltaColor(1)).toBe("text-green-600");
    expect(getDeltaColor(-1)).toBe("text-red-600");
    expect(getDeltaColor(0)).toBe("text-gray-600");

    expect(formatScoreReason("ATTENDANCE").label).toBe("Attended");
    expect(formatScoreReason("NO_SHOW").label).toBe("No-show");
    expect(formatScoreReason("SOMETHING").label).toBe("SOMETHING");
  });
});
