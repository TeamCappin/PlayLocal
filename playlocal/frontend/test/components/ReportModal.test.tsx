import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ReportModal } from "../../components/ReportModal";


jest.mock("lucide-react", () => ({
  X: () => <div data-testid="icon-x" />,
  AlertTriangle: () => <div data-testid="icon-warn" />,
  Loader2: () => <div data-testid="icon-loader" />,
  CheckCircle: () => <div data-testid="icon-check" />,
}));


jest.mock("@/hooks/useReportUser", () => ({
  useReportUser: jest.fn(),
}));

import { useReportUser } from "@/hooks/useReportUser";

describe("ReportModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders nothing when isOpen=false", () => {
    // Arrange
    (useReportUser as jest.Mock).mockReturnValue({
      submitReport: jest.fn(),
      isSubmitting: false,
      error: null,
    });

    // Act
    render(
      <ReportModal
        isOpen={false}
        onClose={jest.fn()}
        targetName="Bob"
        reportType="user"
      />
    );

    // Assert
    expect(screen.queryByText("Report User")).not.toBeInTheDocument();
  });

  it("shows validation error when reason selected but details empty", async () => {
    // Arrange
    (useReportUser as jest.Mock).mockReturnValue({
      submitReport: jest.fn(),
      isSubmitting: false,
      error: null,
    });

    render(
      <ReportModal
        isOpen={true}
        onClose={jest.fn()}
        targetName="Bob"
        reportType="user"
        reportedUserId="u1"
      />
    );

    // Act: wait until mounted effect runs (modal appears)
    await waitFor(() => {
      expect(screen.getByText("Report User")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("Select a reason").closest("select")!, {
      target: { value: "OTHER" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    // Assert
    expect(
      await screen.findByText("Please provide details about your report")
    ).toBeInTheDocument();
  });

  it("submits report successfully and calls onClose after 2 seconds", async () => {
    // Arrange
    const onClose = jest.fn();
    const submitReport = jest.fn().mockResolvedValue({ ok: true });

    (useReportUser as jest.Mock).mockReturnValue({
      submitReport,
      isSubmitting: false,
      error: null,
    });

    render(
      <ReportModal
        isOpen={true}
        onClose={onClose}
        targetName="Bob"
        reportType="user"
        reportedUserId="u1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Report User")).toBeInTheDocument();
    });

    // Act
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "OTHER" } });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Some details" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Submit Report"));
    });

    // Assert submit payload
    await waitFor(() => {
      expect(submitReport).toHaveBeenCalledTimes(1);
      expect(submitReport).toHaveBeenCalledWith(
        expect.objectContaining({
          reportedUserId: "u1",
          reportType: "OTHER",
          details: "Some details",
        })
      );
    });

    // Success screen shows
    await waitFor(() => {
      expect(screen.getByText("Report Submitted")).toBeInTheDocument();
    });

    // after 2 seconds, closes
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("attendance_dispute prefixes scoreHistoryId and does NOT send reportedUserId", async () => {
    // Arrange
    const submitReport = jest.fn().mockResolvedValue({ ok: true });

    (useReportUser as jest.Mock).mockReturnValue({
      submitReport,
      isSubmitting: false,
      error: null,
    });

    render(
      <ReportModal
        isOpen={true}
        onClose={jest.fn()}
        targetName="Bob"
        reportType="attendance_dispute"
        gameTitle="Game X"
        scoreHistoryId="sh-123"
        reportedUserId="should-not-send"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Dispute Attendance")).toBeInTheDocument();
    });

    // Act
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SAFETY" } });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "I was there." } });

    await act(async () => {
      fireEvent.click(screen.getByText("Submit Dispute"));
    });

    // Assert
    await waitFor(() => {
      expect(submitReport).toHaveBeenCalledWith(
        expect.objectContaining({
          reportedUserId: undefined,
          reportType: "SAFETY",
          details: "[Dispute for score entry: sh-123] I was there.",
        })
      );
    });
  });
});
