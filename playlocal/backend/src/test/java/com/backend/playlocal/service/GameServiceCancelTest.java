package com.backend.playlocal.service;

import com.backend.playlocal.service.OrganizerQualityService;
import com.backend.playlocal.exception.ResourceNotFoundException;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GameService - US 2.4: Cancel Game (Organizer Control)
 * 
 * Acceptance Criteria:
 * - Organizer has controls to cancel the game
 * - Only organizer can cancel
 * - Game must be in SCHEDULED status to be cancelled
 */
@ExtendWith(MockitoExtension.class)
class GameServiceCancelTest {

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

    @Mock
    private OrganizerQualityService oqsService;

    @Mock
    private NotificationService notificationService;


    @InjectMocks
    private GameService gameService;

    private UUID gameId;
    private UUID organizerId;
    private UUID otherUserId;
    private User organizer;
    private User otherUser;
    private Game testGame;
    private Sport testSport;

    @BeforeEach
    void setUp() {
        gameId = UUID.randomUUID();
        organizerId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();

        organizer = User.builder()
                .userId(organizerId)
                .displayName("Organizer")
                .email("organizer@example.com")
                .reliabilityScore(95.0f)
                .build();

        otherUser = User.builder()
                .userId(otherUserId)
                .displayName("Other User")
                .email("other@example.com")
                .reliabilityScore(85.0f)
                .build();

        testSport = Sport.builder()
                .sportId(UUID.randomUUID())
                .name("Basketball")
                .build();

        testGame = Game.builder()
                .gameId(gameId)
                .createdBy(organizer)
                .sport(testSport)
                .title("Test Game")
                .status(Game.GameStatus.SCHEDULED)
                .maxPlayers(10)
                .minPlayers(2)
                .allowWaitlist(true)
                .startTime(Instant.now().plusSeconds(3600))
                .build();
    }

    // =========================================================================
    // US 2.4: Cancel Game Tests
    // =========================================================================
    @Nested
    @DisplayName("US 2.4: Cancel Game Functionality")
    class CancelGame {

        @Test
        @DisplayName("Should cancel game successfully when organizer requests")
        void cancelGame_WhenOrganizer_ShouldSucceed() {
            // Given
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
            when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(5);
            when(participationRepository.findWaitlistedByGame(gameId)).thenReturn(java.util.Collections.emptyList());
            when(tagAssignmentRepository.findAllByGame(any(Game.class))).thenReturn(java.util.Collections.emptyList());
            when(gameRepository.save(any(Game.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            GameDto.GameResponse response = gameService.cancelGame(gameId, organizerId);

            // Then
            assertThat(response).isNotNull();
            assertThat(testGame.getStatus()).isEqualTo(Game.GameStatus.CANCELLED);
            assertThat(testGame.getCancelledAt()).isNotNull();
            verify(gameRepository).save(testGame);
        }

        @Test
        @DisplayName("Should throw AccessDeniedException when non-organizer tries to cancel")
        void cancelGame_WhenNotOrganizer_ShouldThrowException() {
            // Given
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));

            // When/Then
            assertThatThrownBy(() -> gameService.cancelGame(gameId, otherUserId))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only the organizer can cancel");
        }

        @Test
        @DisplayName("Should throw IllegalStateException when game is not SCHEDULED")
        void cancelGame_WhenGameNotScheduled_ShouldThrowException() {
            // Given
            testGame.setStatus(Game.GameStatus.COMPLETED);
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));

            // When/Then
            assertThatThrownBy(() -> gameService.cancelGame(gameId, organizerId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot cancel");
        }

        @Test
        @DisplayName("Should throw IllegalStateException when game is IN_PROGRESS")
        void cancelGame_WhenGameInProgress_ShouldThrowException() {
            // Given
            testGame.setStatus(Game.GameStatus.IN_PROGRESS);
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));

            // When/Then
            assertThatThrownBy(() -> gameService.cancelGame(gameId, organizerId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot cancel");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when game not found")
        void cancelGame_WhenGameNotFound_ShouldThrowException() {
            // Given
            when(gameRepository.findById(gameId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> gameService.cancelGame(gameId, organizerId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Game not found");
        }

        @Test
        @DisplayName("Should set cancelledAt timestamp when cancelling game")
        void cancelGame_ShouldSetCancelledAtTimestamp() {
            // Given
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
            when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(0);
            when(participationRepository.findWaitlistedByGame(gameId)).thenReturn(java.util.Collections.emptyList());
            when(tagAssignmentRepository.findAllByGame(any(Game.class))).thenReturn(java.util.Collections.emptyList());
            when(gameRepository.save(any(Game.class))).thenAnswer(inv -> inv.getArgument(0));

            Instant beforeCancel = Instant.now();

            // When
            gameService.cancelGame(gameId, organizerId);

            Instant afterCancel = Instant.now();

            // Then
            assertThat(testGame.getCancelledAt()).isNotNull();
            assertThat(testGame.getCancelledAt()).isAfterOrEqualTo(beforeCancel);
            assertThat(testGame.getCancelledAt()).isBeforeOrEqualTo(afterCancel);
        }

        @Test
        @DisplayName("Should not allow cancelling already cancelled game")
        void cancelGame_WhenAlreadyCancelled_ShouldThrowException() {
            // Given
            testGame.setStatus(Game.GameStatus.CANCELLED);
            testGame.setCancelledAt(Instant.now().minusSeconds(3600));
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));

            // When/Then
            assertThatThrownBy(() -> gameService.cancelGame(gameId, organizerId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot cancel");
        }
    }

    // =========================================================================
    // US-4.1: Update Game (minReliabilityRequired) Tests
    // =========================================================================
    @Nested
    @DisplayName("US-4.1: Update Game - minReliabilityRequired")
    class UpdateGameMinReliability {

        private void stubMapToGameResponse() {
            when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(0);
            lenient().when(participationRepository.findConfirmedByGame(gameId)).thenReturn(java.util.Collections.emptyList());
            when(participationRepository.findWaitlistedByGame(gameId)).thenReturn(java.util.Collections.emptyList());
            when(tagAssignmentRepository.findAllByGame(any(Game.class))).thenReturn(java.util.Collections.emptyList());
            when(gameRepository.saveAndFlush(any(Game.class))).thenAnswer(inv -> inv.getArgument(0));
        }

        @Test
        @DisplayName("Organizer can set minReliabilityRequired")
        void updateGame_OrganizerSetsMinReliability_ShouldSucceed() {
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
            stubMapToGameResponse();

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .minReliabilityRequired(85.0f)
                    .build();

            GameDto.GameResponse response = gameService.updateGame(gameId, organizerId, request);

            assertThat(response).isNotNull();
            assertThat(testGame.getMinReliabilityRequired()).isEqualTo(85.0f);
            verify(gameRepository).saveAndFlush(testGame);
        }

        @Test
        @DisplayName("Organizer can clear minReliabilityRequired with negative value")
        void updateGame_OrganizerClearsMinReliability_ShouldSucceed() {
            testGame.setMinReliabilityRequired(90.0f);
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
            stubMapToGameResponse();

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .minReliabilityRequired(-1f)
                    .build();

            gameService.updateGame(gameId, organizerId, request);

            assertThat(testGame.getMinReliabilityRequired()).isNull();
            verify(gameRepository).saveAndFlush(testGame);
        }

        @Test
        @DisplayName("Non-organizer cannot update game")
        void updateGame_NonOrganizer_ShouldThrow() {
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .minReliabilityRequired(80.0f)
                    .build();

            assertThatThrownBy(() -> gameService.updateGame(gameId, otherUserId, request))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only the organizer can update");
        }

        @Test
        @DisplayName("Cannot update game after start time")
        void updateGame_AfterStartTime_ShouldThrow() {
            testGame.setStartTime(Instant.now().minusSeconds(3600));
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .minReliabilityRequired(80.0f)
                    .build();

            assertThatThrownBy(() -> gameService.updateGame(gameId, organizerId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot update game after");
        }

        @Test
        @DisplayName("updateGame when game not found throws ResourceNotFoundException")
        void updateGame_WhenGameNotFound_ShouldThrow() {
            when(gameRepository.findById(gameId)).thenReturn(Optional.empty());

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .minReliabilityRequired(80.0f)
                    .build();

            assertThatThrownBy(() -> gameService.updateGame(gameId, organizerId, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Game not found");
        }

        @Test
        @DisplayName("Cannot update game when status is not SCHEDULED")
        void updateGame_WhenGameNotScheduled_ShouldThrow() {
            testGame.setStatus(Game.GameStatus.IN_PROGRESS);
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .title("Updated")
                    .build();

            assertThatThrownBy(() -> gameService.updateGame(gameId, organizerId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot update game after");
        }

        @Test
        @DisplayName("US-4.3: When organizer raises min reliability, participants below threshold are automatically removed")
        void updateGame_RaisesMinReliability_RemovesParticipantsBelowThreshold() {
            // Organizer has 95, participant1 has 95, participant2 has 98. Raise threshold to 96 -> part1 removed
            organizer.setReliabilityScore(100.0f); // Organizer exempt
            testGame.setMinReliabilityRequired(90.0f);
            GameParticipation orgPart = GameParticipation.builder()
                    .game(testGame)
                    .user(organizer)
                    .sport(testSport)
                    .participationRole(GameParticipation.ParticipationRole.ORGANIZER)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .build();
            User participant1 = User.builder().userId(UUID.randomUUID()).displayName("P1").reliabilityScore(95.0f).build();
            User participant2 = User.builder().userId(UUID.randomUUID()).displayName("P2").reliabilityScore(98.0f).build();
            GameParticipation part1 = GameParticipation.builder()
                    .game(testGame)
                    .user(participant1)
                    .sport(testSport)
                    .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .build();
            GameParticipation part2 = GameParticipation.builder()
                    .game(testGame)
                    .user(participant2)
                    .sport(testSport)
                    .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .build();

            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
            when(participationRepository.findConfirmedByGame(gameId))
                    .thenReturn(java.util.List.of(orgPart, part1, part2));
            when(participationRepository.findWaitlistedByGame(gameId)).thenReturn(java.util.Collections.emptyList());
            when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(2); // After removal: org + part2
            when(participationRepository.findFirstWaitlisted(gameId)).thenReturn(java.util.Collections.emptyList());
            when(tagAssignmentRepository.findAllByGame(any(Game.class))).thenReturn(java.util.Collections.emptyList());
            when(gameRepository.saveAndFlush(any(Game.class))).thenAnswer(inv -> inv.getArgument(0));

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .minReliabilityRequired(96.0f)
                    .build();

            gameService.updateGame(gameId, organizerId, request);

            // Participant1 (95) should be removed; organizer and participant2 (98) remain
            verify(participationRepository).save(part1);
            assertThat(part1.getJoinStatus()).isEqualTo(GameParticipation.JoinStatus.CANCELLED);
            assertThat(part1.getLeftAt()).isNotNull();
            assertThat(testGame.getMinReliabilityRequired()).isEqualTo(96.0f);

            // US-4.3: Removed player should receive notification
            verify(notificationService).createInAppNotification(
                    eq(participant1.getUserId()),
                    eq("GAME_REMOVED_REQUIREMENTS"),
                    argThat((Map<String, Object> p) ->
                            "Removed from game".equals(p.get("title"))
                                    && p.get("message").toString().contains(testGame.getTitle())
                                    && p.get("gameId").equals(gameId.toString())));
        }

        @Test
        @DisplayName("US-4.3: Raising min reliability removes confirmed participant and promotes first waitlisted")
        void updateGame_RaisesMinReliability_RemovesConfirmed_PromotesWaitlisted() {
            organizer.setReliabilityScore(100.0f);
            testGame.setMinReliabilityRequired(85.0f);
            GameParticipation orgPart = GameParticipation.builder()
                    .game(testGame)
                    .user(organizer)
                    .sport(testSport)
                    .participationRole(GameParticipation.ParticipationRole.ORGANIZER)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .build();
            User lowScoreUser = User.builder().userId(UUID.randomUUID()).displayName("LowScore").reliabilityScore(80.0f).build();
            User waitlistedUser = User.builder().userId(UUID.randomUUID()).displayName("Waitlisted").reliabilityScore(95.0f).build();
            GameParticipation confirmedLow = GameParticipation.builder()
                    .game(testGame)
                    .user(lowScoreUser)
                    .sport(testSport)
                    .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .build();
            GameParticipation waitlisted = GameParticipation.builder()
                    .game(testGame)
                    .user(waitlistedUser)
                    .sport(testSport)
                    .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                    .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                    .waitlistPosition(1)
                    .build();

            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
            when(participationRepository.findConfirmedByGame(gameId)).thenReturn(java.util.List.of(orgPart, confirmedLow));
            when(participationRepository.findWaitlistedByGame(gameId)).thenReturn(java.util.List.of(waitlisted));
            when(participationRepository.findFirstWaitlisted(gameId)).thenReturn(java.util.List.of(waitlisted));
            when(tagAssignmentRepository.findAllByGame(any(Game.class))).thenReturn(java.util.Collections.emptyList());
            when(gameRepository.saveAndFlush(any(Game.class))).thenAnswer(inv -> inv.getArgument(0));

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .minReliabilityRequired(90.0f)
                    .build();

            gameService.updateGame(gameId, organizerId, request);

            assertThat(confirmedLow.getJoinStatus()).isEqualTo(GameParticipation.JoinStatus.CANCELLED);
            assertThat(waitlisted.getJoinStatus()).isEqualTo(GameParticipation.JoinStatus.CONFIRMED);
            assertThat(waitlisted.getWaitlistPosition()).isNull();
            verify(participationRepository).decrementWaitlistPositionsAfter(gameId, 1);
            verify(notificationService).createInAppNotification(eq(lowScoreUser.getUserId()), eq("GAME_REMOVED_REQUIREMENTS"), any(Map.class));
        }

        @Test
        @DisplayName("US-4.3: Raising min reliability removes waitlisted participant with position > 0 and decrements positions")
        void updateGame_RaisesMinReliability_RemovesWaitlistedWithPosition_DecrementsPositions() {
            organizer.setReliabilityScore(100.0f);
            testGame.setMinReliabilityRequired(80.0f);
            GameParticipation orgPart = GameParticipation.builder()
                    .game(testGame)
                    .user(organizer)
                    .sport(testSport)
                    .participationRole(GameParticipation.ParticipationRole.ORGANIZER)
                    .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                    .build();
            User lowScoreWaitlisted = User.builder().userId(UUID.randomUUID()).displayName("LowWait").reliabilityScore(75.0f).build();
            GameParticipation waitlistedLow = GameParticipation.builder()
                    .game(testGame)
                    .user(lowScoreWaitlisted)
                    .sport(testSport)
                    .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                    .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                    .waitlistPosition(2)
                    .build();

            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
            when(participationRepository.findConfirmedByGame(gameId)).thenReturn(java.util.List.of(orgPart));
            when(participationRepository.findWaitlistedByGame(gameId)).thenReturn(java.util.List.of(waitlistedLow));
            when(tagAssignmentRepository.findAllByGame(any(Game.class))).thenReturn(java.util.Collections.emptyList());
            when(gameRepository.saveAndFlush(any(Game.class))).thenAnswer(inv -> inv.getArgument(0));

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .minReliabilityRequired(90.0f)
                    .build();

            gameService.updateGame(gameId, organizerId, request);

            assertThat(waitlistedLow.getJoinStatus()).isEqualTo(GameParticipation.JoinStatus.CANCELLED);
            verify(participationRepository).decrementWaitlistPositionsAfter(gameId, 2);
            verify(notificationService).createInAppNotification(eq(lowScoreWaitlisted.getUserId()), eq("GAME_REMOVED_REQUIREMENTS"), any(Map.class));
        }

        @Test
        @DisplayName("Organizer can update all optional fields")
        void updateGame_OrganizerUpdatesAllFields_ShouldSucceed() {
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
            stubMapToGameResponse();

            GameDto.UpdateRequest request = GameDto.UpdateRequest.builder()
                    .title("New Title")
                    .description("New description")
                    .indoorOutdoor("INDOOR")
                    .intensityBand("COMPETITIVE")
                    .skillBand("ADVANCED")
                    .minPlayers(4)
                    .maxPlayers(14)
                    .allowWaitlist(false)
                    .minReliabilityRequired(90.0f)
                    .build();

            GameDto.GameResponse response = gameService.updateGame(gameId, organizerId, request);

            assertThat(response).isNotNull();
            assertThat(testGame.getTitle()).isEqualTo("New Title");
            assertThat(testGame.getDescription()).isEqualTo("New description");
            assertThat(testGame.getIndoorOutdoor()).isEqualTo("INDOOR");
            assertThat(testGame.getIntensityBand()).isEqualTo("COMPETITIVE");
            assertThat(testGame.getSkillBand()).isEqualTo("ADVANCED");
            assertThat(testGame.getMinPlayers()).isEqualTo(4);
            assertThat(testGame.getMaxPlayers()).isEqualTo(14);
            assertThat(testGame.getAllowWaitlist()).isFalse();
            assertThat(testGame.getMinReliabilityRequired()).isEqualTo(90.0f);
            verify(gameRepository).saveAndFlush(testGame);
        }
    }
}
