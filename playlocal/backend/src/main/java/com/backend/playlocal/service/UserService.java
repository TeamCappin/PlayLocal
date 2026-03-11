package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public UserService(UserRepository userRepository, EndorsementRepository endorsementRepository,
            PrivacySettingsService privacySettingsService, FriendshipRepository friendshipRepository) {
        this.userRepository = userRepository;
        this.endorsementRepository = endorsementRepository;
        this.privacySettingsService = privacySettingsService;
        this.friendshipRepository = friendshipRepository;
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

        // US-7.12: Filter out users who have disabled profile search (self and friends always visible)
        // For users who pass search filter but have restricted profiles, return minimal data
        List<AuthDto.UserDto> users = usersPage.getContent().stream()
                .filter(user -> {
                    if (viewerId != null && viewerId.equals(user.getUserId())) {
                        return true; // Always show yourself
                    }
                    boolean isFriend = viewerId != null && friendshipRepository.areFriends(viewerId, user.getUserId());
                    return privacySettingsService.isSearchable(user.getUserId(), viewerId, isFriend);
                })
                .map(user -> {
                    if (viewerId != null && viewerId.equals(user.getUserId())) {
                        return mapToUserDto(user, endorsementCounts.getOrDefault(user.getUserId(), 0));
                    }
                    boolean isFriend = viewerId != null && friendshipRepository.areFriends(viewerId, user.getUserId());
                    if (!privacySettingsService.canViewProfile(user.getUserId(), viewerId, isFriend)) {
                        return buildRestrictedProfile(user, endorsementCounts.getOrDefault(user.getUserId(), 0));
                    }
                    return mapToUserDto(user, endorsementCounts.getOrDefault(user.getUserId(), 0));
                })
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
            String newSlug = User.generateSlug(request.getDisplayName());
            user.setSlug(ensureUniqueSlug(newSlug, user.getUserId()));
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
        if (request.getPhone() != null) {
            user.setPhoneE164(request.getPhone());
        }

        user = userRepository.save(user);
        return mapToUserDto(user);
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
        User user = userRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserDto(user);
    }

    /**
     * Get user profile by slug with privacy enforcement.
     * US-7.12: Restricts profile fields based on privacy toggles.
     */
    public AuthDto.UserDto getProfileBySlug(String slug, UUID viewerId) {
        User user = userRepository.findBySlugAndDeletedAtIsNull(slug)
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
        return AuthDto.UserDto.builder()
                .userId(user.getUserId().toString())
                .displayName(user.getDisplayName())
                .slug(user.getSlug())
                .avatarUrl(user.getAvatarUrl())
                .reliabilityScore(user.getReliabilityScore())
                .gamesCount(user.getGamesCount())
                .endorsementsCount(endorsementCount)
                .defaultIntensity(user.getDefaultIntensity())
                .profileRestricted(true)
                .build();
    }

    private String ensureUniqueSlug(String baseSlug, UUID excludeUserId) {
        String slug = baseSlug;
        int counter = 1;
        while (userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(slug, excludeUserId)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }

    private AuthDto.UserDto mapToUserDto(User user) {
        return mapToUserDto(user, null);
    }

    private AuthDto.UserDto mapToUserDto(User user, Integer preCalculatedCount) {
        int count = (preCalculatedCount != null)
                ? preCalculatedCount
                : (int) endorsementRepository.countByEndorsedUser_UserId(user.getUserId());

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
                .endorsementsCount(count)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
