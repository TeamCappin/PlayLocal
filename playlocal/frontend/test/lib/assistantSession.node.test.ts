/**
 * @jest-environment node
 */

describe('assistantSession (node environment)', () => {
  it('returns empty string when window is unavailable (SSR path)', () => {
    const { getOrCreateAssistantSessionId } = require('@/lib/assistantSession');
    expect(getOrCreateAssistantSessionId()).toBe('');
  });
});
