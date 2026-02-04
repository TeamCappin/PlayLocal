// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@testing-library/jest-dom");

// Global API mocks to prevent undefined errors in tests
// Individual test files can override these with jest.mock() if needed
jest.mock("@/lib/api", () => {
  const mockFn = jest.fn(() => Promise.resolve({}));
  return {
    gamesApi: {
      getUpcoming: mockFn,
      getPast: mockFn,
      getPastByUserNeedingAttendanceUpdate: mockFn,
      getById: mockFn,
      getRoster: mockFn,
      create: mockFn,
      join: mockFn,
      leave: mockFn,
      cancel: mockFn,
      getGameParticipation: mockFn,
    },
    organizerQualityApi: {
      getOqs: mockFn,
      getMyOqs: mockFn,
      getOqsSummary: mockFn,
      getOqsInfoCard: mockFn,
      getMyOqsInfoCard: mockFn,
      getOqsHistory: mockFn,
      getMyOqsHistory: mockFn,
      getWeights: mockFn,
    },
    // Export other APIs as empty objects to prevent undefined errors
    attendanceApi: {},
    reportsApi: {},
    notificationsApi: {},
    endorsementsApi: {},
    healthApi: {},
    authApi: {},
    scoreHistoryApi: {},
  };
});