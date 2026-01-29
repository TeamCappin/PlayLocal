package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GameService tag functionality - US-4.2: Community-Specific Game Filters
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("US-4.2: GameService Tag Tests")
class GameServiceTagTest {

    @Mock
    private GameRepository gameRepository;
    @Mock
    private GameParticipationRepository participationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SportRepository sportRepository;
    @Mock
    private LocationRepository locationRepository;
    @Mock
    private GameVisibilityRepository gameVisibilityRepository;
    @Mock
    private EndorsementRepository endorsementRepository;
    @Mock
    private GameTagRepository tagRepository;
    @Mock
    private GameTagAssignmentRepository tagAssignmentRepository;
    @Mock
    private GameTagConfirmationRepository tagConfirmationRepository;

    @InjectMocks
    private GameService gameService;

    private User testUser;
    private Game testGame;
    private GameTag womenTag;
    private GameTag casualTag;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .userId(UUID.randomUUID())
                .displayName("Test User")
                .email("test@example.com")
                .reliabilityScore(85.0f)
                .ageConfirmedAt(Instant.parse("1995-01-01T00:00:00Z"))
                .build();

        testGame = Game.builder()
                .gameId(UUID.randomUUID())
                .title("Test Game")
                .createdBy(testUser)
                .sport(Sport.builder().name("Basketball").build())
                .startTime(Instant.now().plusSeconds(3600))
                .maxPlayers(10)
                .minPlayers(4)
                .build();

        womenTag = GameTag.builder()
                .tagId(UUID.randomUUID())
                .name("women")
                .tagType("system")
                .isSystemTag(true)
                .isRestricted(true)
                .build();

        casualTag = GameTag.builder()
                .tagId(UUID.randomUUID())
                .name("casual")
                .tagType("system")
                .isSystemTag(true)
                .isRestricted(false)
                .build();
    }

    @Nested
    @DisplayName("getAllTags Tests")
    class GetAllTagsTests {

        @Test
        @DisplayName("Should return all system tags")
        void getAllTags_ShouldReturnAllSystemTags() {
            // Arrange
            List<GameTag> tags = Arrays.asList(womenTag, casualTag);
            when(tagRepository.findAllByIsSystemTagTrue()).thenReturn(tags);

            // Act
            List<GameDto.TagDto> result = gameService.getAllTags();

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result).extracting(GameDto.TagDto::getName)
                    .containsExactlyInAnyOrder("women", "casual");
            verify(tagRepository).findAllByIsSystemTagTrue();
        }

        @Test
        @DisplayName("Should return empty list when no tags exist")
        void getAllTags_WhenNoTags_ShouldReturnEmptyList() {
            // Arrange
            when(tagRepository.findAllByIsSystemTagTrue()).thenReturn(Collections.emptyList());

            // Act
            List<GameDto.TagDto> result = gameService.getAllTags();

            // Assert
            assertThat(result).isEmpty();
            verify(tagRepository).findAllByIsSystemTagTrue();
        }
    }

    @Nested
    @DisplayName("assignTagsToGame Tests")
    class AssignTagsToGameTests {

        @Test
        @DisplayName("Should assign valid tags to game")
        void assignTagsToGame_WithValidTags_ShouldAssign() {
            // Arrange
            List<String> tagNames = Arrays.asList("women", "casual");
            when(tagRepository.findByName("women")).thenReturn(Optional.of(womenTag));
            when(tagRepository.findByName("casual")).thenReturn(Optional.of(casualTag));

            // Act
            gameService.assignTagsToGame(testGame, tagNames);

            // Assert
            verify(tagRepository).findByName("women");
            verify(tagRepository).findByName("casual");
            verify(tagAssignmentRepository, times(2)).save(any(GameTagAssignment.class));
        }

        @Test
        @DisplayName("Should throw exception for invalid tag")
        void assignTagsToGame_WithInvalidTag_ShouldThrowException() {
            // Arrange
            List<String> tagNames = Collections.singletonList("invalid-tag");
            when(tagRepository.findByName("invalid-tag")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> gameService.assignTagsToGame(testGame, tagNames))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid tag");
            verify(tagAssignmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should handle null tag list")
        void assignTagsToGame_WithNullTags_ShouldNotThrow() {
            // Act & Assert
            assertThatCode(() -> gameService.assignTagsToGame(testGame, null))
                    .doesNotThrowAnyException();
            verify(tagAssignmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should handle empty tag list")
        void assignTagsToGame_WithEmptyTags_ShouldNotThrow() {
            // Act & Assert
            assertThatCode(() -> gameService.assignTagsToGame(testGame, Collections.emptyList()))
                    .doesNotThrowAnyException();
            verify(tagAssignmentRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("validateAgeRequirements Tests")
    class ValidateAgeRequirementsTests {

        @Test
        @DisplayName("Should validate user meets minimum age requirement")
        void validateAge_UserMeetsMinAge_ShouldNotThrow() {
            // Arrange - user is 29 years old
            testGame.setMinAge(18);

            // Act & Assert
            assertThatCode(() -> gameService.validateAgeRequirements(testGame, testUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should throw exception when user below minimum age")
        void validateAge_UserBelowMinAge_ShouldThrowException() {
            // Arrange - user is 29 years old
            testGame.setMinAge(35);

            // Act & Assert
            assertThatThrownBy(() -> gameService.validateAgeRequirements(testGame, testUser))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Age confirmation required");
        }

        @Test
        @DisplayName("Should validate user meets maximum age requirement")
        void validateAge_UserMeetsMaxAge_ShouldNotThrow() {
            // Arrange
            testGame.setMaxAge(40);

            // Act & Assert
            assertThatCode(() -> gameService.validateAgeRequirements(testGame, testUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should throw exception when user above maximum age")
        void validateAge_UserAboveMaxAge_ShouldThrowException() {
            // Arrange
            testGame.setMaxAge(25);

            // Act & Assert
            assertThatThrownBy(() -> gameService.validateAgeRequirements(testGame, testUser))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Age confirmation required");
        }

        @Test
        @DisplayName("Should validate user within age range")
        void validateAge_UserWithinRange_ShouldNotThrow() {
            // Arrange
            testGame.setMinAge(20);
            testGame.setMaxAge(40);

            // Act & Assert
            assertThatCode(() -> gameService.validateAgeRequirements(testGame, testUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle null age confirmation")
        void validateAge_NullAgeConfirmation_ShouldNotThrow() {
            // Arrange
            testUser.setAgeConfirmedAt(null);
            testGame.setMinAge(18);

            // Act & Assert
            assertThatCode(() -> gameService.validateAgeRequirements(testGame, testUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle no age requirements")
        void validateAge_NoRequirements_ShouldNotThrow() {
            // Arrange - no age requirements set

            // Act & Assert
            assertThatCode(() -> gameService.validateAgeRequirements(testGame, testUser))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("validateAndRecordTagConfirmations Tests")
    class ValidateTagConfirmationsTests {

        @Test
        @DisplayName("Should validate and record confirmations for restricted tags")
        void validateTags_WithRestrictedTagsConfirmed_ShouldRecord() {
            // Arrange
            GameTagAssignment assignment = GameTagAssignment.builder()
                    .game(testGame)
                    .tag(womenTag)
                    .build();
            when(tagAssignmentRepository.findAllByGame(testGame))
                    .thenReturn(Collections.singletonList(assignment));

            GameDto.JoinRequest joinRequest = new GameDto.JoinRequest();
            joinRequest.setConfirmedTagIds(Collections.singletonList(womenTag.getTagId().toString()));

            // Act
            gameService.validateAndRecordTagConfirmations(testGame, testUser, joinRequest);

            // Assert
            verify(tagConfirmationRepository).save(any(GameTagConfirmation.class));
        }

        @Test
        @DisplayName("Should throw exception when restricted tag not confirmed")
        void validateTags_WithRestrictedTagNotConfirmed_ShouldThrowException() {
            // Arrange
            GameTagAssignment assignment = GameTagAssignment.builder()
                    .game(testGame)
                    .tag(womenTag)
                    .build();
            when(tagAssignmentRepository.findAllByGame(testGame))
                    .thenReturn(Collections.singletonList(assignment));

            GameDto.JoinRequest joinRequest = new GameDto.JoinRequest();
            joinRequest.setConfirmedTagIds(Collections.emptyList());

            // Act & Assert
            assertThatThrownBy(() -> gameService.validateAndRecordTagConfirmations(testGame, testUser, joinRequest))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("must confirm");
        }

        @Test
        @DisplayName("Should allow joining without confirmations for non-restricted tags")
        void validateTags_WithNonRestrictedTags_ShouldNotRequireConfirmation() {
            // Arrange
            GameTagAssignment assignment = GameTagAssignment.builder()
                    .game(testGame)
                    .tag(casualTag)
                    .build();
            when(tagAssignmentRepository.findAllByGame(testGame))
                    .thenReturn(Collections.singletonList(assignment));

            // Act & Assert
            assertThatCode(() -> gameService.validateAndRecordTagConfirmations(testGame, testUser, null))
                    .doesNotThrowAnyException();
            verify(tagConfirmationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should handle null join request when no restricted tags")
        void validateTags_NullRequestWithNoRestrictedTags_ShouldNotThrow() {
            // Arrange
            when(tagAssignmentRepository.findAllByGame(testGame))
                    .thenReturn(Collections.emptyList());

            // Act & Assert
            assertThatCode(() -> gameService.validateAndRecordTagConfirmations(testGame, testUser, null))
                    .doesNotThrowAnyException();
        }
    }
}
