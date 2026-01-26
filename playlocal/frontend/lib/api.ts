// PlayLocal API Client
// Connects the React frontend to the Spring Boot backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Token management
let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('playlocal_token') : null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
    if (token) {
        localStorage.setItem('playlocal_token', token);
    } else {
        localStorage.removeItem('playlocal_token');
    }
};

export const getAuthToken = () => authToken;

// Base fetch wrapper with auth
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorData: any = { message: 'An error occurred' };
        try {
            const text = await response.text();
            if (text) {
                errorData = JSON.parse(text);
            }
        } catch (e) {
            // If response is not JSON, use status text
            errorData = { message: response.statusText || 'An error occurred' };
        }
        throw new ApiError(response.status, errorData.message || 'An error occurred', errorData);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    try {
        return await response.json();
    } catch (e) {
        throw new ApiError(response.status, 'Invalid JSON response', { originalError: e });
    }
}

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
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
    slug?: string;  // URL-friendly identifier (e.g., "john-doe")
    avatarUrl?: string;
    defaultIntensity?: string;
    availability?: string;
    bio?: string;
    location?: string;
    reliabilityScore: number;
    gamesCount: number;
    createdAt?: string;
}

export const authApi = {
    register: (data: RegisterRequest) =>
        apiFetch<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    login: (data: LoginRequest) =>
        apiFetch<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getCurrentUser: () => apiFetch<UserDto>('/auth/me'),

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
        apiFetch<UserDto>('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    getProfile: (userId: string) =>
        apiFetch<UserDto>(`/users/${userId}/profile`),

    // Slug-based profile lookup (US 1.3 + 1.4 merge)
    getProfileBySlug: (slug: string) =>
        apiFetch<UserDto>(`/users/slug/${slug}/profile`),

    search: (query?: string, page = 0, size = 20) =>
        apiFetch<SearchUsersResponse>(`/users/search?q=${encodeURIComponent(query || '')}&page=${page}&size=${size}`),
};

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
    getFriends: () =>
        apiFetch<FriendsListResponse>('/friends'),

    sendRequest: (userId: string) =>
        apiFetch<FriendshipAction>(`/friends/request/${userId}`, { method: 'POST' }),

    acceptRequest: (friendshipId: string) =>
        apiFetch<FriendshipAction>(`/friends/${friendshipId}/accept`, { method: 'POST' }),

    declineRequest: (friendshipId: string) =>
        apiFetch<FriendshipAction>(`/friends/${friendshipId}/decline`, { method: 'POST' }),

    removeFriend: (friendshipId: string) =>
        apiFetch<FriendshipAction>(`/friends/${friendshipId}`, { method: 'DELETE' }),
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
    waitlistPosition?: number;
    reliabilityScore: number;
    joinedAt: string;
}

export const gamesApi = {
    create: (data: CreateGameRequest) =>
        apiFetch<GameResponse>('/games', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getUpcoming: () => apiFetch<GameResponse[]>('/games'),

    getById: (gameId: string) => apiFetch<GameResponse>(`/games/${gameId}`),

    getRoster: (gameId: string) => apiFetch<RosterResponse>(`/games/${gameId}/roster`),

    join: (gameId: string) =>
        apiFetch<JoinResponse>(`/games/${gameId}/join`, { method: 'POST' }),

    leave: (gameId: string) =>
        apiFetch<void>(`/games/${gameId}/leave`, { method: 'DELETE' }),
};

// ============================================
// ATTENDANCE API
// ============================================

export interface AttendanceEntry {
    participationId: string;
    attendanceStatus: 'ATTENDED' | 'NO_SHOW';
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
            method: 'POST',
            body: JSON.stringify({ attendances }),
        }),
};

// ============================================
// REPORTS API
// ============================================

export interface CreateReportRequest {
    reportedUserId?: string;
    gameId?: string;
    reportType: 'HARASSMENT' | 'SPORTSMANSHIP' | 'SAFETY' | 'SPAM' | 'OTHER';
    details: string;
}

export interface ReportResponse {
    reportId: string;
    reporterUserId: string;
    reportedUserId?: string;
    gameId?: string;
    reportType: string;
    details: string;
    status: string;
    createdAt: string;
}

export const reportsApi = {
    create: (data: CreateReportRequest) =>
        apiFetch<ReportResponse>('/reports', {
            method: 'POST',
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
    getAll: () => apiFetch<NotificationDto[]>('/notifications'),

    getUnreadCount: () =>
        apiFetch<{ count: number }>('/notifications/unread-count'),

    markAsRead: (notificationId: string) =>
        apiFetch<void>(`/notifications/${notificationId}/read`, { method: 'POST' }),

    markAllAsRead: () =>
        apiFetch<void>('/notifications/mark-all-read', { method: 'POST' }),
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthApi = {
    check: () => apiFetch<{ status: string; service: string; version: string }>('/health'),
};

export default {
    auth: authApi,
    games: gamesApi,
    attendance: attendanceApi,
    reports: reportsApi,
    notifications: notificationsApi,
    health: healthApi,
};
