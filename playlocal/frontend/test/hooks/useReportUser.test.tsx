import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import { useReportUser } from "../../hooks/useReportUser";

// ✅ Mock API dependency used by the hook
jest.mock("@/lib/api", () => ({
  reportsApi: {
    create: jest.fn(),
  },
}));

import { reportsApi } from "@/lib/api";

function Harness() {
  const { submitReport, isSubmitting, error, success, resetState } = useReportUser();

  return (
    <div>
      <div data-testid="isSubmitting">{String(isSubmitting)}</div>
      <div data-testid="error">{error ?? ""}</div>
      <div data-testid="success">{String(success)}</div>

      <button
        onClick={async () => {
          try {
            await submitReport({
              reportedUserId: "user-1",
              reportType: "OTHER",
              details: "Something happened",
            } as any);
          } catch {
            // ignore for tests
          }
        }}
      >
        Submit
      </button>

      <button onClick={resetState}>Reset</button>
    </div>
  );
}

describe("useReportUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets success=true when submitReport succeeds", async () => {
    // Arrange
    (reportsApi.create as jest.Mock).mockResolvedValue({ id: "r-1" });

    render(<Harness />);

    // Act
    await act(async () => {
      fireEvent.click(screen.getByText("Submit"));
    });

    // Assert
    await waitFor(() => {
      expect(reportsApi.create).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("success")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("");
      expect(screen.getByTestId("isSubmitting")).toHaveTextContent("false");
    });
  });

  it("sets friendly error for 429 rate limit", async () => {
    // Arrange
    (reportsApi.create as jest.Mock).mockRejectedValue({ status: 429 });

    render(<Harness />);

    // Act
    await act(async () => {
      fireEvent.click(screen.getByText("Submit"));
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "You have submitted too many reports. Please try again later."
      );
      expect(screen.getByTestId("success")).toHaveTextContent("false");
    });
  });

  it("resetState clears error and success", async () => {
    // Arrange
    (reportsApi.create as jest.Mock).mockRejectedValue({ status: 429 });
    render(<Harness />);

    await act(async () => {
      fireEvent.click(screen.getByText("Submit"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).not.toHaveTextContent("");
    });

    // Act
    fireEvent.click(screen.getByText("Reset"));

    // Assert
    expect(screen.getByTestId("error")).toHaveTextContent("");
    expect(screen.getByTestId("success")).toHaveTextContent("false");
  });
});
