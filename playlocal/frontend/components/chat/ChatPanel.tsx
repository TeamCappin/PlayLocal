/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatUser } from "@/lib/chat/types";
import { dayKey, formatFullDate } from "@/lib/chat/time";
import { useGameChat } from "@/hooks/useGameChat";
import { ChatMessageRow } from "./ChatMessageRow";

export function ChatPanel({
  gameId,
  me,
  hostUserId,
  canChat,
}: {
  gameId: string;
  me: ChatUser;
  hostUserId?: string;
  canChat: boolean;
}) {
  const { connected, messages, error, sendMessage } = useGameChat({
    gameId,
    me,
    enabled: canChat,
  });

  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showJump, setShowJump] = useState(false);

  function scrollToBottom(smooth = true) {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  function onListScroll() {
    const el = listRef.current;
    if (!el) return;

    const threshold = 80;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom <= threshold;

    setIsNearBottom(near);
    setShowJump(!near);
  }

  useEffect(() => {
    if (!listRef.current) return;
    if (isNearBottom) scrollToBottom(false);
    setShowJump(!isNearBottom);
  }, [messages.length, isNearBottom]);

  const grouped = useMemo(() => {
    const out: Array<
      | { type: "day"; key: string; label: string }
      | { type: "msg"; id: string; senderId: string; isHost: boolean; any: any }
    > = [];

    let lastDay: string | null = null;
    for (const m of messages) {
      const dk = dayKey(m.createdAt);
      if (dk !== lastDay) {
        lastDay = dk;
        const d = new Date(m.createdAt);
        out.push({ type: "day", key: dk, label: formatFullDate(d) });
      }
      out.push({
        type: "msg",
        id: m.id,
        senderId: m.senderId,
        isHost: !!hostUserId && m.senderId === hostUserId,
        any: m,
      });
    }
    return out;
  }, [messages, hostUserId]);

  function onSend() {
    const text = draft.trim();
    if (!text) return;

    sendMessage(text);
    setDraft("");

    setIsNearBottom(true);
    setShowJump(false);
    requestAnimationFrame(() => scrollToBottom(false));
  }

  if (!canChat) {
    return (
      <div className="w-full">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          Only the organizer and confirmed participants can use chat.
        </div>
      </div>
    );
  }

  return (
    // KEY: force ChatPanel itself to be a vertical flex container
    // and give it a predictable height so input can sit at the bottom.
    <div
      className="w-full min-w-0"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* Chat "card" area */}
      <div
        className="w-full min-w-0 rounded-lg"
        style={{
          display: "flex",
          flexDirection: "column",
          // This is the IMPORTANT part:
          // It limits the chat area height so the page doesn't grow infinitely.
          // Adjust if you want bigger/smaller.
          height: 520,
          minHeight: 520,
        }}
      >
        {/* Banner (never scrolls) */}
        <div className="shrink-0 w-full p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          {connected ? "Chat is live." : "Connecting to chat..."} Messages are
          visible only to this game room.
        </div>

        {error && (
          <div className="shrink-0 w-full mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Messages + Input wrapper */}
        <div
          className="mt-4 w-full min-w-0"
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0, // CRITICAL for scroll to work inside flex
          }}
        >
          {/* Message list (THIS scrolls) */}
          <div className="relative w-full min-w-0" style={{ flex: 1, minHeight: 0 }}>
            <div
              ref={listRef}
              onScroll={onListScroll}
              className="w-full overflow-y-auto overflow-x-hidden pr-2"
              style={{
                height: "100%",
                minHeight: 0,
                overscrollBehavior: "contain",
              }}
            >
              <div className="space-y-4">
                {grouped.map((item) => {
                  if (item.type === "day") {
                    return (
                      <div
                        key={`day-${item.key}`}
                        className="flex items-center gap-3 my-2"
                      >
                        <div className="flex-1 h-px bg-gray-200" />
                        <div className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-50 border border-gray-200">
                          {item.label}
                        </div>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    );
                  }

                  return (
                    <ChatMessageRow
                      key={item.id}
                      msg={item.any}
                      isHost={item.isHost}
                    />
                  );
                })}
              </div>
            </div>

            {showJump && (
              <button
                onClick={() => {
                  setIsNearBottom(true);
                  setShowJump(false);
                  scrollToBottom(true);
                }}
                className="absolute bottom-3 right-3 px-3 py-2 text-sm rounded-full bg-emerald-600 text-white shadow hover:bg-emerald-700"
              >
                Jump to latest
              </button>
            )}
          </div>

          {/* Input (always at bottom, never scrolls) */}
          <div className="shrink-0 w-full mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSend();
              }}
              placeholder="Type your message..."
              className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              onClick={onSend}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
