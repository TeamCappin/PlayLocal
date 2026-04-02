package com.backend.playlocal.service;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

/**
 * Service for username/slug generation, validation, and lookup.
 * Implements issue #364: username/slug generation, lookup, and slug edit.
 * 
 * Slug generation uses SHA-256 hashing with nonce-based offset calculation
 * for deterministic yet unique slug generation from display name and email.
 */
@Service
public class UsernameService {

    private final UserRepository userRepository;
    private static final int NONCE_START = 0;
    private static final int SLICE_LENGTH = 8;
    private static final String SLUG_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";

    public UsernameService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Generate a unique slug from display name and email using SHA-256 hashing with nonce.
     * 
     * Algorithm:
     * 1. Convert displayName to URL-friendly format (lowercase, hyphens)
     * 2. For each nonce increment (starting at 0):
     *    - Compute SHA-256(email + nonce)
     *    - Calculate offset = nonce % digestLength
     *    - Slice 8 characters from digest at offset with wraparound
     *    - Truncate result to 32 characters (MAX_SLUG_LENGTH)
     *    - Check if slug is unique; if yes, return it; if no, increment nonce and retry
     * 
     * @param displayName  User's display name for URL-friendly prefix
     * @param email        User's email for deterministic hashing
     * @return             A unique slug <= 32 characters
     * @throws IllegalArgumentException if displayName or email is null/empty
     */
    public String generateSlug(String displayName, String email) {
        if (displayName == null || displayName.trim().isEmpty()) {
            throw new IllegalArgumentException("Display name is required");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        // Step 1: Convert displayName to URL-friendly format
        String urlFriendlyName = toUrlFriendly(displayName);
        if (urlFriendlyName == null || urlFriendlyName.isBlank()) {
            urlFriendlyName = "user"; // Fallback for names with no alphanumeric chars
        }

        // Step 2: Try nonces until we find a unique slug
        int nonce = NONCE_START;
        int maxAttempts = 1000; // Prevent infinite loop

        while (nonce < maxAttempts) {
            // Compute SHA-256(email + nonce)
            String digest = computeSha256Digest(email, nonce);
            if (digest == null || digest.isEmpty()) {
                nonce++;
                continue;
            }

            // Calculate offset: nonce % digestLength
            int offset = nonce % digest.length();

            // Slice 8 characters from digest at offset with wraparound
            String slice = sliceWithWraparound(digest, offset, SLICE_LENGTH);

            // Truncate to 32 characters
            String slug = truncate(slice, User.MAX_SLUG_LENGTH);

            // Check uniqueness
            if (!userRepository.existsBySlug(slug)) {
                return slug;
            }

            nonce++;
        }

        // Fallback: if all nonces exhausted, use random suffix
        throw new RuntimeException("Failed to generate unique slug after " + maxAttempts + " attempts");
    }

    /**
     * Change a user's slug with uniqueness validation and soft edit.
     * 
     * @param userId      User's UUID
     * @param newSlug     New slug (will be URL-normalized)
     * @return            The updated user's slug
     * @throws ResourceNotFoundException if user not found
     * @throws DuplicateResourceException if slug is already in use by another user
     */
    @Transactional
    public String changeSlug(UUID userId, String newSlug) {
        if (newSlug == null || newSlug.trim().isEmpty()) {
            throw new IllegalArgumentException("Slug is required");
        }

        User user = userRepository.findActiveById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String normalizedSlug = toUrlFriendly(newSlug);
        if (normalizedSlug == null || normalizedSlug.isBlank()) {
            throw new IllegalArgumentException("Slug must contain at least one letter or number");
        }

        // Truncate to max length
        normalizedSlug = truncate(normalizedSlug, User.MAX_SLUG_LENGTH);

        // Check if the slug is already in use by another user
        if (userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(normalizedSlug, userId)) {
            throw new DuplicateResourceException("Username already in use");
        }

        user.setSlug(normalizedSlug);
        userRepository.save(user);
        return normalizedSlug;
    }

    /**
     * Lookup a user by username/slug.
     * 
     * @param username    Username or slug to look up
     * @return            User ID as String
     * @throws ResourceNotFoundException if user not found
     */
    public String findUserIdByUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }

        String normalizedUsername = toUrlFriendly(username);
        if (normalizedUsername == null || normalizedUsername.isBlank()) {
            throw new IllegalArgumentException("Username must contain at least one letter or number");
        }

        User user = userRepository.findBySlugAndDeletedAtIsNull(normalizedUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return user.getUserId().toString();
    }

    /**
     * Convert a string to URL-friendly format (lowercase, hyphens, no special chars).
     */
    private String toUrlFriendly(String input) {
        if (input == null) return null;
        return input.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-)|(-$)", "")    // Remove leading/trailing hyphens
                .replaceAll("-+", "-");          // Collapse multiple hyphens
    }

    /**
     * Compute SHA-256 hash of (email + nonce) and convert to hex string.
     */
    private String computeSha256Digest(String email, int nonce) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String input = email + nonce;
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Convert byte array to hexadecimal string.
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * Slice a string with wraparound.
     * 
     * @param str      String to slice from
     * @param offset   Starting offset
     * @param length   Number of characters to slice
     * @return         Sliced string with wraparound if necessary
     */
    private String sliceWithWraparound(String str, int offset, int length) {
        if (str == null || str.isEmpty() || length <= 0) {
            return "";
        }

        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            int index = (offset + i) % str.length();
            result.append(str.charAt(index));
        }
        return result.toString();
    }

    /**
     * Truncate a string to maximum length.
     */
    private String truncate(String str, int maxLength) {
        if (str == null) return null;
        if (str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength);
    }
}
