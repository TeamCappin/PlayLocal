function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: {
      get: (name: string) => {
        const key = name.toLowerCase();
        if (key === "content-type") return "application/json";
        if (key === "content-length") return null;
        return null;
      },
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("gamesApi lifecycle endpoints", () => {
  let gamesApi: typeof import("../../lib/api").gamesApi;
  let setAuthToken: typeof import("../../lib/api").setAuthToken;

  beforeEach(() => {
    jest.resetModules();
    jest.unmock("@/lib/api");
    const apiModule = require("../../lib/api") as typeof import("../../lib/api");
    gamesApi = apiModule.gamesApi;
    setAuthToken = apiModule.setAuthToken;
    setAuthToken(null);
    jest.restoreAllMocks();
  });

  it("calls complete endpoint with POST", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ gameId: "g-1", status: "COMPLETED" }));
    (globalThis as any).fetch = fetchMock;

    const response = await gamesApi.complete("g-1");

    expect(response).toEqual({ gameId: "g-1", status: "COMPLETED" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/games/g-1/complete"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("calls archive endpoint with POST", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ gameId: "g-2", status: "ARCHIVED" }));
    (globalThis as any).fetch = fetchMock;

    const response = await gamesApi.archive("g-2");

    expect(response).toEqual({ gameId: "g-2", status: "ARCHIVED" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/games/g-2/archive"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("calls update endpoint with PUT", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ gameId: "g-3", title: "Updated" }));
    (globalThis as any).fetch = fetchMock;

    const response = await gamesApi.update("g-3", { minReliabilityRequired: 80 } as any);

    expect(response).toEqual({ gameId: "g-3", title: "Updated" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/games/g-3"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ minReliabilityRequired: 80 }),
      }),
    );
  });
});
