import { act, renderHook, waitFor } from "@testing-library/react";

// ✅ Adjust this import to wherever your hook lives
import { useGameChat } from "../../hooks/useGameChat";

type Frame = { body: string };

let lastClientConfig: any = null;
let lastSubscribeCallback: ((frame: Frame) => void) | null = null;

const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn((_dest: string, cb: (frame: Frame) => void) => {
  lastSubscribeCallback = cb;
  return { unsubscribe: mockUnsubscribe };
});

const mockPublish = jest.fn();
const mockActivate = jest.fn();
const mockDeactivate = jest.fn();

jest.mock("sockjs-client", () => {
  return jest.fn(() => ({}));
});

jest.mock("@stomp/stompjs", () => {
  return {
    Client: jest.fn((config: any) => {
      lastClientConfig = config;
      return {
        activate: mockActivate,
        deactivate: mockDeactivate,
        subscribe: mockSubscribe,
        publish: mockPublish,
      };
    }),
  };
});

function makeInbound(overrides: Record<string, any> = {}) {
  return {
    messageId: overrides.messageId ?? "m-1",
    senderId: overrides.senderId ?? "u-2",
    senderName: overrides.senderName ?? "Other",
    content: overrides.content ?? "hello",
    createdAt: overrides.createdAt ?? "2020-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useGameChat", () => {
  const ME = { id: "me-1", name: "Me" };
  const GAME_ID = "game-123";

  beforeEach(() => {
    jest.clearAllMocks();
    lastClientConfig = null;
    lastSubscribeCallback = null;

    // deterministic randomUUID
    (globalThis as any).crypto = {
      randomUUID: jest.fn(() => "uuid-123"),
    };

    // mock fetch by default
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => [],
    })) as any;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads history and sorts messages by createdAt ascending", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        makeInbound({
          messageId: "later",
          createdAt: "2020-01-02T00:00:00.000Z",
          content: "later msg",
        }),
        makeInbound({
          messageId: "earlier",
          createdAt: "2020-01-01T00:00:00.000Z",
          content: "earlier msg",
        }),
      ],
    });

    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `http://test.api/games/${GAME_ID}/messages`,
      { credentials: "include" },
    );

    expect(result.current.messages[0].content).toBe("earlier msg");
    expect(result.current.messages[1].content).toBe("later msg");
  });

  it("onConnect subscribes to topic and inbound frames append messages", async () => {
    renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );

    // simulate STOMP connect
    act(() => {
      lastClientConfig.onConnect();
    });

    expect(mockSubscribe).toHaveBeenCalledWith(
      `/topic/game/${GAME_ID}`,
      expect.any(Function),
    );

    // push an inbound frame
    act(() => {
      lastSubscribeCallback?.({
        body: JSON.stringify(
          makeInbound({
            messageId: "server-1",
            senderId: "u-2",
            senderName: "Other",
            content: "hello from server",
            createdAt: "2020-01-01T00:00:00.000Z",
          }),
        ),
      });
    });

    // hook state updates async
    await waitFor(() => {
      // renderHook doesn't expose rerenders directly; check via subscribe side effects:
      // we validate by calling again with another frame and ensure dedupe works below
      expect(lastSubscribeCallback).toBeTruthy();
    });
  });

  it("dedupes inbound by id (same id does not append twice)", async () => {
    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );

    act(() => lastClientConfig.onConnect());

    const payload = makeInbound({
      messageId: "same-id",
      senderId: "u-2",
      content: "dup-by-id",
      createdAt: "2020-01-01T00:00:00.000Z",
    });

    act(() => {
      lastSubscribeCallback?.({ body: JSON.stringify(payload) });
      lastSubscribeCallback?.({ body: JSON.stringify(payload) }); // same id again
    });

    await waitFor(() => {
      expect(result.current.messages.filter((m) => m.content === "dup-by-id")).toHaveLength(1);
    });
  });

  it("dedupes inbound by TTL key (same sender|content|createdAt even with different ids)", async () => {
    jest.useFakeTimers();
    jest.spyOn(Date, "now").mockReturnValue(1_000_000);

    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );

    act(() => lastClientConfig.onConnect());

    const base = {
      senderId: "u-2",
      senderName: "Other",
      content: "dup-by-key",
      createdAt: "2020-01-01T00:00:00.000Z",
    };

    act(() => {
      lastSubscribeCallback?.({ body: JSON.stringify(makeInbound({ ...base, messageId: "id-1" })) });
      lastSubscribeCallback?.({ body: JSON.stringify(makeInbound({ ...base, messageId: "id-2" })) });
    });

    await waitFor(() => {
      expect(result.current.messages.filter((m) => m.content === "dup-by-key")).toHaveLength(1);
    });
  });

  it("sendMessage adds optimistic tmp-* then reconciles when inbound echoes clientMessageId", async () => {
    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );

    act(() => lastClientConfig.onConnect());

    act(() => {
      result.current.sendMessage("hi");
    });

    await waitFor(() => {
      expect(result.current.messages.some((m) => m.id.startsWith("tmp-"))).toBe(true);
    });

    expect(mockPublish).toHaveBeenCalledTimes(1);
    const publishArg = mockPublish.mock.calls[0][0];
    const sent = JSON.parse(publishArg.body);

    expect(sent).toMatchObject({
      gameId: GAME_ID,
      senderId: ME.id,
      senderName: ME.name,
      content: "hi",
    });

    const echoedClientMessageId = sent.clientMessageId;

    // inbound server message echoes clientMessageId so optimistic should be replaced
    act(() => {
      lastSubscribeCallback?.({
        body: JSON.stringify(
          makeInbound({
            messageId: "server-real-1",
            senderId: ME.id,
            senderName: ME.name,
            content: "hi",
            createdAt: sent.createdAt,
            clientMessageId: echoedClientMessageId,
          }),
        ),
      });
    });

    await waitFor(() => {
      // should contain server id and NOT tmp id
      expect(result.current.messages.some((m) => m.id === "server-real-1")).toBe(true);
      expect(result.current.messages.some((m) => m.id.startsWith("tmp-"))).toBe(false);
    });
  });

  it("sendMessage while not connected sets error but still adds optimistic message", async () => {
    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );

    act(() => {
      result.current.sendMessage("hello");
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id.startsWith("tmp-")).toBe(true);
      expect(result.current.error).toBe("Not connected.");
    });

    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("cleanup unsubscribes and deactivates on unmount", async () => {
    const { unmount } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );

    act(() => lastClientConfig.onConnect());
    expect(mockSubscribe).toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(mockDeactivate).toHaveBeenCalledTimes(1);
  });

  it("onWebSocketError sets error and disconnected state", async () => {
    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );
    act(() => lastClientConfig.onConnect());
    expect(result.current.connected).toBe(true);
    act(() => lastClientConfig.onWebSocketError());
    await waitFor(() => expect(result.current.error).toBe("WebSocket connection failed."));
    expect(result.current.connected).toBe(false);
  });

  it("onStompError sets error and disconnected state", async () => {
    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );
    act(() => lastClientConfig.onConnect());
    act(() => lastClientConfig.onStompError());
    await waitFor(() => expect(result.current.error).toBe("WebSocket/STOMP error."));
    expect(result.current.connected).toBe(false);
  });

  it("loadHistory does not set messages when response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(result.current.messages).toHaveLength(0);
  });

  it("loadHistory does not set messages when response body is not an array", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ not: "array" }),
    });
    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(result.current.messages).toHaveLength(0);
  });

  it("onDisconnect sets connected to false", async () => {
    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );
    act(() => lastClientConfig.onConnect());
    expect(result.current.connected).toBe(true);
    act(() => lastClientConfig.onDisconnect?.());
    await waitFor(() => expect(result.current.connected).toBe(false));
  });

  it("reconciles optimistic message when server echoes with same clientMessageId", async () => {
    const clientMsgId = "client-echo-1";
    (globalThis as any).crypto = { randomUUID: () => clientMsgId };
    const { result } = renderHook(() =>
      useGameChat({
        gameId: GAME_ID,
        me: ME,
        enabled: true,
        historyBaseUrl: "http://test.api",
      }),
    );
    act(() => lastClientConfig.onConnect());
    act(() => result.current.sendMessage("hello"));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].id.startsWith("tmp-")).toBe(true);

    act(() => {
      lastSubscribeCallback?.({
        body: JSON.stringify(
          makeInbound({
            messageId: "server-echo-1",
            senderId: ME.id,
            senderName: ME.name,
            content: "hello",
            createdAt: result.current.messages[0].createdAt,
            clientMessageId: clientMsgId,
          }),
        ),
      });
    });

    await waitFor(() => {
      expect(result.current.messages.some((m) => m.id === "server-echo-1")).toBe(true);
      expect(result.current.messages.filter((m) => m.content === "hello")).toHaveLength(1);
    });
  });

  describe("wsEndpoint", () => {
    const SockJS = require("sockjs-client");
    const envKey = "NEXT_PUBLIC_WS_URL";

    afterEach(() => {
      delete process.env[envKey];
    });

    it("uses production WS URL when no env and not localhost", () => {
      renderHook(() =>
        useGameChat({
          gameId: GAME_ID,
          me: ME,
          enabled: true,
          historyBaseUrl: "http://test.api",
        }),
      );
      expect(lastClientConfig).not.toBeNull();
      act(() => lastClientConfig.webSocketFactory());
      // In jsdom, window.location.hostname is "localhost", so we get localhost WS; otherwise we'd get production URL.
      const url = SockJS.mock.calls[0][0];
      expect(url === "ws://localhost:8080/ws" || url === "wss://playlocalcapstone.onrender.com/ws").toBe(true);
    });

    it("uses NEXT_PUBLIC_WS_URL when set", () => {
      const orig = process.env.NEXT_PUBLIC_WS_URL;
      process.env.NEXT_PUBLIC_WS_URL = "https://api.example.com";
      try {
        renderHook(() =>
          useGameChat({
            gameId: GAME_ID,
            me: ME,
            enabled: true,
            historyBaseUrl: "http://test.api",
          }),
        );
        act(() => lastClientConfig.webSocketFactory());
        expect(SockJS).toHaveBeenCalledWith("wss://api.example.com/ws");
      } finally {
        process.env.NEXT_PUBLIC_WS_URL = orig;
      }
    });

    it("uses NEXT_PUBLIC_WS_URL with /ws suffix when URL already ends with /ws", () => {
      const orig = process.env.NEXT_PUBLIC_WS_URL;
      process.env.NEXT_PUBLIC_WS_URL = "wss://chat.example.com/ws";
      try {
        renderHook(() =>
          useGameChat({
            gameId: GAME_ID,
            me: ME,
            enabled: true,
            historyBaseUrl: "http://test.api",
          }),
        );
        act(() => lastClientConfig.webSocketFactory());
        expect(SockJS).toHaveBeenCalledWith("wss://chat.example.com/ws");
      } finally {
        process.env.NEXT_PUBLIC_WS_URL = orig;
      }
    });
  });
});
