describe('assistantSession', () => {
  beforeEach(() => {
    jest.resetModules();
    sessionStorage.clear();
  });

  it('creates and reuses a session id in sessionStorage', () => {
    const { getOrCreateAssistantSessionId } = require('@/lib/assistantSession');

    const first = getOrCreateAssistantSessionId();
    const second = getOrCreateAssistantSessionId();

    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  it('builds stable telemetry key from session id', () => {
    const { sessionStartedTelemetryKey } = require('@/lib/assistantSession');
    expect(sessionStartedTelemetryKey('sess-1')).toBe(
      'playlocal_assistant_sess_started_sess-1'
    );
  });
});
