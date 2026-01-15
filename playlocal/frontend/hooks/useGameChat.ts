/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import type { ChatInbound, ChatMessage, ChatUser } from "@/lib/chat/types";

function safeText(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeInbound(gameId: string, raw: ChatInbound): ChatMessage | null {
  // Prefer server-provided message id; fall back to raw.id; last resort random
  const id =
    safeText((raw as any).messageId) ||
    safeText((raw as any).id) ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()));

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
      createdAt = Number.isFinite(n) ? new Date(n).toISOString() : new Date(ts).toISOString();
    } else {
      createdAt = new Date().toISOString();
    }
  }

  const msg: ChatMessage = {
    id,
    gameId,
    senderId: senderId || "unknown",
    senderName,
    content,
    createdAt,
  };

  // carry optional client message id if server echoes it (no harm if absent)
  (msg as any).clientMessageId = safeText((raw as any).clientMessageId);

  return msg;
}

type UseGameChatArgs = {
  gameId: string;
  me: ChatUser;
  enabled?: boolean;
  historyBaseUrl?: string; // optional override
};

export function useGameChat({ gameId, me, enabled = true, historyBaseUrl }: UseGameChatArgs) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const connectedRef = useRef(false);

  // Prevent duplicate inbound frames (same logical message) from showing twice
  // key: senderId|content|createdAt  (expires after a short TTL)
  const seenInboundRef = useRef<Map<string, number>>(new Map());

  function markSeen(key: string) {
    const now = Date.now();
    const m = seenInboundRef.current;
    m.set(key, now);

    // simple cleanup to avoid unbounded growth
    if (m.size > 300) {
      for (const [k, t] of m.entries()) {
        if (now - t > 30_000) m.delete(k);
      }
    }
  }

  function seenRecently(key: string, ttlMs = 5_000) {
    const now = Date.now();
    const t = seenInboundRef.current.get(key);
    return typeof t === "number" && now - t < ttlMs;
  }

  function sortByTime(list: ChatMessage[]) {
    return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Try to reconcile an optimistic tmp-* message with the real inbound message.
  // Matching strategy:
  // 1) If server echoes clientMessageId and we stored it, match by that
  // 2) Otherwise match by same senderId + same content + createdAt within ±2s
  // Replace your reconcileOptimistic with this version
function reconcileOptimistic(
  prev: ChatMessage[],
  incoming: ChatMessage,
  myUserId: string
): ChatMessage[] {
  const incomingClientId = safeText((incoming as any).clientMessageId);
  const incomingTime = new Date(incoming.createdAt).getTime();

  // Find candidate tmp messages
  const tmpIndexes = prev
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => typeof m.id === "string" && m.id.startsWith("tmp-"));

  // 1) Best case: backend echoed clientMessageId
  if (incomingClientId) {
    const idx = tmpIndexes.find(({ m }) => safeText((m as any).clientMessageId) === incomingClientId)?.i;
    if (idx != null) {
      const next = prev.slice();
      next[idx] = incoming;
      return next;
    }
  }

  // 2) If it's MY message: replace the most recent tmp with same content
  if (incoming.senderId === myUserId) {
    const candidates = tmpIndexes
      .filter(({ m }) => m.senderId === incoming.senderId && m.content === incoming.content)
      .sort((a, b) => new Date(b.m.createdAt).getTime() - new Date(a.m.createdAt).getTime());

    if (candidates.length) {
      const idx = candidates[0].i;
      const next = prev.slice();
      next[idx] = incoming;
      return next;
    }
  }

  // 3) Fallback: same sender+content within a bigger time window (30s)
  const idx = tmpIndexes.find(({ m }) => {
    if (m.senderId !== incoming.senderId) return false;
    if (m.content !== incoming.content) return false;
    const t = new Date(m.createdAt).getTime();
    return Math.abs(t - incomingTime) <= 30_000;
  })?.i;

  if (idx == null) return prev;

  const next = prev.slice();
  next[idx] = incoming;
  return next;
}

  // Runtime-safe WS base:
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
    const env = historyBaseUrl || process.env.NEXT_PUBLIC_CHAT_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
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

      const sorted = sortByTime(normalized);

      // mark history as "seen" so if server replays them on subscribe, we don't duplicate
      for (const m of sorted) {
        const key = `${m.senderId}|${m.content}|${m.createdAt}`;
        markSeen(key);
      }

      setMessages(sorted);
    } catch {
      // ignore history failures
    }
  }

  useEffect(() => {
    if (!enabled || !gameId) return;

    setError(null);
    setConnected(false);
    connectedRef.current = false;
    setMessages([]);
    seenInboundRef.current.clear();

    loadHistory();

    const client = new Client({
      webSocketFactory: () => new SockJS(wsEndpoint),
      reconnectDelay: 3000,
      debug: () => {},
      onConnect: () => {
        setConnected(true);
        connectedRef.current = true;
        setError(null);

        const sub = client.subscribe(`/topic/game/${gameId}`, (frame) => {
          try {
            const parsed = JSON.parse(frame.body);
            const msg = normalizeInbound(gameId, parsed);
            if (!msg) return;

            const key = `${msg.senderId}|${msg.content}|${msg.createdAt}`;

          setMessages((prev) => {
            if (prev.some((p) => p.id === msg.id)) return prev;

            const reconciled = reconcileOptimistic(prev, msg, me.id);
            if (reconciled !== prev) {
              markSeen(key);
              return sortByTime(reconciled);
            }

            if (seenRecently(key)) return prev;

            markSeen(key);
            return sortByTime([...prev, msg]);
          });

          } catch {
            // ignore bad frames
          }
        });

        // Ensure unsubscribe on disconnect/cleanup
        (client as any).__gameSub = sub;
      },
      onWebSocketError: () => {
        setConnected(false);
        connectedRef.current = false;
        setError("WebSocket connection failed.");
      },
      onStompError: () => {
        setConnected(false);
        connectedRef.current = false;
        setError("WebSocket/STOMP error.");
      },
      onDisconnect: () => {
        setConnected(false);
        connectedRef.current = false;
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        const sub = (client as any).__gameSub;
        if (sub && typeof sub.unsubscribe === "function") sub.unsubscribe();
      } catch {}

      try {
        client.deactivate();
      } catch {}

      clientRef.current = null;
      setConnected(false);
      connectedRef.current = false;
    };
  }, [enabled, gameId, wsEndpoint]);

  function sendMessage(content: string) {
    const text = content.trim();
    if (!text) return;

    const now = new Date().toISOString();

    // clientMessageId lets us reconcile optimistic with inbound if backend echoes it back
    const clientMessageId =
      typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

    const tempId = `tmp-${clientMessageId}`;

    const optimistic: ChatMessage = {
      id: tempId,
      gameId,
      senderId: me.id,
      senderName: me.name,
      content: text,
      createdAt: now,
    };
    (optimistic as any).clientMessageId = clientMessageId;

    setMessages((prev) => sortByTime([...prev, optimistic]));

    const client = clientRef.current;
    if (!client || !connectedRef.current) {
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
        clientMessageId, // harmless if backend ignores; ideal if backend echoes it
      }),
    });
  }

  return { connected, messages, error, sendMessage };
}
