"use client";

import type { ChatMessage } from "@/lib/chat/types";
import { formatChatTimestamp } from "@/lib/chat/time";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const s = parts.map((p) => p[0]?.toUpperCase() || "").join("");
  return s || "?";
}

export function ChatMessageRow({
  msg,
  isHost,
}: {
  msg: ChatMessage;
  isHost?: boolean;
}) {
  const avatar = initials(msg.senderName);

  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {avatar}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-gray-900 font-medium truncate">{msg.senderName}</span>

          {isHost && (
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs">
              Host
            </span>
          )}

          <span className="text-xs text-gray-500">{formatChatTimestamp(msg.createdAt)}</span>
        </div>

        <div className="whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}
