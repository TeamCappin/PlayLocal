const SESSION_KEY = "playlocal_assistant_session_id";

export function getOrCreateAssistantSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function sessionStartedTelemetryKey(sessionId: string): string {
  return `playlocal_assistant_sess_started_${sessionId}`;
}
