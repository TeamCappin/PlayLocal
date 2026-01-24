package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.EndorsementRepository; // Import EndorsementRepository for endorsements count [US-3.3]
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

    public UserService(UserRepository userRepository, EndorsementRepository endorsementRepository) {
        this.userRepository = userRepository;
        this.endorsementRepository = endorsementRepository;
    }

    /**
     * Search users by display name or email.
     */
    public UserDto.SearchResponse searchUsers(String query, int page, int size) {
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
                .map(user -> mapToUserDto(user, endorsementCounts.getOrDefault(user.getUserId(), 0)))
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

        // Update fields if provided
        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
            // Regenerate slug when display name changes
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
     * Get user profile by ID.
     */
    public AuthDto.UserDto getUserProfile(String userId) {
        User user = userRepository.findActiveById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserDto(user);
    }

    /**
     * Get user profile by slug (URL-friendly display name).
     */
    public AuthDto.UserDto getProfileBySlug(String slug) {
        User user = userRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserDto(user);
    }

    /**
     * Ensure slug is unique by appending counter if needed.
     */
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
