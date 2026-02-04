// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@testing-library/jest-dom");

// Global API mocks to prevent undefined errors in tests
// Individual test files can override these with jest.mock() if needed
// Using factory function to ensure each test gets fresh mocks
jest.mock("@/lib/api", () => {
  const createMockFn = () => jest.fn(() => Promise.resolve({}));
  return {
    gamesApi: {
      getUpcoming: createMockFn(),
      getPast: createMockFn(),
      getPastByUserNeedingAttendanceUpdate: createMockFn(),
      getById: createMockFn(),
      getRoster: createMockFn(),
      create: createMockFn(),
      join: createMockFn(),
      leave: createMockFn(),
      cancel: createMockFn(),
      getGameParticipation: createMockFn(),
    },
    organizerQualityApi: {
      getOqs: createMockFn(),
      getMyOqs: createMockFn(),
      getOqsSummary: createMockFn(),
      getOqsInfoCard: createMockFn(),
      getMyOqsInfoCard: createMockFn(),
      getOqsHistory: createMockFn(),
      getMyOqsHistory: createMockFn(),
      getWeights: createMockFn(),
    },
    // Export other APIs as empty objects to prevent undefined errors
    attendanceApi: {},
    reportsApi: {},
    notificationsApi: {},
    endorsementsApi: {},
    healthApi: {},
    authApi: {},
    scoreHistoryApi: {},
    // Export default object
    __esModule: true,
    default: {
      auth: {},
      games: {},
      attendance: {},
      reports: {},
      notifications: {},
      endorsements: {},
      health: {},
      scoreHistory: {},
      organizerQuality: {},
    },
  };
});