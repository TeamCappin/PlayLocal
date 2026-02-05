import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import type { ChatMessage } from "@/lib/chat/types";
import { ChatMessageRow } from "../components/chat/ChatMessageRow";

// Mock the timestamp formatter so tests are stable
jest.mock("@/lib/chat/time", () => ({
  formatChatTimestamp: jest.fn(() => "10:30 AM"),
}));

describe("ChatMessageRow", () => {
  function makeMsg(overrides?: Partial<ChatMessage>): ChatMessage {
    return {
      id: "m1",
      senderId: "u1",
      senderName: "John Doe",
      content: "Hello world",
      createdAt: "2026-02-04T12:30:00.000Z",
      ...(overrides || {}),
    } as ChatMessage;
  }

  it("renders sender name, message content, and formatted timestamp", () => {
    const msg = makeMsg();
    render(<ChatMessageRow msg={msg} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("10:30 AM")).toBeInTheDocument();
  });

  it("shows Host badge when isHost=true", () => {
    const msg = makeMsg();
    render(<ChatMessageRow msg={msg} isHost />);

    expect(screen.getByText("Host")).toBeInTheDocument();
  });

  it("does not show Host badge when isHost is false/undefined", () => {
    const msg = makeMsg();
    render(<ChatMessageRow msg={msg} />);

    expect(screen.queryByText("Host")).not.toBeInTheDocument();
  });

  it("renders avatar initials using up to first 2 name parts", () => {
    const msg = makeMsg({ senderName: "john   doe smith" });
    const { container } = render(<ChatMessageRow msg={msg} />);

    // Avatar is the emerald circle; easiest is to assert initials text is present somewhere
    expect(screen.getByText("JD")).toBeInTheDocument();

    // (Optional) sanity check the avatar container exists
    expect(container.querySelector(".bg-emerald-600")).toBeTruthy();
  });

  it("renders avatar initials for single-word name", () => {
    const msg = makeMsg({ senderName: "alice" });
    render(<ChatMessageRow msg={msg} />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders '?' avatar for empty/whitespace name", () => {
    const msg = makeMsg({ senderName: "   " });
    render(<ChatMessageRow msg={msg} />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
