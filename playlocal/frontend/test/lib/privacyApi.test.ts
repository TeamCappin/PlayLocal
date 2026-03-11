export {}; // ensure this file is treated as a module

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      get: (name: string) => {
        const key = name.toLowerCase();
        if (key === 'content-type') return 'application/json';
        if (key === 'content-length') return null;
        return null;
      },
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('privacyApi', () => {
  let privacyApi: typeof import('../../lib/api').privacyApi;
  let setAuthToken: typeof import('../../lib/api').setAuthToken;

  beforeEach(() => {
    jest.resetModules();
    jest.unmock('@/lib/api');
    const apiModule =
      require('../../lib/api') as typeof import('../../lib/api');
    privacyApi = apiModule.privacyApi;
    setAuthToken = apiModule.setAuthToken;
    setAuthToken('test-token');
    jest.restoreAllMocks();
  });

  afterEach(() => {
    setAuthToken(null);
  });

  const mockSettings = {
    profileVisibility: 'public',
    skillsVisibility: 'public',
    historyVisibility: 'friends',
    mediaDefaultVisibility: 'participants',
    locationVisibilityRule: 'confirmed_only',
    allowProfileSearch: true,
  };

  it('getSettings fetches privacy settings', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(mockSettings));
    (globalThis as any).fetch = fetchMock;

    const result = await privacyApi.getSettings();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/privacy-settings'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
    expect(result.profileVisibility).toBe('public');
    expect(result.allowProfileSearch).toBe(true);
  });

  it('updateSettings sends PUT request with settings', async () => {
    const updatedSettings = { ...mockSettings, profileVisibility: 'private' };
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse(updatedSettings));
    (globalThis as any).fetch = fetchMock;

    const result = await privacyApi.updateSettings({
      profileVisibility: 'private',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/privacy-settings'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ profileVisibility: 'private' }),
      })
    );
    expect(result.profileVisibility).toBe('private');
  });
});
