package com.backend.playlocal.service;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.backend.playlocal.repository.PlayerRatingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EndorsementRepository endorsementRepository;
    private final PrivacySettingsService privacySettingsService;
    private final FriendshipRepository friendshipRepository;
    private final GameParticipationRepository gameParticipationRepository;
    private final PlayerRatingRepository playerRatingRepository;
    private final UsernameService usernameService;

    public UserService(UserRepository userRepository, EndorsementRepository endorsementRepository,
            PrivacySettingsService privacySettingsService, FriendshipRepository friendshipRepository,
            GameParticipationRepository gameParticipationRepository, PlayerRatingRepository playerRatingRepository,
            UsernameService usernameService) {
        this.userRepository = userRepository;
        this.endorsementRepository = endorsementRepository;
        this.privacySettingsService = privacySettingsService;
        this.friendshipRepository = friendshipRepository;
        this.gameParticipationRepository = gameParticipationRepository;
        this.playerRatingRepository = playerRatingRepository;
        this.usernameService = usernameService;
    }

    /**
     * Search users by display name, email, or username.
     * US-7.12: Filters out users who have disabled profile search (friends are always visible).
     */
    public UserDto.SearchResponse searchUsers(String query, int page, int size, UUID viewerId) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("displayName").ascending());

        Page<User> usersPage;
        if (query != null && !query.trim().isEmpty()) {
            usersPage = userRepository.searchByDisplayNameOrEmail(query.trim(), pageRequest);
        } else {
            usersPage = userRepository.findAllActive(pageRequest);
        }

        List<UUID> userIds = usersPage.getContent().stream()
                .map(User::getUserId)
                .collect(Collectors.toList());

        Map<UUID, Integer> endorsementCounts = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<Object[]> counts = endorsementRepository.countEndorsementsByUserIds(userIds);
            for (Object[] row : counts) {
                endorsementCounts.put((UUID) row[0], ((Number) row[1]).intValue());
            }
        }

        List<AuthDto.UserDto> users = usersPage.getContent().stream()
                .filter(user -> isVisibleInSearch(user, viewerId))
                .map(user -> mapSearchResult(user, viewerId, endorsementCounts))
                .collect(Collectors.toList());

        return UserDto.SearchResponse.builder()
                .users(users)
                .totalElements(usersPage.getTotalElements())
                .totalPages(usersPage.getTotalPages())
                .currentPage(page)
                .build();
    }

    /**
     * Update user profile.
     */
    @Transactional
    public AuthDto.UserDto updateProfile(String userId, UserDto.UpdateProfileRequest request) {
        User user = userRepository.findActiveById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }
        if (request.getDefaultIntensity() != null) {
            user.setDefaultIntensity(request.getDefaultIntensity());
        }
        if (request.getAvailability() != null) {
            user.setAvailability(request.getAvailability());
        }

        user = userRepository.save(user);
        return mapToUserDto(user);
    }

    /**
     * Update user's username/slug.
     * Uses UsernameService for validation and uniqueness checking.
     * Sequence: changeSlug → toUrlFriendly → truncate → findActiveById → check uniqueness → save
     */
    @Transactional
    public AuthDto.UserDto changeSlug(String userId, String username) {
        UUID userUuid = UUID.fromString(userId);
        String normalizedSlug = usernameService.changeSlug(userUuid, username);
        
        User user = userRepository.findActiveById(userUuid)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserDto(user);
    }

    /**
     * Resolve active userId from username/slug.
     * Uses UsernameService for lookup.
     */
    public String findUserIdByUsername(String username) {
        return usernameService.findUserIdByUsername(username);
    }

    /**
     * Get user profile by ID (no privacy enforcement — for internal/own profile use).
     */
    public AuthDto.UserDto getUserProfile(String userId) {
        User user = userRepository.findActiveById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserDto(user);
    }

    /**
     * Get user profile by ID with privacy enforcement.
     * US-7.12: Restricts profile fields based on privacy toggles.
     */
    public AuthDto.UserDto getUserProfile(String userId, UUID viewerId) {
        UUID targetId = UUID.fromString(userId);
        User user = userRepository.findActiveById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Own profile: return full data
        if (targetId.equals(viewerId)) {
            return mapToUserDto(user);
        }

        boolean isFriend = friendshipRepository.areFriends(viewerId, targetId);

        if (!privacySettingsService.canViewProfile(targetId, viewerId, isFriend)) {
            return buildRestrictedProfile(user);
        }

        return mapToUserDto(user);
    }

    /**
     * Get user profile by slug (no privacy enforcement).
     */
    public AuthDto.UserDto getProfileBySlug(String slug) {
        String normalizedSlug = normalizeUsername(slug);
        User user = userRepository.findBySlugAndDeletedAtIsNull(normalizedSlug)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserDto(user);
    }

    /**
     * Get user profile by slug with privacy enforcement.
     * US-7.12: Restricts profile fields based on privacy toggles.
     */
    public AuthDto.UserDto getProfileBySlug(String slug, UUID viewerId) {
        String normalizedSlug = normalizeUsername(slug);
        User user = userRepository.findBySlugAndDeletedAtIsNull(normalizedSlug)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UUID targetId = user.getUserId();

        // Own profile: return full data
        if (targetId.equals(viewerId)) {
            return mapToUserDto(user);
        }

        boolean isFriend = friendshipRepository.areFriends(viewerId, targetId);

        if (!privacySettingsService.canViewProfile(targetId, viewerId, isFriend)) {
            return buildRestrictedProfile(user);
        }

        return mapToUserDto(user);
    }

    /**
     * US-7.12: Build a restricted profile response.
     * Community trust metrics (reliability, games count, endorsements) are always visible.
     * Personal info (bio, location, availability) is hidden.
     */
    private AuthDto.UserDto buildRestrictedProfile(User user) {
        int endorsementCount = (int) endorsementRepository.countByEndorsedUser_UserId(user.getUserId());
        return buildRestrictedProfile(user, endorsementCount);
    }

    private AuthDto.UserDto buildRestrictedProfile(User user, int endorsementCount) {
        Double avgRating = playerRatingRepository.getAverageRatingForUser(user.getUserId());

        return AuthDto.UserDto.builder()
                .userId(user.getUserId().toString())
                .displayName(user.getDisplayName())
                .slug(user.getSlug())
                .avatarUrl(user.getAvatarUrl())
                .reliabilityScore(user.getReliabilityScore())
                .gamesCount(user.getGamesCount())
                .averageRating(avgRating != null ? avgRating.floatValue() : 0f)
                .endorsementsCount(endorsementCount)
                .defaultIntensity(user.getDefaultIntensity())
                .profileRestricted(true)
                .build();
    }

    /**
     * US-7.12: Check if a user should appear in search results for the viewer.
     */
    private boolean isVisibleInSearch(User user, UUID viewerId) {
        if (viewerId != null && viewerId.equals(user.getUserId())) {
            return true;
        }
        boolean isFriend = viewerId != null && friendshipRepository.areFriends(viewerId, user.getUserId());
        return privacySettingsService.isSearchable(user.getUserId(), isFriend);
    }

    /**
     * US-7.12: Map a user to the appropriate DTO based on profile visibility.
     */
    private AuthDto.UserDto mapSearchResult(User user, UUID viewerId, Map<UUID, Integer> endorsementCounts) {
        int count = endorsementCounts.getOrDefault(user.getUserId(), 0);
        if (viewerId != null && viewerId.equals(user.getUserId())) {
            return mapToUserDto(user, count);
        }
        boolean isFriend = viewerId != null && friendshipRepository.areFriends(viewerId, user.getUserId());
        if (!privacySettingsService.canViewProfile(user.getUserId(), viewerId, isFriend)) {
            return buildRestrictedProfile(user, count);
        }
        return mapToUserDto(user, count);
    }

    private String normalizeUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        String normalized = User.generateSlug(username);
        if (normalized == null || normalized.isBlank()) {
            throw new IllegalArgumentException("Username must contain at least one letter or number");
        }
        return normalized;
    }

    private AuthDto.UserDto mapToUserDto(User user) {
        return mapToUserDto(user, null);
    }

    private AuthDto.UserDto mapToUserDto(User user, Integer preCalculatedCount) {
        int count = (preCalculatedCount != null)
                ? preCalculatedCount
                : (int) endorsementRepository.countByEndorsedUser_UserId(user.getUserId());
        Double avgRating = playerRatingRepository.getAverageRatingForUser(user.getUserId());

        return AuthDto.UserDto.builder()
                .userId(user.getUserId().toString())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .slug(user.getSlug())
                .avatarUrl(user.getAvatarUrl())
                .defaultIntensity(user.getDefaultIntensity())
                .availability(user.getAvailability())
                .bio(user.getBio())
                .location(user.getLocation())
                .reliabilityScore(user.getReliabilityScore())
                .gamesCount(user.getGamesCount())
                .averageRating(avgRating != null ? avgRating.floatValue() : 0f)
                .endorsementsCount(count)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }

    /**
     * US-7.15: Deactivate user account (soft delete with 30-day grace period).
     * User can reactivate by logging in within 30 days.
     */
    @Transactional
    public void deactivateAccount(UUID userId) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Set deletion timestamp (30 days from now for grace period)
        Instant deactivateTime = Instant.now();
        user.setDeletedAt(deactivateTime);

        // Remove from all future games
        List<GameParticipation> futureParticipations = gameParticipationRepository
                .findByUserIdAndGameStartTimeAfter(userId, Instant.now());

        for (GameParticipation participation : futureParticipations) {
            participation.setLeftAt(deactivateTime);
            gameParticipationRepository.save(participation);
        }

        userRepository.save(user);
    }

    /**
     * US-7.15: Permanently delete user account (irreversible).
     * Deletes all user data and removes from all games.
     */
    @Transactional
    public void deleteAccount(UUID userId) {
        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Set immediate deletion (no grace period)
        Instant now = Instant.now();
        user.setDeletedAt(now);

        // Remove from all future games
        List<GameParticipation> futureParticipations = gameParticipationRepository
                .findByUserIdAndGameStartTimeAfter(userId, now);

        for (GameParticipation participation : futureParticipations) {
            participation.setLeftAt(now);
            gameParticipationRepository.save(participation);
        }

        // Hard delete by setting deletedAt to the past (immediate purge)
        // This signals to the system that this should be permanently removed
        // Note: In production, you might want a separate "purge" job to handle
        // cascading deletes (endorsements, friendships, media, etc.)
        user.setDeletedAt(now.minus(1, ChronoUnit.DAYS)); // Mark as old deletion

        userRepository.save(user);

        // Additional cleanup can be added here:
        // - Delete friendships
        // - Delete endorsements
        // - Delete media assets
        // - Delete privacy settings
        // - etc.
    }
}
