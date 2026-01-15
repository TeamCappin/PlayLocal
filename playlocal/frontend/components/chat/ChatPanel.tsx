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

  // auto-scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

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
  }

  if (!canChat) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          Only the organizer and confirmed participants can use chat.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
        {connected ? "Chat is live." : "Connecting to chat..."} Messages are visible only to this game room.
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div
        ref={listRef}
        className="space-y-4 max-h-[420px] overflow-y-auto pr-1"
      >
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

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <button
          onClick={onSend}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
