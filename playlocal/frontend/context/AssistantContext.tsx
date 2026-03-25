"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";
import {
  AssistantChatPanel,
  type AssistantEntryContext,
} from "@/components/assistant/AssistantChatPanel";
import { inferAssistantRoute } from "@/lib/inferAssistantRoute";

type AssistantContextValue = {
  openAssistant: (context: AssistantEntryContext, gameId?: string) => void;
  closeAssistant: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return ctx;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<AssistantEntryContext>("discover");
  const [gameId, setGameId] = useState<string | undefined>(undefined);

  const openAssistant = useCallback(
    (c: AssistantEntryContext, gid?: string) => {
      setContext(c);
      setGameId(gid);
      setOpen(true);
    },
    [],
  );

  const closeAssistant = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openAssistant, closeAssistant }),
    [openAssistant, closeAssistant],
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantChatPanel
        open={open}
        onClose={closeAssistant}
        context={context}
        gameId={gameId}
      />
      <AssistantFab
        open={open}
        openAssistant={openAssistant}
      />
    </AssistantContext.Provider>
  );
}

function AssistantFab({
  open,
  openAssistant,
}: {
  open: boolean;
  openAssistant: (c: AssistantEntryContext, gid?: string) => void;
}) {
  const pathname = usePathname();
  if (pathname === "/") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        const { context: c, gameId: gid } = inferAssistantRoute(pathname);
        openAssistant(c, gid);
      }}
      className={`fixed bottom-8 right-8 sm:flex hidden z-[9998] flex min-h-[52px] items-center justify-center gap-2 rounded-full border-2 border-emerald-500 bg-white px-5 py-3 text-sm font-medium text-gray-900 shadow-xl ring-2 ring-emerald-600/20 transition-all duration-200 hover:border-emerald-600 hover:bg-emerald-50/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        open ? "pointer-events-none scale-95 opacity-0" : "opacity-100"
      }`}
      aria-label="Open help assistant"
      aria-hidden={open}
    >
      <Bot className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
      <span>Help</span>
    </button>
  );
}
