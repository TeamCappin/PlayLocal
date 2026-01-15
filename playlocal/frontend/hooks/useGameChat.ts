"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, type IMessage } from "@stomp/stompjs";
import type { ChatInbound, ChatMessage, ChatUser } from "@/lib/chat/types";

function safeText(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeInbound(gameId: string, raw: ChatInbound): ChatMessage | null {
  const id = safeText((raw as any).id) || crypto.randomUUID();

  const senderId =
    safeText((raw as any).senderId) ||
    safeText((raw as any).userId) ||
    safeText((raw as any).sender);

  const senderName =
    safeText((raw as any).senderName) ||
    safeText((raw as any).fullName) ||
    safeText((raw as any).username) ||
    senderId ||
    "Unknown";

  const content =
    safeText((raw as any).content) ||
    safeText((raw as any).messageText) ||
    safeText((raw as any).text);

  if (!content.trim()) return null;

  let createdAt = safeText((raw as any).createdAt);
  if (!createdAt) {
    const ts = (raw as any).timestamp;
    if (typeof ts === "number") createdAt = new Date(ts).toISOString();
    else if (typeof ts === "string") {
      const n = Number(ts);
      createdAt = Number.isFinite(n)
        ? new Date(n).toISOString()
        : new Date(ts).toISOString();
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

  // REST base for history:
  // - set NEXT_PUBLIC_CHAT_API_BASE=http://localhost:8080/api/v1 (or http://backend:8080/api/v1 in docker)
  historyBaseUrl?: string;

  // WS base:
  // - set NEXT_PUBLIC_WS_URL=http://localhost:8080 (or http://backend:8080 in docker)
  wsBaseUrl?: string;
};

export function useGameChat({
  gameId,
  me,
  enabled = true,
  historyBaseUrl,
  wsBaseUrl,
}: UseGameChatArgs) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);

  const wsEndpoint = useMemo(() => {
    const raw =
      (wsBaseUrl || process.env.NEXT_PUBLIC_WS_URL || "").trim() ||
      "http://localhost:8080";
    return raw.endsWith("/ws") ? raw : `${raw}/ws`;
  }, [wsBaseUrl]);

  const historyBase = useMemo(() => {
    return (
      (historyBaseUrl || "").trim() ||
      (process.env.NEXT_PUBLIC_CHAT_API_BASE || "").trim() ||
      (process.env.NEXT_PUBLIC_API_URL || "").trim() ||
      ""
    );
  }, [historyBaseUrl]);

  async function loadHistory() {
    try {
      const url = historyBase
        ? `${historyBase}/games/${gameId}/messages`
        : `/games/${gameId}/messages`;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data)) return;

      const normalized: ChatMessage[] = data
        .map((x: any) => normalizeInbound(gameId, x))
        .filter(Boolean) as ChatMessage[];

      normalized.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMessages(normalized);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!enabled || !gameId) return;
    if (typeof window === "undefined") return;

    setError(null);
    setConnected(false);
    setMessages([]);

    let mounted = true;

    loadHistory();

    // stop previous client if any
    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch {}
      clientRef.current = null;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(wsEndpoint),
      reconnectDelay: 3000,
      debug: () => {},

      onConnect: () => {
        if (!mounted) return;
        setConnected(true);
        setError(null);

        client.subscribe(`/topic/game/${gameId}`, (frame: IMessage) => {
          try {
            const parsed = JSON.parse(frame.body);
            const msg = normalizeInbound(gameId, parsed);
            if (!msg) return;

            setMessages((prev) => {
              if (prev.some((p) => p.id === msg.id)) return prev;
              const next = [...prev, msg];
              next.sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              );
              return next;
            });
          } catch {
            // ignore bad frames
          }
        });
      },

      onDisconnect: () => {
        if (!mounted) return;
        setConnected(false);
      },

      onStompError: () => {
        if (!mounted) return;
        setError("WebSocket/STOMP error.");
        setConnected(false);
      },

      onWebSocketError: () => {
        if (!mounted) return;
        setError("WebSocket connection failed.");
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      mounted = false;
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
    const tempId = `tmp-${crypto.randomUUID()}`;

    // optimistic UI
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        gameId,
        senderId: me.id,
        senderName: me.name,
        content: text,
        createdAt: now,
      },
    ]);

    const client = clientRef.current;
    if (!client || !client.connected) {
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
