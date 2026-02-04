// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@testing-library/jest-dom");

// Global API mocks to prevent undefined errors in tests
// Individual test files can override these with jest.mock() if needed
// Using factory function to ensure each test gets fresh mocks
jest.mock("@/lib/api", () => {
  // Create mock functions that return appropriate types
  const createMockArrayFn = () => jest.fn(() => Promise.resolve([]));
  const createMockObjectFn = () => jest.fn(() => Promise.resolve({}));
  
  return {
    gamesApi: {
      getUpcoming: createMockArrayFn(), 
      getPast: createMockArrayFn(), 
      getPastByUserNeedingAttendanceUpdate: createMockArrayFn(), 
      getById: createMockObjectFn(), 
      getRoster: createMockObjectFn(), 
      create: createMockObjectFn(), 
      join: createMockObjectFn(), 
      leave: createMockObjectFn(), 
      cancel: createMockObjectFn(), 
      getGameParticipation: createMockObjectFn(), 
    },
    organizerQualityApi: {
      getOqs: createMockObjectFn(),
      getMyOqs: createMockObjectFn(), 
      getOqsSummary: createMockObjectFn(), 
      getOqsInfoCard: createMockObjectFn(), 
      getMyOqsInfoCard: createMockObjectFn(), 
      getOqsHistory: createMockObjectFn(), 
      getMyOqsHistory: createMockObjectFn(), 
      getWeights: createMockObjectFn(), 
    },
    usersApi: {
      getProfile: createMockObjectFn(), 
      getProfileBySlug: createMockObjectFn(), 
      updateProfile: createMockObjectFn(), 
      search: createMockObjectFn(), 
    },
    // Export other APIs with mock functions to prevent undefined errors
    attendanceApi: {
      updateAttendance: createMockObjectFn(),
      getAttendance: createMockObjectFn(),
    },
    reportsApi: {
      reportUser: createMockObjectFn(),
      reportGame: createMockObjectFn(),
    },
    notificationsApi: {
      getNotifications: createMockArrayFn(),
      markAsRead: createMockObjectFn(),
    },
    endorsementsApi: {
      createEndorsement: createMockObjectFn(),
      getEndorsements: createMockArrayFn(),
    },
    healthApi: {
      check: createMockObjectFn(),
    },
    authApi: {
      login: createMockObjectFn(),
      register: createMockObjectFn(),
      logout: createMockObjectFn(),
    },
    scoreHistoryApi: {
      getHistory: createMockArrayFn(),
    },
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