require('@testing-library/jest-dom');

// window.scrollTo is not implemented in jsdom (throws "Not implemented" when called)
if (typeof window !== 'undefined') {
  window.scrollTo = jest.fn();

  // matchMedia is not implemented in jsdom (required by useIsMobile hook)
  window.matchMedia = window.matchMedia || function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };
}

// ResizeObserver is not available in jsdom (required by Radix Slider and similar)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Global API mocks to prevent undefined errors in tests
// Individual test files can override these with jest.mock() if needed
// Using factory function to ensure each test gets fresh mocks
jest.mock('@/lib/api', () => {
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
      getConnectionSignals: createMockObjectFn(),
      getConnectionSignalsBatch: jest.fn(() =>
        Promise.resolve({ signalsByUserId: {} })
      ),
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
    statsApi: {
      getShowUpRate: createMockObjectFn(),
      getSkillTrend: createMockObjectFn(),
      getAttendanceRate: createMockObjectFn(),
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
      stats: {},
    },
  };
});
