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

describe('gamesApi lifecycle endpoints', () => {
  let gamesApi: typeof import('../../lib/api').gamesApi;
  let setAuthToken: typeof import('../../lib/api').setAuthToken;

  beforeEach(() => {
    jest.resetModules();
    jest.unmock('@/lib/api');
    const apiModule =
      require('../../lib/api') as typeof import('../../lib/api');
    gamesApi = apiModule.gamesApi;
    setAuthToken = apiModule.setAuthToken;
    setAuthToken(null);
    jest.restoreAllMocks();
  });

  it('calls complete endpoint with POST', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ gameId: 'g-1', status: 'COMPLETED' }));
    (globalThis as any).fetch = fetchMock;

    const response = await gamesApi.complete('g-1');

    expect(response).toEqual({ gameId: 'g-1', status: 'COMPLETED' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/games/g-1/complete'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('calls archive endpoint with POST', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ gameId: 'g-2', status: 'ARCHIVED' }));
    (globalThis as any).fetch = fetchMock;

    const response = await gamesApi.archive('g-2');

    expect(response).toEqual({ gameId: 'g-2', status: 'ARCHIVED' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/games/g-2/archive'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('calls update endpoint with PUT', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ gameId: 'g-3', title: 'Updated' }));
    (globalThis as any).fetch = fetchMock;

    const response = await gamesApi.update('g-3', {
      minReliabilityRequired: 80,
    } as any);

    expect(response).toEqual({ gameId: 'g-3', title: 'Updated' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/games/g-3'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ minReliabilityRequired: 80 }),
      })
    );
  });

  // Extra tests for PlayLocal API client (apiFetch + more endpoints)

  function jsonResponse(
    body: unknown,
    overrides?: Partial<Response>
  ): Response {
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
      } as any,
      json: async () => body,
      text: async () => JSON.stringify(body),
      ...overrides,
    } as unknown as Response;
  }

  function noContentResponse(): Response {
    return {
      ok: true,
      status: 204,
      statusText: 'No Content',
      headers: { get: () => null } as any,
      json: async () => undefined,
      text: async () => '',
    } as unknown as Response;
  }

  function contentLengthZeroJsonResponse(): Response {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: (name: string) => {
          const key = name.toLowerCase();
          if (key === 'content-type') return 'application/json';
          if (key === 'content-length') return '0';
          return null;
        },
      } as any,
      json: async () => ({ ignored: true }),
      text: async () => JSON.stringify({ ignored: true }),
    } as unknown as Response;
  }

  function nonJsonContentTypeResponse(): Response {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: (name: string) => {
          const key = name.toLowerCase();
          if (key === 'content-type') return 'text/plain';
          if (key === 'content-length') return null;
          return null;
        },
      } as any,
      json: async () => ({ ignored: true }),
      text: async () => 'ok',
    } as unknown as Response;
  }

  function errorJsonResponse(status: number, body: any): Response {
    return {
      ok: false,
      status,
      statusText: 'Bad Request',
      headers: { get: () => 'application/json' } as any,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response;
  }

  function errorTextResponse(
    status: number,
    statusText: string,
    bodyText: string
  ): Response {
    return {
      ok: false,
      status,
      statusText,
      headers: { get: () => 'text/plain' } as any,
      json: async () => {
        throw new Error('no json');
      },
      text: async () => bodyText,
    } as unknown as Response;
  }

  function invalidJsonResponse(): Response {
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
      } as any,
      json: async () => {
        throw new Error('boom json parse');
      },
      text: async () => '{ not valid json }',
    } as unknown as Response;
  }

  describe('apiFetch core behaviors', () => {
    let gamesApi: typeof import('../../lib/api').gamesApi;
    let setAuthToken: typeof import('../../lib/api').setAuthToken;
    let getAuthToken: typeof import('../../lib/api').getAuthToken;
    let ApiError: typeof import('../../lib/api').ApiError;

    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: jest.fn((k: string) => (k in store ? store[k] : null)),
        setItem: jest.fn((k: string, v: string) => {
          store[k] = String(v);
        }),
        removeItem: jest.fn((k: string) => {
          delete store[k];
        }),
        clear: jest.fn(() => {
          store = {};
        }),
      };
    })();

    beforeEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();

      // Ensure "window" exists so module reads localStorage in init
      (globalThis as any).window = globalThis;
      (globalThis as any).localStorage = localStorageMock;
      localStorageMock.clear();

      const apiModule =
        require('../../lib/api') as typeof import('../../lib/api');
      gamesApi = apiModule.gamesApi;
      setAuthToken = apiModule.setAuthToken;
      getAuthToken = apiModule.getAuthToken;
      ApiError = apiModule.ApiError;

      setAuthToken(null);
    });

    it('adds Authorization header when token is set', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(jsonResponse({ gameId: 'g-1' }));
      (globalThis as any).fetch = fetchMock;

      setAuthToken('my-token');
      await gamesApi.getById('g-1');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, options] = fetchMock.mock.calls[0];

      // Default header + auth header
      expect(options.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer my-token',
        })
      );
    });

    it('throws ApiError(0) on network error', async () => {
      const fetchMock = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      (globalThis as any).fetch = fetchMock;

      await expect(gamesApi.getById('g-9')).rejects.toMatchObject({
        name: 'ApiError',
        status: 0,
        message: expect.stringContaining('Unable to connect to server'),
        data: expect.objectContaining({
          originalError: expect.any(String),
        }),
      });
    });

    it('parses JSON error body when response is not ok', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(
          errorJsonResponse(400, { message: 'Bad request', code: 'BAD' })
        );
      (globalThis as any).fetch = fetchMock;

      await expect(gamesApi.getById('g-bad')).rejects.toMatchObject({
        name: 'ApiError',
        status: 400,
        message: 'Bad request',
        data: expect.objectContaining({ code: 'BAD' }),
      });
    });

    it('extracts fieldErrors when response has no message field', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(
          errorJsonResponse(400, {
            error: 'Validation failed',
            fieldErrors: { startTime: 'Start time must be in the future' },
          })
        );
      (globalThis as any).fetch = fetchMock;

      await expect(gamesApi.getById('g-past')).rejects.toMatchObject({
        name: 'ApiError',
        status: 400,
        message: 'Start time must be in the future',
        data: expect.objectContaining({
          fieldErrors: { startTime: 'Start time must be in the future' },
        }),
      });
    });

    it('joins multiple fieldErrors into a single message', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(
          errorJsonResponse(400, {
            error: 'Validation failed',
            fieldErrors: {
              startTime: 'Start time must be in the future',
              title: 'Title is required',
            },
          })
        );
      (globalThis as any).fetch = fetchMock;

      try {
        await gamesApi.getById('g-multi');
        throw new Error('expected to throw');
      } catch (e: any) {
        expect(e).toBeInstanceOf(ApiError);
        expect(e.status).toBe(400);
        expect(e.message).toContain('Start time must be in the future');
        expect(e.message).toContain('Title is required');
      }
    });

    it('falls back to statusText when error body is not JSON', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(
          errorTextResponse(500, 'Internal Server Error', 'not-json-body')
        );
      (globalThis as any).fetch = fetchMock;

      try {
        await gamesApi.getById('g-err');
        throw new Error('expected to throw');
      } catch (e: any) {
        expect(e).toBeInstanceOf(ApiError);
        expect(e.status).toBe(500);
        expect(e.message).toBe('Internal Server Error');
        expect(e.data).toEqual({ message: 'Internal Server Error' });
      }
    });

    it('returns undefined on 204 No Content', async () => {
      const fetchMock = jest.fn().mockResolvedValue(noContentResponse());
      (globalThis as any).fetch = fetchMock;

      const res = await gamesApi.leave('g-1');
      expect(res).toBeUndefined();
    });

    it('returns undefined when content-length is "0"', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(contentLengthZeroJsonResponse());
      (globalThis as any).fetch = fetchMock;

      const res = await gamesApi.getPast(); // any endpoint is fine
      expect(res).toBeUndefined();
    });

    it('returns undefined when content-type is not application/json', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(nonJsonContentTypeResponse());
      (globalThis as any).fetch = fetchMock;

      const res = await gamesApi.getPast(); // will exit early due to content-type
      expect(res).toBeUndefined();
    });

    it("throws ApiError('Invalid JSON response') when response.json() fails", async () => {
      const fetchMock = jest.fn().mockResolvedValue(invalidJsonResponse());
      (globalThis as any).fetch = fetchMock;

      await expect(gamesApi.getPast()).rejects.toMatchObject({
        name: 'ApiError',
        status: 200,
        message: 'Invalid JSON response',
        data: expect.objectContaining({
          originalError: expect.anything(),
        }),
      });
    });
  });

  describe('gamesApi query building + join body', () => {
    let gamesApi: typeof import('../../lib/api').gamesApi;

    beforeEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();

      (globalThis as any).window = globalThis;
      (globalThis as any).localStorage = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };

      const apiModule =
        require('../../lib/api') as typeof import('../../lib/api');
      gamesApi = apiModule.gamesApi;
    });

    it('builds getUpcoming query string from filters in correct order', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse([]));
      (globalThis as any).fetch = fetchMock;

      await gamesApi.getUpcoming({
        lat: 45.5017,
        lon: -73.5673,
        radiusKm: 5,
        sportName: 'Soccer',
        skillLevel: 'BEGINNER',
        locationType: 'OUTDOOR',
        intensity: 'CASUAL',
      });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/games?');
      expect(url).toContain('lat=45.5017');
      expect(url).toContain('lon=-73.5673');
      expect(url).toContain('radiusKm=5');
      expect(url).toContain('sportName=Soccer');
      expect(url).toContain('skillLevel=BEGINNER');
      expect(url).toContain('locationType=OUTDOOR');
      expect(url).toContain('intensity=CASUAL');

      // Stronger check (order matches your code)
      expect(url).toContain(
        'lat=45.5017&lon=-73.5673&radiusKm=5&sportName=Soccer&skillLevel=BEGINNER&locationType=OUTDOOR&intensity=CASUAL'
      );
    });

    it('join sends POST with undefined body when joinRequest is omitted', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(jsonResponse({ joinStatus: 'CONFIRMED' }));
      (globalThis as any).fetch = fetchMock;

      await gamesApi.join('g-1');

      const [, options] = fetchMock.mock.calls[0];
      expect(options).toEqual(
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });

    it('join sends POST with JSON body when joinRequest is provided', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(jsonResponse({ joinStatus: 'CONFIRMED' }));
      (globalThis as any).fetch = fetchMock;

      await gamesApi.join('g-2', { confirmedTagIds: ['t1', 't2'] });

      const [, options] = fetchMock.mock.calls[0];
      expect(options).toEqual(
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ confirmedTagIds: ['t1', 't2'] }),
        })
      );
    });
  });

  describe('usersApi connection signals', () => {
    let usersApi: typeof import('../../lib/api').usersApi;

    beforeEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();
      (globalThis as any).window = globalThis;
      (globalThis as any).localStorage = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      const apiModule =
        require('../../lib/api') as typeof import('../../lib/api');
      usersApi = apiModule.usersApi;
    });

    it('getConnectionSignals calls GET /users/:userId/connection-signals', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(
          jsonResponse({ mutualFriendCount: 2, coPlayCount: 1 })
        );
      (globalThis as any).fetch = fetchMock;

      const res = await usersApi.getConnectionSignals('user-uuid-123');

      expect(res).toEqual({ mutualFriendCount: 2, coPlayCount: 1 });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/users/user-uuid-123/connection-signals');
    });

    it('getConnectionSignalsBatch calls POST /users/connection-signals with userIds', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({
          signalsByUserId: { u1: { mutualFriendCount: 0, coPlayCount: 2 } },
        })
      );
      (globalThis as any).fetch = fetchMock;

      const res = await usersApi.getConnectionSignalsBatch(['u1', 'u2']);

      expect(res.signalsByUserId).toEqual({
        u1: { mutualFriendCount: 0, coPlayCount: 2 },
      });
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/users/connection-signals');
      expect((options as RequestInit).method).toBe('POST');
      expect((options as RequestInit).body).toBe(
        JSON.stringify({ userIds: ['u1', 'u2'] })
      );
    });

    it('getProfile calls GET /users/:userId/profile', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({
          userId: 'u-1',
          displayName: 'Test',
          email: 't@t.com',
          reliabilityScore: 90,
        })
      );
      (globalThis as any).fetch = fetchMock;

      const res = await usersApi.getProfile('u-1');

      expect(res.displayName).toBe('Test');
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/users/u-1/profile');
    });

    it('getProfileBySlug calls GET /users/slug/:slug/profile', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(
          jsonResponse({ userId: 'u-2', displayName: 'Jane', slug: 'jane-doe' })
        );
      (globalThis as any).fetch = fetchMock;

      const res = await usersApi.getProfileBySlug('jane-doe');

      expect(res.displayName).toBe('Jane');
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/users/slug/jane-doe/profile');
    });

    it('updateProfile calls PUT /users/profile with body', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({
          userId: 'u-1',
          displayName: 'Updated Name',
          bio: 'New bio',
        })
      );
      (globalThis as any).fetch = fetchMock;

      await usersApi.updateProfile({
        displayName: 'Updated Name',
        bio: 'New bio',
      });

      const [, options] = fetchMock.mock.calls[0];
      expect((options as RequestInit).method).toBe('PUT');
      expect((options as RequestInit).body).toBe(
        JSON.stringify({ displayName: 'Updated Name', bio: 'New bio' })
      );
    });

    it('search calls GET /users/search with query params', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({
          users: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
        })
      );
      (globalThis as any).fetch = fetchMock;

      await usersApi.search('john', 1, 10);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/users/search');
      expect(url).toContain('page=1');
      expect(url).toContain('size=10');
    });
  });

  describe('friendsApi endpoints', () => {
    let friendsApi: typeof import('../../lib/api').friendsApi;

    beforeEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();
      (globalThis as any).window = globalThis;
      (globalThis as any).localStorage = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      const apiModule =
        require('../../lib/api') as typeof import('../../lib/api');
      friendsApi = apiModule.friendsApi;
    });

    it('getFriends calls GET /friends', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(jsonResponse({ friends: [], totalElements: 0 }));
      (globalThis as any).fetch = fetchMock;

      await friendsApi.getFriends();

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/friends');
    });
  });

  describe('photosApi endpoints', () => {
    let photosApi: typeof import('../../lib/api').photosApi;

    beforeEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();

      (globalThis as any).window = globalThis;
      (globalThis as any).localStorage = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };

      const apiModule =
        require('../../lib/api') as typeof import('../../lib/api');
      photosApi = apiModule.photosApi;
    });

    it('requestUploadSlot calls POST with JSON body', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({
          mediaId: 'm1',
          storageKey: 'k1',
          uploadUrl: 'https://x',
        })
      );
      (globalThis as any).fetch = fetchMock;

      const res = await photosApi.requestUploadSlot('g-9', {
        fileName: 'a.png',
        contentType: 'image/png',
        sizeBytes: 123,
      });

      expect(res).toEqual({
        mediaId: 'm1',
        storageKey: 'k1',
        uploadUrl: 'https://x',
      });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/games/g-9/media/photos/upload-slot'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            fileName: 'a.png',
            contentType: 'image/png',
            sizeBytes: 123,
          }),
        })
      );
    });

    it('finalizeUpload calls POST without body', async () => {
      const fetchMock = jest.fn().mockResolvedValue(noContentResponse());
      (globalThis as any).fetch = fetchMock;

      const res = await photosApi.finalizeUpload('g-1', 'm-1');

      expect(res).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/games/g-1/media/photos/m-1/finalize'),
        expect.objectContaining({ method: 'POST' })
      );

      const [, options] = fetchMock.mock.calls[0];
      expect((options as any).body).toBeUndefined();
    });
  });

  describe('aiApi endpoints', () => {
    let aiApi: typeof import('../../lib/api').aiApi;

    beforeEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();

      (globalThis as any).window = globalThis;
      (globalThis as any).localStorage = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };

      const apiModule =
        require('../../lib/api') as typeof import('../../lib/api');
      aiApi = apiModule.aiApi;
    });

    it('chat posts messages to /ai/chat and returns assistant payload', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(jsonResponse({ message: { role: 'assistant', content: 'ok' } }));
      (globalThis as any).fetch = fetchMock;
      const controller = new AbortController();

      const res = await aiApi.chat(
        { sessionId: 'sess-1', messages: [{ role: 'user', content: 'hello' }] },
        controller.signal
      );

      expect(res).toEqual({ message: { role: 'assistant', content: 'ok' } });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/ai/chat'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'sess-1',
            messages: [{ role: 'user', content: 'hello' }],
          }),
          signal: controller.signal,
        })
      );
    });

    it('telemetry posts event payload to /ai/telemetry', async () => {
      const fetchMock = jest.fn().mockResolvedValue(noContentResponse());
      (globalThis as any).fetch = fetchMock;

      const res = await aiApi.telemetry({
        eventType: 'SESSION_STARTED',
        sessionId: 'sess-1',
        context: 'discover',
      });

      expect(res).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/ai/telemetry'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            eventType: 'SESSION_STARTED',
            sessionId: 'sess-1',
            context: 'discover',
          }),
        })
      );
    });
  });

  describe('statsApi', () => {

    it('getShowUpRate calls /stats/show-up-rate', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ score: 95 }));
      (globalThis as any).fetch = fetchMock;

      const res = await require('@/lib/api').statsApi.getShowUpRate('30');
      expect(res).toEqual({ score: 95 });
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/stats/show-up-rate?timeframe=30'), expect.any(Object));
    });

    it('getSkillTrend calls /stats/skill-trend', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ trend: 'up' }));
      (globalThis as any).fetch = fetchMock;

      const res = await require('@/lib/api').statsApi.getSkillTrend('30');
      expect(res).toEqual({ trend: 'up' });
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/stats/skill-trend?timeframe=30'), expect.any(Object));
    });

    it('getAttendanceRate calls /stats/attendance-rate', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ rate: 100 }));
      (globalThis as any).fetch = fetchMock;

      const res = await require('@/lib/api').statsApi.getAttendanceRate('30');
      expect(res).toEqual({ rate: 100 });
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/stats/attendance-rate?timeframe=30'), expect.any(Object));
    });

    it('getPlayerRatingStats calls /stats/player-rating', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ rating: 4.5 }));
      (globalThis as any).fetch = fetchMock;

      const res = await require('@/lib/api').statsApi.getPlayerRatingStats('30');
      expect(res).toEqual({ rating: 4.5 });
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/stats/player-rating?timeframe=30'), expect.any(Object));
    });
  });

  describe('playerRatingsApi', () => {
    it('createRating posts to /ratings', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ id: 'r1' }));
      (globalThis as any).fetch = fetchMock;

      const payload = { gameId: 'g1', rateeId: 'u1', rating: 5, comment: 'Great' };
      const res = await require('@/lib/api').playerRatingsApi.createRating(payload);
      
      expect(res).toEqual({ id: 'r1' });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/ratings'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
      );
    });

    it('updateRating puts to /ratings/:id', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ id: 'r1' }));
      (globalThis as any).fetch = fetchMock;

      const payload = { rating: 4, comment: 'Good' };
      const res = await require('@/lib/api').playerRatingsApi.updateRating('r1', payload);
      
      expect(res).toEqual({ id: 'r1' });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/ratings/r1'),
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(payload) })
      );
    });

    it('getRatingsForUser fetches from /ratings/user/:id', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse([{ id: 'r1' }]));
      (globalThis as any).fetch = fetchMock;

      const res = await require('@/lib/api').playerRatingsApi.getRatingsForUser('u1');
      expect(res).toEqual([{ id: 'r1' }]);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/ratings/user/u1'), expect.any(Object));
    });

    it('flagRating posts to /ratings/:id/flag', async () => {
      const fetchMock = jest.fn().mockResolvedValue(noContentResponse());
      (globalThis as any).fetch = fetchMock;

      await require('@/lib/api').playerRatingsApi.flagRating('r1');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/ratings/r1/flag'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
