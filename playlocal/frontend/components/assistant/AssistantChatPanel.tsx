"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bot, Loader2, Send, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { aiApi, AiChatMessage, ApiError } from "@/lib/api";
import {
  getOrCreateAssistantSessionId,
  sessionStartedTelemetryKey,
} from "@/lib/assistantSession";
import { AssistantMarkdown } from "@/components/assistant/AssistantMarkdown";

const DISCLAIMER =
  "AI responses may be inaccurate; verify before acting.";

const EXAMPLE_QUESTIONS = [
  "How do I join a game?",
  "What is reliability score?",
  "How do I host a pickup game?",
];

const CHAT_TIMEOUT_MS = 60_000;
const PANEL_TRANSITION_MS = 280;

/** Desktop / laptop: bottom-right widget; width fixed, height from viewport */
const PANEL_SHELL =
  "flex w-[520px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-emerald-950/10 ring-1 ring-black/[0.06]";

export type AssistantEntryContext = "discover" | "game" | "profile";

export interface AssistantChatPanelProps {
  open: boolean;
  onClose: () => void;
  context: AssistantEntryContext;
  gameId?: string;
}

export function AssistantChatPanel({
  open,
  onClose,
  context,
  gameId,
}: AssistantChatPanelProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [shouldRender, setShouldRender] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<AiChatMessage[] | null>(
    null,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setAnimateIn(false);
    const t = window.setTimeout(
      () => setShouldRender(false),
      PANEL_TRANSITION_MS,
    );
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }
    const prevOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [shouldRender]);

  useEffect(() => {
    if (!animateIn) {
      return;
    }
    closeRef.current?.focus();
  }, [animateIn]);

  useEffect(() => {
    if (!open || !animateIn || !isAuthenticated) {
      return;
    }
    const sessionId = getOrCreateAssistantSessionId();
    if (!sessionId) {
      return;
    }
    if (typeof window !== "undefined") {
      const flag = sessionStartedTelemetryKey(sessionId);
      if (sessionStorage.getItem(flag)) {
        return;
      }
    }
    void aiApi
      .telemetry({
        eventType: "SESSION_STARTED",
        sessionId,
        context,
        gameId,
      })
      .then(() => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionStartedTelemetryKey(sessionId), "1");
        }
      })
      .catch(() => {
        if (typeof console !== "undefined" && console.debug) {
          console.debug("[assistant] telemetry session_started failed");
        }
      });
  }, [open, animateIn, context, gameId, isAuthenticated]);

  useEffect(() => {
    if (!listRef.current || !animateIn) {
      return;
    }
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, animateIn]);

  useEffect(() => {
    if (!shouldRender || !animateIn) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shouldRender, animateIn, onClose]);

  const sendMessages = useCallback(
    async (history: AiChatMessage[]) => {
      setLoading(true);
      setError(null);
      setPendingRetry(null);
      const sessionId = getOrCreateAssistantSessionId();
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        CHAT_TIMEOUT_MS,
      );
      try {
        const res = await aiApi.chat(
          { sessionId, messages: history },
          controller.signal,
        );
        const assistant = res.message;
        setMessages((prev) => [
          ...prev,
          { role: assistant.role, content: assistant.content },
        ]);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong.";
        setError(msg);
        setPendingRetry(history);
        if (
          err instanceof ApiError &&
          (err.status === 0 || err.status === 408)
        ) {
          void aiApi
            .telemetry({
              eventType: "RESPONSE_ERROR",
              sessionId: getOrCreateAssistantSessionId(),
              context,
              gameId,
            })
            .catch(() => {});
        }
      } finally {
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [context, gameId],
  );

  const sendUserText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) {
      return;
    }
    const userMsg: AiChatMessage = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    await sendMessages(next);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }
    await sendUserText(trimmed);
  };

  const handleRetry = () => {
    if (pendingRetry) {
      void sendMessages(pendingRetry);
    }
  };

  if (!shouldRender || !portalReady) {
    return null;
  }

  const overlay = (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-chat-title"
      aria-describedby="assistant-description"
    >
      {/* Backdrop: separate layer so clicks & layout never depend on flex quirks */}
      <div
        className={`absolute inset-0 z-0 bg-black/45 backdrop-blur-[2px] transition-opacity ease-out motion-reduce:transition-none ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${PANEL_TRANSITION_MS}ms` }}
        role="presentation"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className={`absolute bottom-20 right-6 sm:bottom-6 z-10 ${PANEL_SHELL} h-[min(72vh,680px)] transition-[opacity,transform] ease-out motion-reduce:transition-none ${
          animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
        style={{ transitionDuration: `${PANEL_TRANSITION_MS}ms` }}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 rounded-t-2xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 px-4 py-3.5 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner ring-1 ring-white/20">
              <Bot className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="assistant-chat-title"
                className="truncate text-base font-semibold tracking-tight"
              >
                PlayLocal assistant
              </h2>
              <p className="truncate text-xs text-emerald-100/95">
                Help while you browse the site
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl text-white/95 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <p
          id="assistant-description"
          className="shrink-0 border-b border-amber-200/60 bg-gradient-to-r from-amber-50 to-amber-50/80 px-4 py-2 text-xs leading-snug text-amber-950"
        >
          {DISCLAIMER}
        </p>

        {authLoading && (
          <div
            className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 px-6 py-10"
            aria-live="polite"
          >
            <div className="rounded-full bg-emerald-50 p-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
            </div>
            <p className="text-sm text-gray-600">Preparing chat…</p>
          </div>
        )}

        {!authLoading && !isAuthenticated && (
          <div className="flex min-h-[220px] flex-1 flex-col justify-center gap-4 px-5 py-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Bot className="h-7 w-7" aria-hidden />
            </div>
            <p className="text-center text-sm leading-relaxed text-gray-700">
              Sign in to chat with the assistant and get help with games, your profile, and more.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </div>
        )}

        {!authLoading && isAuthenticated && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div
              ref={listRef}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth overscroll-y-contain bg-gradient-to-b from-slate-50 to-slate-50/90 px-4 py-4 [scrollbar-gutter:stable]"
            >
              {messages.length === 0 && !loading && (
                <div className="mx-auto max-w-sm space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      What can we help with?
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Ask in your own words or try a suggestion below.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {EXAMPLE_QUESTIONS.map((q) => (
                      <li key={q}>
                        <button
                          type="button"
                          className="w-full rounded-xl border border-emerald-200/80 bg-white px-3.5 py-3 text-left text-sm text-emerald-950 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px]"
                          onClick={() => void sendUserText(q)}
                        >
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <ul className="space-y-3 pt-1">
                {messages.map((m, i) => (
                  <li
                    key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
                    className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wide text-gray-400 ${
                        m.role === "user" ? "pr-1" : "pl-1"
                      }`}
                    >
                      {m.role === "user" ? "You" : "Assistant"}
                    </span>
                    <div
                      className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        m.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "border border-gray-200/80 bg-white text-gray-900"
                      }`}
                    >
                      {m.role === "user" ? (
                        <span className="whitespace-pre-wrap break-words">
                          {m.content}
                        </span>
                      ) : (
                        <AssistantMarkdown text={m.content} />
                      )}
                    </div>
                  </li>
                ))}
                {loading && (
                  <li className="flex flex-col gap-1 items-start" aria-live="polite">
                    <span className="pl-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      Assistant
                    </span>
                    <div className="flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white px-3.5 py-2.5 text-sm text-gray-600 shadow-sm">
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-600" aria-hidden />
                      Thinking…
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {error && (
              <div
                className="shrink-0 border-t border-red-100 bg-red-50/95 px-4 py-3 text-sm text-red-900"
                role="alert"
              >
                <p className="mb-2 leading-snug">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="min-h-9 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Retry
                </button>
              </div>
            )}

            <footer className="shrink-0 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-end gap-2.5">
                <label htmlFor="assistant-input" className="sr-only">
                  Message to assistant
                </label>
                <textarea
                  id="assistant-input"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Type a message… (Shift+Enter for a new line)"
                  className="max-h-40 min-h-[72px] flex-1 resize-y rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={loading || !input.trim()}
                  className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
