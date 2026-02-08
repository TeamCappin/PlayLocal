// PlayLocal API Client
// Connects the React frontend to the Spring Boot backend

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// Token management
let authToken: string | null =
  typeof window !== "undefined"
    ? localStorage.getItem("playlocal_token")
    : null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem("playlocal_token", token);
  } else {
    localStorage.removeItem("playlocal_token");
  }
};

export const getAuthToken = () => authToken;

// Base fetch wrapper with auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    // Handle network errors (no connection, CORS, etc.)
    throw new ApiError(0, "Network error: Unable to connect to server", {
      originalError: networkError.message || "Network request failed",
    });
  }

  if (!response.ok) {
    let errorData: any = { message: "An error occurred" };
    try {
      const text = await response.text();
      if (text) {
        errorData = JSON.parse(text);
      }
    } catch (e) {
      // If response is not JSON, use status text
      errorData = { message: response.statusText || "An error occurred" };
    }
    throw new ApiError(
      response.status,
      errorData.message || "An error occurred",
      errorData,
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch (e) {
    throw new ApiError(response.status, "Invalid JSON response", {
      originalError: e,
    });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ============================================
// AUTH API
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
  ageConfirmed: boolean;
  eulaAccepted: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserDto;
}

export interface UserDto {
  userId: string;
  email: string;
  displayName: string;
  slug?: string; // URL-friendly identifier (e.g., "john-doe")
  avatarUrl?: string;
  defaultIntensity?: string;
  availability?: string;
  bio?: string;
  location?: string;
  reliabilityScore: number;
  gamesCount: number;
  endorsementsCount?: number; // New field for endorsements count [US-3.3]
  createdAt?: string;
}

export const authApi = {
  register: (data: RegisterRequest) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => apiFetch<UserDto>("/auth/me"),

  logout: () => {
    setAuthToken(null);
    return Promise.resolve();
  },
};

// ============================================
// USERS API
// ============================================

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  location?: string;
  defaultIntensity?: string;
  availability?: string;
  phone?: string;
}

export interface SearchUsersResponse {
  users: UserDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export const usersApi = {
  updateProfile: (data: UpdateProfileRequest) =>
    apiFetch<UserDto>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getProfile: (userId: string) => apiFetch<UserDto>(`/users/${userId}/profile`),

  // Slug-based profile lookup (US 1.3 + 1.4 merge)
  getProfileBySlug: (slug: string) =>
    apiFetch<UserDto>(`/users/slug/${slug}/profile`),

  search: (query?: string, page = 0, size = 20) =>
    apiFetch<SearchUsersResponse>(
      `/users/search?q=${encodeURIComponent(query || "")}&page=${page}&size=${size}`,
    ),

  getConnectionSignals: (targetUserId: string) =>
    apiFetch<ConnectionSignals>(`/users/${targetUserId}/connection-signals`),

  getConnectionSignalsBatch: (userIds: string[]) =>
    apiFetch<ConnectionSignalsBatchResponse>("/users/connection-signals", {
      method: "POST",
      body: JSON.stringify({ userIds }),
    }),
};


export interface ConnectionSignals {
  mutualFriendCount: number;
  coPlayCount: number;
}

export interface ConnectionSignalsBatchResponse {
  signalsByUserId: Record<string, ConnectionSignals>;
}

// ============================================
// FRIENDS API
// ============================================

export interface FriendInfo {
  friendshipId: string;
  friendUserId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  reliabilityScore: number;
  gamesCount: number;
  status: string;
  createdAt: string;
}

export interface FriendsListResponse {
  friends: FriendInfo[];
  pendingReceived: FriendInfo[];
  pendingSent: FriendInfo[];
}

export interface FriendshipAction {
  friendshipId: string;
  status: string;
  message: string;
}

export const friendsApi = {
  getFriends: () => apiFetch<FriendsListResponse>("/friends"),

  sendRequest: (userId: string) =>
    apiFetch<FriendshipAction>(`/friends/request/${userId}`, {
      method: "POST",
    }),

  acceptRequest: (friendshipId: string) =>
    apiFetch<FriendshipAction>(`/friends/${friendshipId}/accept`, {
      method: "POST",
    }),

  declineRequest: (friendshipId: string) =>
    apiFetch<FriendshipAction>(`/friends/${friendshipId}/decline`, {
      method: "POST",
    }),

  removeFriend: (friendshipId: string) =>
    apiFetch<FriendshipAction>(`/friends/${friendshipId}`, {
      method: "DELETE",
    }),
};

// ============================================
// GAMES API
// ============================================

export interface CreateGameRequest {
  title: string;
  description?: string;
  sportName: string;
  locationName: string;
  addressLine?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  indoorOutdoor?: string;
  intensityBand?: string;
  skillBand?: string;
  minPlayers?: number;
  maxPlayers?: number;
  allowWaitlist?: boolean;
  minReliabilityRequired?: number;
  startTime: string;
  endTime?: string;
  visibility?: string; // US 2.2: public/friends/invite
  // US-4.2: Community tags and age requirements
  tagNames?: string[];
  minAge?: number;
  maxAge?: number;
}

export interface UpdateGameRequest {
    title?: string;
    description?: string;
    indoorOutdoor?: string;
    intensityBand?: string;
    skillBand?: string;
    minPlayers?: number;
    maxPlayers?: number;
    allowWaitlist?: boolean;
    minReliabilityRequired?: number; // US-4.1: Can be updated before game starts
}

export interface GameResponse {
  gameId: string;
  title: string;
  description?: string;
  sportName: string;
  location: LocationDto | null; // US-1.3: null when hidden for privacy
  approximateLocation?: string; // New field for privacy [US-1.3]
  hasExactLocationAccess: boolean; // New field for privacy [US-1.3]
  indoorOutdoor?: string;
  intensityBand?: string;
  skillBand?: string;
  minPlayers: number;
  maxPlayers: number;
  allowWaitlist: boolean;
  minReliabilityRequired?: number;
  startTime: string;
  endTime?: string;
  status: string;
  organizer: OrganizerDto;
  confirmedCount: number;
  waitlistCount: number;
  createdAt: string;
  // US-4.2: Community tags and age requirements
  tags?: TagDto[];
  minAge?: number;
  maxAge?: number;
}

export interface LocationDto {
  name: string;
  addressLine?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrganizerDto {
  userId: string;
  displayName: string;
  reliabilityScore: number;
}

export interface JoinResponse {
  participationId: string;
  joinStatus: string;
  waitlistPosition?: number;
  message: string;
}

export interface RosterResponse {
  confirmed: ParticipantDto[];
  waitlisted: ParticipantDto[];
  maxPlayers: number;
  spotsAvailable: number;
}

export interface ParticipantDto {
  participationId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  joinStatus: string;
  attendanceStatus: string; // UNKNOWN, ATTENDED, NO_SHOW
  waitlistPosition?: number;
  reliabilityScore: number;
  joinedAt: string;
  isEndorsedByOrganizer?: boolean;
}

// US-4.2: Community Tags
export interface TagDto {
  tagId: string;
  name: string;
  tagType: string;
  isRestricted: boolean;
}

export interface GameFilters {
    lat?: number;
    lon?: number;
    radiusKm?: number;
    sportName?: string;
    skillLevel?: string;
    locationType?: string;
    intensity?: string;
}

// US-4.2: Join request with tag confirmations
export interface JoinRequest {
  confirmedTagIds?: string[];
}
export const gamesApi = {
  create: (data: CreateGameRequest) =>
    apiFetch<GameResponse>("/games", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUpcoming: (filters?: GameFilters) => {
    const params = new URLSearchParams();
    if (filters?.lat !== undefined) params.append('lat', filters.lat.toString());
    if (filters?.lon !== undefined) params.append('lon', filters.lon.toString());
    if (filters?.radiusKm !== undefined) params.append('radiusKm', filters.radiusKm.toString());
    if (filters?.sportName) params.append('sportName', filters.sportName);
    if (filters?.skillLevel) params.append('skillLevel', filters.skillLevel);
    if (filters?.locationType) params.append('locationType', filters.locationType);
    if (filters?.intensity) params.append('intensity', filters.intensity);
    
    const queryString = params.toString();
    return apiFetch<GameResponse[]>(`/games${queryString ? `?${queryString}` : ''}`);
  },

  getPast: () => apiFetch<GameResponse[]>(`/games/past`),

  getGameParticipation: (gameId: string) =>
    apiFetch<ParticipantDto>(`/games/gameParticipation/${gameId}`),

  getPastByUserNeedingAttendanceUpdate: () =>
    apiFetch<GameResponse[]>(`/games/pastByUserIdNeedingAttendanceUpdate`),
  getById: (gameId: string) => apiFetch<GameResponse>(`/games/${gameId}`),

  getRoster: (gameId: string) =>
    apiFetch<RosterResponse>(`/games/${gameId}/roster`),

  // US-4.2: Updated join to accept tag confirmations
  join: (gameId: string, joinRequest?: JoinRequest) =>
    apiFetch<JoinResponse>(`/games/${gameId}/join`, {
      method: "POST",
      body: joinRequest ? JSON.stringify(joinRequest) : undefined,
    }),

  leave: (gameId: string) =>
    apiFetch<void>(`/games/${gameId}/leave`, { method: "DELETE" }),

  // US-4.1: Update game settings (min reliability, etc.)
  update: (gameId: string, data: UpdateGameRequest) =>
    apiFetch<GameResponse>(`/games/${gameId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // US-2.4: Cancel game endpoint
  cancel: (gameId: string) =>
    apiFetch<GameResponse>(`/games/${gameId}`, { method: "DELETE" }),

  // US-4.2: Get all available tags
  getTags: () => apiFetch<TagDto[]>("/games/tags"),
};

// ============================================
// ATTENDANCE API
// ============================================

export interface AttendanceEntry {
  participationId: string;
  attendanceStatus: "ATTENDED" | "NO_SHOW" | "UNKNOWN";
  userId: string;
  sportId: string;
  requestedPositionRoleId: string;
}

export interface AttendanceResponse {
  gameId: string;
  attendedCount: number;
  noShowCount: number;
  updatedScores: UpdatedScore[];
}

export interface UpdatedScore {
  userId: string;
  displayName: string;
  previousScore: number;
  newScore: number;
  attendanceStatus: string;
}

export const attendanceApi = {
  getPending: (gameId: string) =>
    apiFetch<AttendanceEntry[]>(`/games/${gameId}/attendance`),

  confirm: (gameId: string, attendances: AttendanceEntry[]) =>
    apiFetch<AttendanceResponse>(`/games/${gameId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ attendances }),
    }),
};

// ============================================
// REPORTS API
// ============================================

export interface CreateReportRequest {
  reportedUserId?: string;
  gameId?: string;
  endorsementId?: string;
  reportType: "HARASSMENT" | "SPORTSMANSHIP" | "SAFETY" | "SPAM" | "OTHER";
  details: string;
}

export interface ReportResponse {
  reportId: string;
  reporterUserId: string;
  reportedUserId?: string;
  gameId?: string;
  endorsementId?: string;
  reportType: string;
  details: string;
  status: string;
  createdAt: string;
}

export const reportsApi = {
  create: (data: CreateReportRequest) =>
    apiFetch<ReportResponse>("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================
// NOTIFICATIONS API
// ============================================

export interface NotificationDto {
  notificationId: string;
  type: string;
  payload: string;
  status: string;
  scheduledFor: string;
  sentAt?: string;
}

export const notificationsApi = {
  getAll: () => apiFetch<NotificationDto[]>("/notifications"),

  getUnreadCount: () =>
    apiFetch<{ count: number }>("/notifications/unread-count"),

  markAsRead: (notificationId: string) =>
    apiFetch<void>(`/notifications/${notificationId}/read`, { method: "POST" }),

  markAllAsRead: () =>
    apiFetch<void>("/notifications/mark-all-read", { method: "POST" }),
};

// ============================================
// ENDORSEMENTS API
// ============================================

export interface EndorsementRequest {
  endorsedUserId: string;
  gameId: string;
}

// US 3.3 Organizer Endorsements
export interface EndorsementResponse {
  endorsementId: string;
  endorserId: string;
  endorserName: string;
  endorsedUserId: string;
  gameId: string;
  gameTitle: string;
  gameDate: string;
  label: string;
  createdAt: string;
}

// US 3.3 Organizer Endorsments
export const endorsementsApi = {
  create: (data: EndorsementRequest) =>
    apiFetch<EndorsementResponse>("/endorsements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUserEndorsements: (userId: string) =>
    apiFetch<EndorsementResponse[]>(`/users/${userId}/endorsements`),
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthApi = {
  check: () =>
    apiFetch<{ status: string; service: string; version: string }>("/health"),
};

// ============================================
// SCORE HISTORY API (US 2.7)
// ============================================

export interface ScoreHistoryEntry {
  scoreHistoryId: string;
  userId: string;
  gameId?: string;
  gameTitle?: string;
  previousScore: number;
  newScore: number;
  delta: number;
  reason: "ATTENDANCE" | "NO_SHOW" | "MANUAL_ADJUSTMENT" | "DISPUTE_RESOLVED";
  description?: string;
  createdAt: string;
  createdByUserId?: string;
  createdByDisplayName?: string;
}

export interface ScoreHistoryResponse {
  userId: string;
  displayName: string;
  currentScore: number;
  history: ScoreHistoryEntry[];
  totalEntries: number;
  currentPage: number;
  totalPages: number;
}

export interface ScoreSummary {
  userId: string;
  currentScore: number;
  attendedCount: number;
  noShowCount: number;
  gamesCount: number;
  attendanceRate: number;
}


// ============================================
// ORGANIZER QUALITY SCORE (OQS) API - US-6.1
// ============================================

export interface OqsResponse {
  userId: string;
  displayName: string;
  oqsScore: number;
  gameCompletionRate: number;
  repeatPlayerRate: number;
  totalGamesHosted: number;
  completedGames: number;
  cancelledGames: number;
  totalUniquePlayers: number;
  repeatPlayers: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  confidenceDescription: string;
  lastCalculatedAt?: string;
}

export interface OqsSummary {
  userId: string;
  oqsScore: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  totalGamesHosted: number;
}

export interface OqsHistoryEntry {
  historyId: string;
  organizerId: string;
  gameId?: string;
  gameTitle?: string;
  previousOqs: number;
  newOqs: number;
  delta: number;
  previousCompletionRate?: number;
  newCompletionRate?: number;
  previousRepeatRate?: number;
  newRepeatRate?: number;
  reason: "GAME_COMPLETED" | "GAME_CANCELLED" | "PLAYER_RETURNED" | "INITIAL_CALCULATION" | "MANUAL_ADJUSTMENT" | "RECALCULATION";
  description?: string;
  createdAt: string;
}

export interface OqsHistoryResponse {
  organizerId: string;
  displayName: string;
  currentOqs: number;
  history: OqsHistoryEntry[];
  totalEntries: number;
  currentPage: number;
  totalPages: number;
}

export interface OqsInfoCard {
  oqsScore: number;
  overallDescription: string;
  gameCompletionRate: number;
  completionRateDescription: string;
  completedGames: number;
  totalGames: number;
  repeatPlayerRate: number;
  repeatRateDescription: string;
  repeatPlayers: number;
  totalUniquePlayers: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  confidenceDescription: string;
  gamesForNextLevel: number;
}

export interface OqsWeights {
  completionRateWeight: number;
  repeatPlayerRateWeight: number;
}


export const scoreHistoryApi = {
  getHistory: (userId: string, page = 0, size = 10) =>
    apiFetch<ScoreHistoryResponse>(
      `/users/${userId}/score-history?page=${page}&size=${size}`,
    ),

  getMyHistory: (page = 0, size = 10) =>
    apiFetch<ScoreHistoryResponse>(
      `/users/me/score-history?page=${page}&size=${size}`,
    ),

  getSummary: (userId: string) =>
    apiFetch<ScoreSummary>(`/users/${userId}/score-summary`),

  getMySummary: () => apiFetch<ScoreSummary>(`/users/me/score-summary`),
};


export const organizerQualityApi = {
  // Get full OQS for a user
  getOqs: (userId: string) =>
    apiFetch<OqsResponse>(`/users/${userId}/oqs`),

  // Get OQS for current user
  getMyOqs: () =>
    apiFetch<OqsResponse>(`/users/me/oqs`),

  // Get OQS summary (simplified for game cards)
  getOqsSummary: (userId: string) =>
    apiFetch<OqsSummary>(`/users/${userId}/oqs/summary`),

  // Get OQS info card with plain language explanations
  getOqsInfoCard: (userId: string) =>
    apiFetch<OqsInfoCard>(`/users/${userId}/oqs/info`),

  // Get OQS info card for current user
  getMyOqsInfoCard: () =>
    apiFetch<OqsInfoCard>(`/users/me/oqs/info`),

  // Get OQS change history
  getOqsHistory: (userId: string, page = 0, size = 10) =>
    apiFetch<OqsHistoryResponse>(
      `/users/${userId}/oqs/history?page=${page}&size=${size}`,
    ),

  // Get OQS change history for current user
  getMyOqsHistory: (page = 0, size = 10) =>
    apiFetch<OqsHistoryResponse>(
      `/users/me/oqs/history?page=${page}&size=${size}`,
    ),

  // Get OQS calculation weights
  getWeights: () =>
    apiFetch<OqsWeights>(`/oqs/weights`),
};


export default {
  auth: authApi,
  games: gamesApi,
  attendance: attendanceApi,
  reports: reportsApi,
  notifications: notificationsApi,
  endorsements: endorsementsApi,
  health: healthApi,
  scoreHistory: scoreHistoryApi,
  organizerQuality: organizerQualityApi,
};
