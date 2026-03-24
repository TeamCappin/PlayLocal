import { inferAssistantRoute } from '@/lib/inferAssistantRoute';

describe('inferAssistantRoute', () => {
  it('maps game details route to game context with gameId', () => {
    expect(inferAssistantRoute('/games/abc-123')).toEqual({
      context: 'game',
      gameId: 'abc-123',
    });
  });

  it('does not treat /games/create as a game details route', () => {
    expect(inferAssistantRoute('/games/create')).toEqual({
      context: 'discover',
    });
  });

  it('maps profile routes to profile context', () => {
    expect(inferAssistantRoute('/profile')).toEqual({ context: 'profile' });
    expect(inferAssistantRoute('/profile/john')).toEqual({ context: 'profile' });
  });

  it('defaults to discover context for other routes', () => {
    expect(inferAssistantRoute('/discover')).toEqual({ context: 'discover' });
    expect(inferAssistantRoute('/calendar')).toEqual({ context: 'discover' });
  });
});
