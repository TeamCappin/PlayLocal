package com.backend.playlocal.unit;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AuthDto;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.service.UsernameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UsernameService slug generation and lookup.
 * Tests the sequence diagram flows for issue #364:
 * - Registration: generate username/slug
 * - Edit username/slug after registration
 * - Username lookup API
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UsernameService Tests")
class UsernameServiceTest {

    @Mock
    private UserRepository userRepository;

    private UsernameService usernameService;

    @BeforeEach
    void setUp() {
        usernameService = new UsernameService(userRepository);
    }

    // ==================== Registration: generate username/slug ====================

    @Test
    @DisplayName("generateSlug should produce SHA-256 based deterministic slug")
    void generateSlug_WithValidInputs_ReturnsDeterministicSlug() {
        String displayName = "John Doe";
        String email = "john@example.com";

        when(userRepository.existsBySlugAndDeletedAtIsNull(anyString())).thenReturn(false);

        String slug = usernameService.generateSlug(displayName, email);

        assertNotNull(slug);
        assertFalse(slug.isBlank());
        assertTrue(slug.length() <= User.MAX_SLUG_LENGTH);
        assertTrue(slug.startsWith("john-doe-"));
        // Verify it's deterministic - same inputs produce same slug
        when(userRepository.existsBySlugAndDeletedAtIsNull(slug)).thenReturn(false);
        String slug2 = usernameService.generateSlug(displayName, email);
        assertEquals(slug, slug2);
    }

    @Test
    @DisplayName("generateSlug should handle SHA-256 digest with wraparound slicing")
    void generateSlug_WithSha256_UsesNonceOffsetSlicing() {
        String displayName = "Alice Smith";
        String email = "alice@test.com";

        when(userRepository.existsBySlugAndDeletedAtIsNull(anyString())).thenReturn(false);

        String slug1 = usernameService.generateSlug(displayName, email);
        assertNotNull(slug1);
        assertTrue(slug1.length() <= User.MAX_SLUG_LENGTH);
    }

    @Test
    @DisplayName("generateSlug should handle slug collisions by incrementing nonce")
    void generateSlug_WithCollision_RetriesWithNextNonce() {
        String displayName = "Bob Johnson";
        String email = "bob@collision.com";

        // First call returns true (collision), second returns false (available)
        when(userRepository.existsBySlugAndDeletedAtIsNull(anyString()))
                .thenReturn(true)  // First attempt collides
                .thenReturn(false); // Second attempt succeeds

        String slug = usernameService.generateSlug(displayName, email);

        assertNotNull(slug);
        assertTrue(slug.length() <= User.MAX_SLUG_LENGTH);
        // Verify existsBySlug was called at least twice
        verify(userRepository, atLeast(2)).existsBySlugAndDeletedAtIsNull(anyString());
    }

    @Test
    @DisplayName("generateSlug should truncate to 32 characters maximum")
    void generateSlug_LongName_TruncatesToMaxLength() {
        String displayName = "ThisIsAVeryLongDisplayNameThatShouldBeTruncatedTo32CharacterLimit";
        String email = "long@example.com";

        when(userRepository.existsBySlugAndDeletedAtIsNull(anyString())).thenReturn(false);

        String slug = usernameService.generateSlug(displayName, email);

        assertNotNull(slug);
        // The actual slug length is determined by SLICE_LENGTH (8 chars from SHA-256 digest)
        assertTrue(slug.length() <= User.MAX_SLUG_LENGTH);
        // Slug will be at most 32 characters but typically 8 (SLICE_LENGTH)
        assertTrue(slug.length() > 0);
    }

    @Test
    @DisplayName("generateSlug should throw IllegalArgumentException for null displayName")
    void generateSlug_NullDisplayName_ThrowsException() {
        assertThrows(IllegalArgumentException.class,
                () -> usernameService.generateSlug(null, "email@test.com"));
    }

    @Test
    @DisplayName("generateSlug should throw IllegalArgumentException for null email")
    void generateSlug_NullEmail_ThrowsException() {
        assertThrows(IllegalArgumentException.class,
                () -> usernameService.generateSlug("John Doe", null));
    }

    @Test
    @DisplayName("generateSlug should throw IllegalArgumentException for blank email")
    void generateSlug_BlankEmail_ThrowsException() {
        assertThrows(IllegalArgumentException.class,
                () -> usernameService.generateSlug("John Doe", "   "));
    }

    @Test
    @DisplayName("generateSlug should throw IllegalArgumentException for blank displayName")
    void generateSlug_BlankDisplayName_ThrowsException() {
        assertThrows(IllegalArgumentException.class,
                () -> usernameService.generateSlug("   ", "email@test.com"));
    }

    @Test
    @DisplayName("generateSlug should throw IllegalArgumentException when displayName normalizes to blank")
    void generateSlug_DisplayNameWithoutAlnum_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> usernameService.generateSlug("!!!@@@", "email@test.com"));

        assertEquals("Display name must contain at least one letter or number", exception.getMessage());
    }

        @Test
        @DisplayName("generateSlug should throw after max collision attempts")
        void generateSlug_AllAttemptsCollide_ThrowsRuntimeException() {
        when(userRepository.existsBySlugAndDeletedAtIsNull(anyString()))
            .thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> usernameService.generateSlug("Collision User", "collision@test.com"));

        assertTrue(ex.getMessage().contains("Failed to generate unique slug"));
        verify(userRepository, times(1000)).existsBySlugAndDeletedAtIsNull(anyString());
        }

    // ==================== Edit username/slug after registration ====================

    @Test
    @DisplayName("changeSlug should update slug for active user")
    void changeSlug_ValidUser_UpdatesSlug() {
        UUID userId = UUID.randomUUID();
        String newSlug = "new-username";
        User user = User.builder()
                .userId(userId)
                .slug("old-slug")
                .email("user@example.com")
                .displayName("John Doe")
                .build();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(anyString(), eq(userId)))
                .thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        AuthDto.UserDto result = usernameService.changeSlug(userId, newSlug);

        assertNotNull(result);
        assertEquals("new-username", result.getSlug());
        verify(userRepository).findActiveById(userId);
        verify(userRepository).existsBySlugAndUserIdNotAndDeletedAtIsNull(anyString(), eq(userId));
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("changeSlug should normalize slug (toUrlFriendly)")
    void changeSlug_SpecialCharacters_NormalizesSlug() {
        UUID userId = UUID.randomUUID();
        String newSlug = "New User@Name!123"; // Has special characters
        User user = User.builder()
                .userId(userId)
                .slug("old-slug")
                .email("user@example.com")
                .displayName("John Doe")
                .build();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(anyString(), eq(userId)))
                .thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        AuthDto.UserDto result = usernameService.changeSlug(userId, newSlug);

        // Result should be URL-friendly (lowercase, hyphens)
        assertFalse(result.getSlug().contains("@"));
        assertFalse(result.getSlug().contains("!"));
        assertTrue(result.getSlug().matches("[a-z0-9-]*"));
    }

    @Test
    @DisplayName("changeSlug should throw 409 Conflict for duplicate slug")
    void changeSlug_DuplicateSlug_ThrowsDuplicateResourceException() {
        UUID userId = UUID.randomUUID();
        String newSlug = "existing-username";
        User user = User.builder()
                .userId(userId)
                .slug("old-slug")
                .email("user@example.com")
                .displayName("John Doe")
                .build();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(anyString(), eq(userId)))
                .thenReturn(true); // Slug already in use

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class,
                () -> usernameService.changeSlug(userId, newSlug));

        assertEquals("Username already in use", exception.getMessage());
    }

    @Test
    @DisplayName("changeSlug should throw 404 Not Found for inactive user")
    void changeSlug_UserNotFound_ThrowsResourceNotFoundException() {
        UUID userId = UUID.randomUUID();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> usernameService.changeSlug(userId, "new-slug"));

        assertEquals("User not found", exception.getMessage());
    }

    @Test
    @DisplayName("changeSlug should throw exception for blank slug")
    void changeSlug_BlankSlug_ThrowsException() {
        UUID userId = UUID.randomUUID();

        assertThrows(IllegalArgumentException.class,
                () -> usernameService.changeSlug(userId, "   "));
    }

        @Test
        @DisplayName("changeSlug should throw exception for null slug")
        void changeSlug_NullSlug_ThrowsException() {
        UUID userId = UUID.randomUUID();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> usernameService.changeSlug(userId, null));

        assertEquals("Slug is required", exception.getMessage());
        }

        @Test
        @DisplayName("changeSlug should throw exception when normalized slug is blank")
        void changeSlug_SlugWithoutAlnum_ThrowsException() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
            .userId(userId)
            .slug("old-slug")
            .email("user@example.com")
            .displayName("John Doe")
            .build();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> usernameService.changeSlug(userId, "!!!@@@"));

        assertEquals("Slug must contain at least one letter or number", exception.getMessage());
        }

        @Test
        @DisplayName("changeSlug should truncate and trim trailing hyphen after normalization")
        void changeSlug_NormalizedValueEndsWithHyphenAfterTruncate_TrimsHyphen() {
        UUID userId = UUID.randomUUID();
        String longSlug = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!!b";
        User user = User.builder()
            .userId(userId)
            .slug("old-slug")
            .email("user@example.com")
            .displayName("John Doe")
            .build();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(anyString(), eq(userId)))
            .thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        AuthDto.UserDto result = usernameService.changeSlug(userId, longSlug);

        assertNotNull(result);
        assertEquals("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", result.getSlug());
        assertFalse(result.getSlug().endsWith("-"));
        assertTrue(result.getSlug().length() <= User.MAX_SLUG_LENGTH);
        }

    // ==================== Username lookup API ====================

    @Test
    @DisplayName("findUserIdByUsername should return userId for valid username")
    void findUserIdByUsername_ValidUsername_ReturnsUserId() {
        String username = "john-doe";
        UUID expectedUserId = UUID.randomUUID();
        User user = User.builder()
                .userId(expectedUserId)
                .slug(username)
                .email("john@example.com")
                .displayName("John Doe")
                .build();

        when(userRepository.findBySlugAndDeletedAtIsNull(username))
                .thenReturn(Optional.of(user));

        String result = usernameService.findUserIdByUsername(username);

        assertEquals(expectedUserId.toString(), result);
        verify(userRepository).findBySlugAndDeletedAtIsNull(username);
    }

    @Test
    @DisplayName("findUserIdByUsername should normalize username (toUrlFriendly)")
    void findUserIdByUsername_SpecialCharacters_NormalizesBeforeLookup() {
        String username = "John@Doe!"; // Will be normalized to "john-doe"
        UUID expectedUserId = UUID.randomUUID();
        User user = User.builder()
                .userId(expectedUserId)
                .slug("john-doe")
                .email("john@example.com")
                .displayName("John Doe")
                .build();

        when(userRepository.findBySlugAndDeletedAtIsNull("john-doe"))
                .thenReturn(Optional.of(user));

        String result = usernameService.findUserIdByUsername(username);

        assertEquals(expectedUserId.toString(), result);
        verify(userRepository).findBySlugAndDeletedAtIsNull("john-doe");
    }

    @Test
    @DisplayName("findUserIdByUsername should throw 404 Not Found for missing user")
    void findUserIdByUsername_UserNotFound_ThrowsResourceNotFoundException() {
        String username = "nonexistent";

        when(userRepository.findBySlugAndDeletedAtIsNull(username))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> usernameService.findUserIdByUsername(username));

        assertEquals("User not found", exception.getMessage());
    }

    @Test
    @DisplayName("findUserIdByUsername should throw exception for blank username")
    void findUserIdByUsername_BlankUsername_ThrowsException() {
        assertThrows(IllegalArgumentException.class,
                () -> usernameService.findUserIdByUsername("   "));
    }

    @Test
    @DisplayName("findUserIdByUsername should throw exception for null username")
    void findUserIdByUsername_NullUsername_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> usernameService.findUserIdByUsername(null));

        assertEquals("Username is required", exception.getMessage());
    }

    @Test
    @DisplayName("normalizeUsernameOrThrow should reject input with no letters or numbers")
    void normalizeUsernameOrThrow_NoAlnum_ThrowsException() {
        assertThrows(IllegalArgumentException.class,
                () -> usernameService.normalizeUsernameOrThrow("!!!@@@"));
    }

    @Test
    @DisplayName("normalizeUsernameOrThrow should reject null username")
    void normalizeUsernameOrThrow_Null_ThrowsException() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> usernameService.normalizeUsernameOrThrow(null));

        assertEquals("Username is required", exception.getMessage());
    }

    @Test
    @DisplayName("changeSlug should map user fields and non-null createdAt to dto")
    void changeSlug_MapsAllDtoFields_WithCreatedAt() {
        UUID userId = UUID.randomUUID();
        Instant createdAt = Instant.parse("2026-01-01T10:15:30Z");

        User user = User.builder()
                .userId(userId)
                .slug("old-slug")
                .email("user@example.com")
                .displayName("John Doe")
                .avatarUrl("https://cdn.example.com/avatar.png")
                .defaultIntensity("MEDIUM")
                .availability("weekends")
                .bio("Hello")
                .location("Montreal")
                .reliabilityScore(97.5f)
                .gamesCount(42)
                .createdAt(createdAt)
                .build();

        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsBySlugAndUserIdNotAndDeletedAtIsNull(anyString(), eq(userId)))
                .thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        AuthDto.UserDto result = usernameService.changeSlug(userId, "new-slug");

        assertNotNull(result);
        assertEquals(userId.toString(), result.getUserId());
        assertEquals("user@example.com", result.getEmail());
        assertEquals("John Doe", result.getDisplayName());
        assertEquals("new-slug", result.getSlug());
        assertEquals("https://cdn.example.com/avatar.png", result.getAvatarUrl());
        assertEquals("MEDIUM", result.getDefaultIntensity());
        assertEquals("weekends", result.getAvailability());
        assertEquals("Hello", result.getBio());
        assertEquals("Montreal", result.getLocation());
        assertEquals(97.5f, result.getReliabilityScore());
        assertEquals(42, result.getGamesCount());
        assertEquals(createdAt.toString(), result.getCreatedAt());
    }

    @Test
    @DisplayName("buildDeactivatedSlug should fallback when displayName is null")
    void buildDeactivatedSlug_NullDisplayName_FallbacksToId() {
        UUID userId = UUID.randomUUID();

        String slug = usernameService.buildDeactivatedSlug(userId, null);

        assertNotNull(slug);
        assertTrue(slug.startsWith("deleted-"));
        assertEquals(32, slug.length());
    }

    @Test
    @DisplayName("sliceWithWraparound should return empty for invalid input and wrap correctly")
    void sliceWithWraparound_CoversEdgeCases() throws Exception {
        Method method = UsernameService.class.getDeclaredMethod(
                "sliceWithWraparound", String.class, int.class, int.class);
        method.setAccessible(true);

        assertEquals("", method.invoke(usernameService, (String) null, 0, 8));
        assertEquals("", method.invoke(usernameService, "", 0, 8));
        assertEquals("", method.invoke(usernameService, "abcd", 1, 0));
        assertEquals("dabcd", method.invoke(usernameService, "abcd", 3, 5));
    }

    @Test
    @DisplayName("truncate should cover null, no-op, and truncation paths")
    void truncate_CoversAllBranches() throws Exception {
        Method method = UsernameService.class.getDeclaredMethod(
                "truncate", String.class, int.class);
        method.setAccessible(true);

        assertNull(method.invoke(usernameService, (String) null, 5));
        assertEquals("abc", method.invoke(usernameService, "abc", 5));
        assertEquals("abc", method.invoke(usernameService, "abcdef", 3));
    }

    @Test
    @DisplayName("trimTrailingHyphens should cover null, empty, unchanged and trimmed cases")
    void trimTrailingHyphens_CoversAllBranches() throws Exception {
        Method method = UsernameService.class.getDeclaredMethod(
                "trimTrailingHyphens", String.class);
        method.setAccessible(true);

        assertNull(method.invoke(usernameService, (String) null));
        assertEquals("", method.invoke(usernameService, ""));
        assertEquals("abc", method.invoke(usernameService, "abc"));
        assertEquals("abc", method.invoke(usernameService, "abc---"));
        assertEquals("", method.invoke(usernameService, "---"));
    }

    // ==================== Edge cases ====================

    @Test
    @DisplayName("generateSlug should handle email with special characters")
    void generateSlug_EmailWithSpecialChars_StillGeneratesSlug() {
        String displayName = "Test User";
        String email = "test+tag@sub.example.com";

        when(userRepository.existsBySlugAndDeletedAtIsNull(anyString())).thenReturn(false);

        String slug = usernameService.generateSlug(displayName, email);

        assertNotNull(slug);
        assertTrue(slug.length() <= User.MAX_SLUG_LENGTH);
    }

    @Test
    @DisplayName("generateSlug should be consistent across invocations with same email")
    void generateSlug_SameEmail_GeneratesSameSlug() {
        String displayName = "Consistent User";
        String email = "consistent@example.com";

        when(userRepository.existsBySlugAndDeletedAtIsNull(anyString())).thenReturn(false);

        String slug1 = usernameService.generateSlug(displayName, email);
        String slug2 = usernameService.generateSlug(displayName, email);

        assertEquals(slug1, slug2, "Same email should produce same slug");
    }

    @Test
    @DisplayName("generateSlug should produce different slugs for different emails")
    void generateSlug_DifferentEmails_GeneratesDifferentSlugs() {
        String displayName = "Test User";
        String email1 = "user1@example.com";
        String email2 = "user2@example.com";

        when(userRepository.existsBySlugAndDeletedAtIsNull(anyString())).thenReturn(false);

        String slug1 = usernameService.generateSlug(displayName, email1);
        String slug2 = usernameService.generateSlug(displayName, email2);

        assertNotEquals(slug1, slug2, "Different emails should produce different slugs");
    }

    @Test
    @DisplayName("buildDeactivatedSlug includes normalized display name and is max 32 chars")
    void buildDeactivatedSlug_WithDisplayName_FormatsCorrectly() {
        UUID userId = UUID.randomUUID();
        String displayName = "John Deleted";

        String slug = usernameService.buildDeactivatedSlug(userId, displayName);

        assertNotNull(slug);
        assertTrue(slug.startsWith("deleted-"));
        assertTrue(slug.length() <= User.MAX_SLUG_LENGTH);
        assertTrue(slug.contains("john-deleted") || slug.contains("john-delet"));
    }

    @Test
    @DisplayName("buildDeactivatedSlug falls back to id when displayName empty")
    void buildDeactivatedSlug_NoDisplayName_FallbacksToId() {
        UUID userId = UUID.randomUUID();

        String slug = usernameService.buildDeactivatedSlug(userId, "   ");

        assertNotNull(slug);
        assertTrue(slug.startsWith("deleted-"));
        assertEquals(32, slug.length());
    }
}
