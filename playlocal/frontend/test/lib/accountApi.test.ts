export {};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 204 ? 'No Content' : 'OK',
    headers: {
      get: (name: string) => {
        const key = name.toLowerCase();
        if (key === 'content-type') return 'application/json';
        return null;
      },
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('usersApi account actions & photosApi.delete', () => {
  let usersApi: typeof import('@/lib/api').usersApi;
  let photosApi: typeof import('@/lib/api').photosApi;
  let setAuthToken: typeof import('@/lib/api').setAuthToken;

  beforeEach(() => {
    jest.resetModules();
    jest.unmock('@/lib/api');
    const apiModule =
      require('@/lib/api') as typeof import('@/lib/api');
    usersApi = apiModule.usersApi;
    photosApi = apiModule.photosApi;
    setAuthToken = apiModule.setAuthToken;
    setAuthToken('test-token');
    jest.restoreAllMocks();
  });

  afterEach(() => {
    setAuthToken(null);
  });

  it('deactivateAccount POSTs /users/deactivate', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(null, 204));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    await usersApi.deactivateAccount();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/deactivate'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('deleteAccount DELETEs /users/me', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(null, 204));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    await usersApi.deleteAccount();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('photosApi.delete DELETEs photo URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(null, 204));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    await photosApi.delete('g1', 'm1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/games\/g1\/media\/photos\/m1$/),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
