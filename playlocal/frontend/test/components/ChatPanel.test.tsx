// __tests__/components/chat/ChatPanel.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatPanel } from "@/components/chat/ChatPanel";

// --------------------
// Global polyfills (JSDOM fixes)
// --------------------
beforeAll(() => {
  // JSDOM often lacks scrollTo on elements
  if (!HTMLElement.prototype.scrollTo) {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      value: function scrollTo() {},
      writable: true,
    });
  }

  // requestAnimationFrame is used in onSend()
  if (!(global as any).requestAnimationFrame) {
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
  }
  if (!(global as any).cancelAnimationFrame) {
    (global as any).cancelAnimationFrame = () => {};
  }
});

beforeEach(() => {
  // Keep scrollTo as a mock per-test so we can assert calls when needed
  (HTMLElement.prototype.scrollTo as any) = jest.fn();
});

// ---- mocks ----
const mockUseGameChat = jest.fn();
jest.mock("@/hooks/useGameChat", () => ({
  useGameChat: (args: any) => mockUseGameChat(args),
}));

const mockDayKey = jest.fn();
const mockFormatFullDate = jest.fn();
jest.mock("@/lib/chat/time", () => ({
  dayKey: (...args: any[]) => mockDayKey(...args),
  formatFullDate: (...args: any[]) => mockFormatFullDate(...args),
}));

jest.mock("@/components/chat/ChatMessageRow", () => ({
  ChatMessageRow: ({ msg, isHost }: any) => (
    <div data-testid="chat-row" data-id={msg.id} data-host={String(isHost)}>
      row:{msg.id}
    </div>
  ),
}));

function makeMsg(id: string, senderId: string, createdAt: string, text = "hello") {
  return { id, senderId, createdAt, text };
}

describe("ChatPanel", () => {
  beforeEach(() => {
    mockUseGameChat.mockReset();
    mockDayKey.mockReset();
    mockFormatFullDate.mockReset();

    mockFormatFullDate.mockImplementation(
      (d: Date) => `FULL:${d.toISOString().slice(0, 10)}`
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders access warning when canChat=false and does NOT render chat UI", () => {
    mockUseGameChat.mockReturnValue({
      connected: false,
      messages: [],
      error: null,
      sendMessage: jest.fn(),
    });

    render(
      <ChatPanel
        gameId="g1"
        me={{ userId: "me", displayName: "Me" } as any}
        hostUserId="host"
        canChat={false}
      />
    );

    expect(
      screen.getByText("Only the organizer and confirmed participants can use chat.")
    ).toBeInTheDocument();

    expect(screen.queryByPlaceholderText("Type your message...")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
  });

  it("shows connecting banner when not connected, and live banner when connected", () => {
    mockUseGameChat.mockReturnValueOnce({
      connected: false,
      messages: [],
      error: null,
      sendMessage: jest.fn(),
    });

    const { rerender } = render(
      <ChatPanel
        gameId="g1"
        me={{ userId: "me", displayName: "Me" } as any}
        hostUserId="host"
        canChat={true}
      />
    );

    expect(screen.getByText(/Connecting to chat\.\.\./)).toBeInTheDocument();

    mockUseGameChat.mockReturnValueOnce({
      connected: true,
      messages: [],
      error: null,
      sendMessage: jest.fn(),
    });

    rerender(
      <ChatPanel
        gameId="g1"
        me={{ userId: "me", displayName: "Me" } as any}
        hostUserId="host"
        canChat={true}
      />
    );

    expect(screen.getByText(/Chat is live\./)).toBeInTheDocument();
  });

  it("renders error banner when error exists", () => {
    mockUseGameChat.mockReturnValue({
      connected: true,
      messages: [],
      error: "boom",
      sendMessage: jest.fn(),
    });

    render(
      <ChatPanel
        gameId="g1"
        me={{ userId: "me", displayName: "Me" } as any}
        canChat={true}
      />
    );

    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("groups messages by dayKey and renders day separators + ChatMessageRow items", () => {
    const msgs = [
      makeMsg("m1", "host", "2026-02-09T10:00:00.000Z"),
      makeMsg("m2", "me", "2026-02-09T12:00:00.000Z"),
      makeMsg("m3", "me", "2026-02-10T09:00:00.000Z"),
    ];

    mockDayKey.mockImplementation((iso: string) =>
      iso.startsWith("2026-02-09") ? "2026-02-09" : "2026-02-10"
    );

    mockUseGameChat.mockReturnValue({
      connected: true,
      messages: msgs,
      error: null,
      sendMessage: jest.fn(),
    });

    render(
      <ChatPanel
        gameId="g1"
        me={{ userId: "me", displayName: "Me" } as any}
        hostUserId="host"
        canChat={true}
      />
    );

    expect(screen.getByText("FULL:2026-02-09")).toBeInTheDocument();
    expect(screen.getByText("FULL:2026-02-10")).toBeInTheDocument();

    const rows = screen.getAllByTestId("chat-row");
    expect(rows).toHaveLength(3);

    const r1 = screen.getByText("row:m1").closest('[data-testid="chat-row"]') as HTMLElement;
    const r2 = screen.getByText("row:m2").closest('[data-testid="chat-row"]') as HTMLElement;
    const r3 = screen.getByText("row:m3").closest('[data-testid="chat-row"]') as HTMLElement;

    expect(r1).toHaveAttribute("data-host", "true");
    expect(r2).toHaveAttribute("data-host", "false");
    expect(r3).toHaveAttribute("data-host", "false");

    expect(mockDayKey).toHaveBeenCalledTimes(3);
  });

  it("sends message on Send click, clears draft, and ignores blank/whitespace-only", () => {
    const sendMessage = jest.fn();
    mockDayKey.mockImplementation(() => "2026-02-09");

    mockUseGameChat.mockReturnValue({
      connected: true,
      messages: [],
      error: null,
      sendMessage,
    });

    render(
      <ChatPanel
        gameId="g1"
        me={{ userId: "me", displayName: "Me" } as any}
        canChat={true}
      />
    );

    const input = screen.getByPlaceholderText("Type your message...") as HTMLInputElement;
    const sendBtn = screen.getByRole("button", { name: "Send" });

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(sendBtn);
    expect(sendMessage).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "hello world" } });
    fireEvent.click(sendBtn);

    expect(sendMessage).toHaveBeenCalledWith("hello world");
    expect(input.value).toBe("");
  });

  it("sends message on Enter key", () => {
    const sendMessage = jest.fn();
    mockDayKey.mockImplementation(() => "2026-02-09");

    mockUseGameChat.mockReturnValue({
      connected: true,
      messages: [],
      error: null,
      sendMessage,
    });

    render(
      <ChatPanel
        gameId="g1"
        me={{ userId: "me", displayName: "Me" } as any}
        canChat={true}
      />
    );

    const input = screen.getByPlaceholderText("Type your message...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "ping" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(sendMessage).toHaveBeenCalledWith("ping");
    expect(input.value).toBe("");
  });

  it("shows Jump to latest when scrolled away from bottom and hides after click; calls scrollTo with smooth behavior", () => {
    mockDayKey.mockImplementation(() => "2026-02-09");

    mockUseGameChat.mockReturnValue({
      connected: true,
      messages: [makeMsg("m1", "a", "2026-02-09T10:00:00.000Z")],
      error: null,
      sendMessage: jest.fn(),
    });

    const { container } = render(
      <ChatPanel
        gameId="g1"
        me={{ userId: "me", displayName: "Me" } as any}
        canChat={true}
      />
    );

    const scroller = container.querySelector(
      "div.overflow-y-auto.overflow-x-hidden.pr-2"
    ) as HTMLDivElement;
    expect(scroller).toBeTruthy();

    // Make it "far from bottom"
    Object.defineProperty(scroller, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(scroller, "scrollTop", { value: 0, writable: true, configurable: true });

    const scrollSpy = jest.spyOn(scroller, "scrollTo");

    fireEvent.scroll(scroller);
    expect(screen.getByRole("button", { name: "Jump to latest" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Jump to latest" }));

    // Smooth scroll to bottom
    expect(scrollSpy).toHaveBeenCalledWith({ top: 1000, behavior: "smooth" });

    expect(screen.queryByRole("button", { name: "Jump to latest" })).not.toBeInTheDocument();
  });

  it("calls useGameChat with enabled=canChat and passes gameId + me", () => {
    mockUseGameChat.mockReturnValue({
      connected: true,
      messages: [],
      error: null,
      sendMessage: jest.fn(),
    });

    const me = { userId: "me", displayName: "Me" } as any;
    render(<ChatPanel gameId="game-123" me={me} canChat={true} />);

    expect(mockUseGameChat).toHaveBeenCalledWith({
      gameId: "game-123",
      me,
      enabled: true,
    });
  });
});
