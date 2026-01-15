"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import type { ChatInbound, ChatMessage, ChatUser } from "@/lib/chat/types";

function safeText(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeInbound(gameId: string, raw: ChatInbound): ChatMessage | null {
  const id = safeText((raw as any).id) || (typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()));

  const senderId =
    safeText((raw as any).senderId) || safeText((raw as any).userId) || safeText((raw as any).sender);

  const senderName =
    safeText((raw as any).senderName) ||
    safeText((raw as any).fullName) ||
    safeText((raw as any).username) ||
    senderId ||
    "Unknown";

  const content =
    safeText((raw as any).content) || safeText((raw as any).messageText) || safeText((raw as any).text);

  if (!content.trim()) return null;

  let createdAt = safeText((raw as any).createdAt);
  if (!createdAt) {
    const ts = (raw as any).timestamp;
    if (typeof ts === "number") createdAt = new Date(ts).toISOString();
    else if (typeof ts === "string") {
      const n = Number(ts);
      createdAt = Number.isFinite(n) ? new Date(n).toISOString() : new Date(ts).toISOString();
    } else {
      createdAt = new Date().toISOString();
    }
  }

  return {
    id,
    gameId,
    senderId: senderId || "unknown",
    senderName,
    content,
    createdAt,
  };
}

type UseGameChatArgs = {
  gameId: string;
  me: ChatUser;
  enabled?: boolean;
  historyBaseUrl?: string; // optional override
};

export function useGameChat({
  gameId,
  me,
  enabled = true,
  historyBaseUrl,
}: UseGameChatArgs) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);

  // Runtime-safe WS base:
  // - Uses NEXT_PUBLIC_WS_URL if present (works locally)
  // - Otherwise falls back to "same host but port 8080" (works in Docker too)
  const wsEndpoint = useMemo(() => {
    const env = process.env.NEXT_PUBLIC_WS_URL || "";
    if (env) return env.endsWith("/ws") ? env : `${env}/ws`;

    if (typeof window === "undefined") return "/ws";

    const url = new URL(window.location.href);
    url.port = "8080";
    url.pathname = "/ws";
    url.search = "";
    url.hash = "";
    return url.toString();
  }, []);

  // Runtime-safe API base for history
  const historyBase = useMemo(() => {
    const env =
      historyBaseUrl ||
      process.env.NEXT_PUBLIC_CHAT_API_BASE ||
      process.env.NEXT_PUBLIC_API_URL ||
      "";

    if (env) return env;

    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.port = "8080";
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  }, [historyBaseUrl]);

  async function loadHistory() {
    try {
      const url = `${historyBase}/games/${gameId}/messages`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data)) return;

      const normalized: ChatMessage[] = data
        .map((x: any) => normalizeInbound(gameId, x))
        .filter(Boolean) as ChatMessage[];

      normalized.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMessages(normalized);
    } catch {
      // ignore history failures
    }
  }

  useEffect(() => {
    if (!enabled || !gameId) return;

    setError(null);
    setConnected(false);
    setMessages([]);

    loadHistory();

    const client = new Client({
      webSocketFactory: () => new SockJS(wsEndpoint),
      reconnectDelay: 3000,
      debug: () => {}, // silence logs
      onConnect: () => {
        setConnected(true);
        setError(null);

        client.subscribe(`/topic/game/${gameId}`, (frame) => {
          try {
            const parsed = JSON.parse(frame.body);
            const msg = normalizeInbound(gameId, parsed);
            if (!msg) return;

            setMessages((prev) => {
              if (prev.some((p) => p.id === msg.id)) return prev;
              const next = [...prev, msg];
              next.sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
              return next;
            });
          } catch {
            // ignore bad frames
          }
        });
      },
      onWebSocketError: () => {
        setConnected(false);
        setError("WebSocket connection failed.");
      },
      onStompError: () => {
        setConnected(false);
        setError("WebSocket/STOMP error.");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        client.deactivate();
      } catch {}
      clientRef.current = null;
      setConnected(false);
    };
  }, [enabled, gameId, wsEndpoint]);

  function sendMessage(content: string) {
    const text = content.trim();
    if (!text) return;

    const now = new Date().toISOString();
    const tempId = `tmp-${typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now())}`;

    const optimistic: ChatMessage = {
      id: tempId,
      gameId,
      senderId: me.id,
      senderName: me.name,
      content: text,
      createdAt: now,
    };

    setMessages((prev) => [...prev, optimistic]);

    const client = clientRef.current;
    if (!client || !connected) {
      setError("Not connected.");
      return;
    }

    client.publish({
      destination: "/app/game.send",
      body: JSON.stringify({
        gameId,
        senderId: me.id,
        senderName: me.name,
        content: text,
        createdAt: now,
      }),
    });
  }

  return { connected, messages, error, sendMessage };
}
