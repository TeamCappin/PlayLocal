import type { AssistantEntryContext } from "@/components/assistant/AssistantChatPanel";

export function inferAssistantRoute(pathname: string): {
  context: AssistantEntryContext;
  gameId?: string;
} {
  if (pathname.startsWith("/games/")) {
    const seg = pathname.split("/").filter(Boolean);
    if (
      seg[0] === "games" &&
      seg[1] &&
      seg[1] !== "create"
    ) {
      return { context: "game", gameId: seg[1] };
    }
  }
  if (pathname.startsWith("/profile")) {
    return { context: "profile" };
  }
  return { context: "discover" };
}
