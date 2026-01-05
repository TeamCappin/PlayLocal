package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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

        List<AuthDto.UserDto> users = usersPage.getContent().stream()
                .map(this::mapToUserDto)
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

    private AuthDto.UserDto mapToUserDto(User user) {
        return AuthDto.UserDto.builder()
                .userId(user.getUserId().toString())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .defaultIntensity(user.getDefaultIntensity())
                .availability(user.getAvailability())
                .bio(user.getBio())
                .location(user.getLocation())
                .reliabilityScore(user.getReliabilityScore())
                .gamesCount(user.getGamesCount())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
