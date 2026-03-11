package com.backend.playlocal.service;

import com.backend.playlocal.exception.CapacityExceededException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GameService - US 2.5: Join/Leave + Waitlist (Concurrency-Safe)
 * 
 * Acceptance Criteria:
 * 1. If capacity is available, user joins and appears in the confirmed roster
 * 2. If full, user is added to a waitlist and sees their waitlist position
 * 3. When a confirmed player leaves, the next waitlisted user is promoted
 * automatically
 * 4. Capacity cannot be exceeded under concurrent requests
 * (transaction/locking)
 * 5. UI clearly displays current state: Joined / Waitlisted / Not Joined
 */
@ExtendWith(MockitoExtension.class)
class GameServiceJoinLeaveTest {

        @Mock
        private GameRepository gameRepository;

        @Mock
        private GameParticipationRepository participationRepository;

        @Mock
        private UserRepository userRepository;

        @Mock
        private SportRepository sportRepository;

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
        private PrivacySettingsService privacySettingsService;

        @Mock
        private FriendshipRepository friendshipRepository;

        @InjectMocks
        private GameService gameService;

        private UUID gameId;
        private UUID userId;
        private UUID organizerId;
        private User testUser;
        private User organizer;
        private Game testGame;
        private Sport testSport;

        @BeforeEach
        void setUp() {
                gameId = UUID.randomUUID();
                userId = UUID.randomUUID();
                organizerId = UUID.randomUUID();

                testUser = User.builder()
                                .userId(userId)
                                .displayName("Test User")
                                .email("test@example.com")
                                .reliabilityScore(85.0f)
                                .build();

                organizer = User.builder()
                                .userId(organizerId)
                                .displayName("Organizer")
                                .email("organizer@example.com")
                                .reliabilityScore(95.0f)
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
        // US 2.5 AC1: If capacity is available, user joins and appears in confirmed
        // =========================================================================
        @Nested
        @DisplayName("US 2.5 AC1: Join with available capacity")
        class JoinWithCapacity {

                @Test
                @DisplayName("Should join as CONFIRMED when capacity is available")
                void joinGame_WhenCapacityAvailable_ShouldReturnConfirmed() {
                        // Given
                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId)).thenReturn(Optional.empty());
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(5); // 5/10 spots
                                                                                                        // taken
                        when(participationRepository.save(any(GameParticipation.class)))
                                        .thenAnswer(inv -> {
                                                GameParticipation p = inv.getArgument(0);
                                                p.setParticipationId(UUID.randomUUID());
                                                return p;
                                        });

                        // When
                        GameDto.JoinResponse response = gameService.joinGame(gameId, userId);

                        // Then
                        assertThat(response.getJoinStatus()).isEqualTo("CONFIRMED");
                        assertThat(response.getWaitlistPosition()).isNull();
                        assertThat(response.getMessage()).contains("Successfully joined");

                        // Verify participation was saved with correct status
                        ArgumentCaptor<GameParticipation> captor = ArgumentCaptor.forClass(GameParticipation.class);
                        verify(participationRepository).save(captor.capture());
                        assertThat(captor.getValue().getJoinStatus()).isEqualTo(GameParticipation.JoinStatus.CONFIRMED);
                }

                @Test
                @DisplayName("Should join as CONFIRMED when exactly at capacity - 1")
                void joinGame_WhenOneSpotLeft_ShouldReturnConfirmed() {
                        // Given
                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId)).thenReturn(Optional.empty());
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(9); // 9/10 spots
                                                                                                        // taken
                        when(participationRepository.save(any(GameParticipation.class)))
                                        .thenAnswer(inv -> {
                                                GameParticipation p = inv.getArgument(0);
                                                p.setParticipationId(UUID.randomUUID());
                                                return p;
                                        });

                        // When
                        GameDto.JoinResponse response = gameService.joinGame(gameId, userId);

                        // Then
                        assertThat(response.getJoinStatus()).isEqualTo("CONFIRMED");
                }
        }

        // =========================================================================
        // US 2.5 AC2: If full, user is added to waitlist with position
        // =========================================================================
        @Nested
        @DisplayName("US 2.5 AC2: Join when game is full (waitlist)")
        class JoinToWaitlist {

                @Test
                @DisplayName("Should join WAITLIST when game is full")
                void joinGame_WhenFull_ShouldAddToWaitlist() {
                        // Given
                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId)).thenReturn(Optional.empty());
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(10); // FULL
                        when(participationRepository.getNextWaitlistPosition(gameId)).thenReturn(1);
                        when(participationRepository.save(any(GameParticipation.class)))
                                        .thenAnswer(inv -> {
                                                GameParticipation p = inv.getArgument(0);
                                                p.setParticipationId(UUID.randomUUID());
                                                return p;
                                        });

                        // When
                        GameDto.JoinResponse response = gameService.joinGame(gameId, userId);

                        // Then
                        assertThat(response.getJoinStatus()).isEqualTo("WAITLISTED");
                        assertThat(response.getWaitlistPosition()).isEqualTo(1);
                        assertThat(response.getMessage()).contains("waitlist");

                        // Verify participation was saved with correct status
                        ArgumentCaptor<GameParticipation> captor = ArgumentCaptor.forClass(GameParticipation.class);
                        verify(participationRepository).save(captor.capture());
                        assertThat(captor.getValue().getJoinStatus())
                                        .isEqualTo(GameParticipation.JoinStatus.WAITLISTED);
                        assertThat(captor.getValue().getWaitlistPosition()).isEqualTo(1);
                }

                @Test
                @DisplayName("Should assign correct waitlist position (3rd in line)")
                void joinGame_WhenWaitlistHasUsers_ShouldGetCorrectPosition() {
                        // Given
                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId)).thenReturn(Optional.empty());
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(10);
                        when(participationRepository.getNextWaitlistPosition(gameId)).thenReturn(3); // 2 already
                                                                                                     // waiting
                        when(participationRepository.save(any(GameParticipation.class)))
                                        .thenAnswer(inv -> {
                                                GameParticipation p = inv.getArgument(0);
                                                p.setParticipationId(UUID.randomUUID());
                                                return p;
                                        });

                        // When
                        GameDto.JoinResponse response = gameService.joinGame(gameId, userId);

                        // Then
                        assertThat(response.getWaitlistPosition()).isEqualTo(3);
                }

                @Test
                @DisplayName("Should throw CapacityExceededException when full and waitlist disabled")
                void joinGame_WhenFullAndNoWaitlist_ShouldThrowException() {
                        // Given
                        testGame.setAllowWaitlist(false);
                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId)).thenReturn(Optional.empty());
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(10);

                        // When/Then
                        assertThatThrownBy(() -> gameService.joinGame(gameId, userId))
                                        .isInstanceOf(CapacityExceededException.class)
                                        .hasMessageContaining("full");
                }
        }

        // =========================================================================
        // US 2.5 AC3: When confirmed player leaves, waitlisted user is promoted
        // =========================================================================
        @Nested
        @DisplayName("US 2.5 AC3: Leave game and auto-promote waitlisted")
        class LeaveAndPromote {

                @Test
                @DisplayName("Should promote first waitlisted user when confirmed player leaves")
                void leaveGame_WhenConfirmedLeaves_ShouldPromoteWaitlisted() {
                        // Given
                        GameParticipation confirmedParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                        .build();

                        User waitlistedUser = User.builder()
                                        .userId(UUID.randomUUID())
                                        .displayName("Waitlisted User")
                                        .build();

                        GameParticipation waitlistedParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(waitlistedUser)
                                        .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                                        .waitlistPosition(1)
                                        .build();

                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(confirmedParticipation));
                        when(participationRepository.findFirstWaitlisted(gameId))
                                        .thenReturn(List.of(waitlistedParticipation));

                        // When
                        gameService.leaveGame(gameId, userId);

                        // Then
                        // Verify the leaving user was cancelled
                        assertThat(confirmedParticipation.getJoinStatus())
                                        .isEqualTo(GameParticipation.JoinStatus.CANCELLED);
                        assertThat(confirmedParticipation.getLeftAt()).isNotNull();

                        // Verify waitlisted user was promoted
                        assertThat(waitlistedParticipation.getJoinStatus())
                                        .isEqualTo(GameParticipation.JoinStatus.CONFIRMED);
                        assertThat(waitlistedParticipation.getWaitlistPosition()).isNull();

                        // Verify remaining waitlist positions were decremented
                        verify(participationRepository).decrementWaitlistPositionsAfter(gameId, 1);
                }

                @Test
                @DisplayName("Should not promote anyone when no waitlist exists")
                void leaveGame_WhenNoWaitlist_ShouldNotPromote() {
                        // Given
                        GameParticipation confirmedParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                        .build();

                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(confirmedParticipation));
                        when(participationRepository.findFirstWaitlisted(gameId))
                                        .thenReturn(Collections.emptyList());

                        // When
                        gameService.leaveGame(gameId, userId);

                        // Then
                        assertThat(confirmedParticipation.getJoinStatus())
                                        .isEqualTo(GameParticipation.JoinStatus.CANCELLED);
                        verify(participationRepository, never()).decrementWaitlistPositionsAfter(any(), anyInt());
                }

                @Test
                @DisplayName("Should decrement waitlist positions when waitlisted user leaves")
                void leaveGame_WhenWaitlistedLeaves_ShouldDecrementPositions() {
                        // Given
                        GameParticipation waitlistedParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                                        .waitlistPosition(2)
                                        .build();

                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(waitlistedParticipation));

                        // When
                        gameService.leaveGame(gameId, userId);

                        // Then
                        assertThat(waitlistedParticipation.getJoinStatus())
                                        .isEqualTo(GameParticipation.JoinStatus.CANCELLED);
                        verify(participationRepository).decrementWaitlistPositionsAfter(gameId, 2);
                }

                @Test
                @DisplayName("Should NOT decrement waitlist when waitlisted user at position 0 leaves")
                void leaveGame_WhenWaitlistedAtPositionZero_ShouldNotDecrement() {
                        // Given
                        GameParticipation waitlistedParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                                        .waitlistPosition(0)
                                        .build();

                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(waitlistedParticipation));

                        // When
                        gameService.leaveGame(gameId, userId);

                        // Then
                        assertThat(waitlistedParticipation.getJoinStatus())
                                        .isEqualTo(GameParticipation.JoinStatus.CANCELLED);
                        verify(participationRepository, never()).decrementWaitlistPositionsAfter(any(), anyInt());
                }

                @Test
                @DisplayName("Organizer should NOT be able to leave their own game")
                void leaveGame_WhenOrganizer_ShouldThrowException() {
                        // Given
                        GameParticipation organizerParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(organizer)
                                        .participationRole(GameParticipation.ParticipationRole.ORGANIZER)
                                        .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                        .build();

                        when(participationRepository.findByGameAndUser(gameId, organizerId))
                                        .thenReturn(Optional.of(organizerParticipation));

                        // When/Then
                        assertThatThrownBy(() -> gameService.leaveGame(gameId, organizerId))
                                        .isInstanceOf(IllegalStateException.class)
                                        .hasMessageContaining("Organizer cannot leave");
                }
        }

        // =========================================================================
        // Edge Cases & Error Handling
        // =========================================================================
        @Nested
        @DisplayName("Edge Cases & Error Handling")
        class EdgeCases {

                @Test
                @DisplayName("Should be idempotent - return existing participation if already joined")
                void joinGame_WhenAlreadyJoined_ShouldReturnExisting() {
                        // Given
                        GameParticipation existingParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                        .build();

                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(existingParticipation));

                        // When
                        GameDto.JoinResponse response = gameService.joinGame(gameId, userId);

                        // Then
                        assertThat(response.getJoinStatus()).isEqualTo("CONFIRMED");
                        assertThat(response.getMessage()).contains("Already joined");
                        verify(participationRepository, never()).save(any());
                }

                @Test
                @DisplayName("Should be idempotent - return existing WAITLISTED participation if already on waitlist")
                void joinGame_WhenAlreadyWaitlisted_ShouldReturnExisting() {
                        // Given
                        GameParticipation existingParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                                        .waitlistPosition(2)
                                        .build();

                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(existingParticipation));

                        // When
                        GameDto.JoinResponse response = gameService.joinGame(gameId, userId);

                        // Then
                        assertThat(response.getJoinStatus()).isEqualTo("WAITLISTED");
                        assertThat(response.getWaitlistPosition()).isEqualTo(2);
                        assertThat(response.getMessage()).contains("Already joined");
                        verify(participationRepository, never()).save(any());
                }

                @Test
                @DisplayName("Should allow re-join after cancellation - to CONFIRMED if spots available")
                void joinGame_WhenRejoinAfterCancel_AndCapacityAvailable_ShouldConfirm() {
                        // Given
                        GameParticipation cancelledParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .joinStatus(GameParticipation.JoinStatus.CANCELLED)
                                        .leftAt(Instant.now().minusSeconds(3600))
                                        .build();

                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(cancelledParticipation));
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(5);
                        when(participationRepository.save(any(GameParticipation.class)))
                                        .thenAnswer(inv -> inv.getArgument(0));

                        // When
                        GameDto.JoinResponse response = gameService.joinGame(gameId, userId);

                        // Then
                        assertThat(response.getJoinStatus()).isEqualTo("CONFIRMED");
                        assertThat(cancelledParticipation.getJoinStatus())
                                        .isEqualTo(GameParticipation.JoinStatus.CONFIRMED);
                        assertThat(cancelledParticipation.getLeftAt()).isNull();
                }

                @Test
                @DisplayName("Should allow re-join after cancellation - to WAITLIST if full")
                void joinGame_WhenRejoinAfterCancel_AndFull_ShouldWaitlist() {
                        // Given
                        GameParticipation cancelledParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .joinStatus(GameParticipation.JoinStatus.CANCELLED)
                                        .leftAt(Instant.now().minusSeconds(3600))
                                        .build();

                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(cancelledParticipation));
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(10); // FULL
                        when(participationRepository.getNextWaitlistPosition(gameId)).thenReturn(2);
                        when(participationRepository.save(any(GameParticipation.class)))
                                        .thenAnswer(inv -> inv.getArgument(0));

                        // When
                        GameDto.JoinResponse response = gameService.joinGame(gameId, userId);

                        // Then
                        assertThat(response.getJoinStatus()).isEqualTo("WAITLISTED");
                        assertThat(response.getWaitlistPosition()).isEqualTo(2);
                        assertThat(cancelledParticipation.getJoinStatus())
                                        .isEqualTo(GameParticipation.JoinStatus.WAITLISTED);
                }

                @Test
                @DisplayName("Should throw CapacityExceededException when re-joining full game with waitlist disabled")
                void joinGame_WhenRejoinAfterCancel_AndFullNoWaitlist_ShouldThrow() {
                        // Given - This covers line 170 in GameService (re-join path)
                        testGame.setAllowWaitlist(false);
                        GameParticipation cancelledParticipation = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .joinStatus(GameParticipation.JoinStatus.CANCELLED)
                                        .leftAt(Instant.now().minusSeconds(3600))
                                        .build();

                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(cancelledParticipation));
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(10); // FULL

                        // When/Then
                        assertThatThrownBy(() -> gameService.joinGame(gameId, userId))
                                        .isInstanceOf(CapacityExceededException.class)
                                        .hasMessageContaining("full");
                }

                @Test
                @DisplayName("Should throw when game not found")
                void joinGame_WhenGameNotFound_ShouldThrow() {
                        // Given
                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.empty());

                        // When/Then
                        assertThatThrownBy(() -> gameService.joinGame(gameId, userId))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("Game not found");
                }

                @Test
                @DisplayName("Should throw when user not found")
                void joinGame_WhenUserNotFound_ShouldThrow() {
                        // Given
                        when(userRepository.findActiveById(userId)).thenReturn(Optional.empty());

                        // When/Then
                        assertThatThrownBy(() -> gameService.joinGame(gameId, userId))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("User not found");
                }

                @Test
                @DisplayName("Should throw when game is not SCHEDULED")
                void joinGame_WhenGameNotScheduled_ShouldThrow() {
                        // Given
                        testGame.setStatus(Game.GameStatus.COMPLETED);
                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));

                        // When/Then
                        assertThatThrownBy(() -> gameService.joinGame(gameId, userId))
                                        .isInstanceOf(IllegalStateException.class)
                                        .hasMessageContaining("not scheduled");
                }

                @Test
                @DisplayName("Should prevent joins when game is cancelled")
                void joinGame_WhenCancelled_ShouldThrow() {
                        // Given
                        testGame.setStatus(Game.GameStatus.CANCELLED);
                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));

                        // When/Then
                        assertThatThrownBy(() -> gameService.joinGame(gameId, userId))
                                        .isInstanceOf(IllegalStateException.class)
                                        .hasMessageContaining("not scheduled");
                }

                @Test
                @DisplayName("Should throw AccessDeniedException when reliability too low")
                void joinGame_WhenReliabilityTooLow_ShouldThrow() {
                        // Given
                        testGame.setMinReliabilityRequired(90.0f);
                        testUser.setReliabilityScore(70.0f); // Below requirement

                        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(testUser));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));

                        // When/Then
                        assertThatThrownBy(() -> gameService.joinGame(gameId, userId))
                                        .isInstanceOf(AccessDeniedException.class)
                                        .hasMessageContaining("reliability");
                }

                @Test
                @DisplayName("US-4.1: Organizer can join despite minReliabilityRequired (organizer exempt)")
                void joinGame_WhenOrganizer_IgnoresMinReliability() {
                        // Given: game has minReliabilityRequired 90, organizer has score 70 (below threshold)
                        testGame.setMinReliabilityRequired(90.0f);
                        organizer.setReliabilityScore(70.0f);
                        when(userRepository.findActiveById(organizerId)).thenReturn(Optional.of(organizer));
                        when(gameRepository.findByIdWithLock(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findByGameAndUser(gameId, organizerId)).thenReturn(Optional.empty());
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(0);
                        GameParticipation saved = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(organizer)
                                        .sport(testSport)
                                        .participationRole(GameParticipation.ParticipationRole.ORGANIZER)
                                        .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                        .build();
                        when(participationRepository.save(any(GameParticipation.class))).thenReturn(saved);

                        // When: organizer joins (same as createdBy)
                        GameDto.JoinResponse response = gameService.joinGame(gameId, organizerId);

                        // Then: succeeds (organizer exempt from reliability check)
                        assertThat(response).isNotNull();
                        assertThat(response.getJoinStatus()).isEqualTo("CONFIRMED");
                }

                @Test
                @DisplayName("Should throw when trying to leave non-existent participation")
                void leaveGame_WhenNotParticipant_ShouldThrow() {
                        // Given
                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.empty());

                        // When/Then
                        assertThatThrownBy(() -> gameService.leaveGame(gameId, userId))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("Participation not found");
                }
        }

        // =========================================================================
        // Roster Response Tests
        // =========================================================================
        @Nested
        @DisplayName("US 2.5 AC5: Get Roster (confirmed + waitlisted)")
        class GetRoster {

                @Test
                @DisplayName("Should return separate confirmed and waitlisted lists")
                void getRoster_ShouldReturnBothLists() {
                        // Given
                        GameParticipation confirmed = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                        .joinedAt(Instant.now())
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .build();

                        User waitlistedUser = User.builder()
                                        .userId(UUID.randomUUID())
                                        .displayName("Waitlisted")
                                        .build();

                        GameParticipation waitlisted = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(waitlistedUser)
                                        .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                                        .waitlistPosition(1)
                                        .joinedAt(Instant.now())
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .build();

                        when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findConfirmedByGame(gameId)).thenReturn(List.of(confirmed));
                        when(participationRepository.findWaitlistedByGame(gameId)).thenReturn(List.of(waitlisted));

                        // When
                        GameDto.RosterResponse roster = gameService.getRoster(gameId, userId);

                        // Then
                        assertThat(roster.getConfirmed()).hasSize(1);
                        assertThat(roster.getWaitlisted()).hasSize(1);
                        assertThat(roster.getMaxPlayers()).isEqualTo(10);
                        assertThat(roster.getSpotsAvailable()).isEqualTo(9); // 10 - 1 confirmed
                }

                @Test
                @DisplayName("Should calculate spots available correctly")
                void getRoster_ShouldCalculateSpotsCorrectly() {
                        // Given
                        testGame.setMaxPlayers(5);

                        List<GameParticipation> confirmedList = List.of(
                                        createConfirmedParticipation(),
                                        createConfirmedParticipation(),
                                        createConfirmedParticipation());

                        when(gameRepository.findById(gameId)).thenReturn(Optional.of(testGame));
                        when(participationRepository.findConfirmedByGame(gameId)).thenReturn(confirmedList);
                        when(participationRepository.findWaitlistedByGame(gameId)).thenReturn(Collections.emptyList());

                        // When
                        GameDto.RosterResponse roster = gameService.getRoster(gameId, userId);

                        // Then
                        assertThat(roster.getSpotsAvailable()).isEqualTo(2); // 5 - 3 = 2
                }

                private GameParticipation createConfirmedParticipation() {
                        return GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(User.builder().userId(UUID.randomUUID()).displayName("Player").build())
                                        .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                        .joinedAt(Instant.now())
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .build();
                }
        }

        @Nested
        @DisplayName("US-2.6: getGameParticipation, getPastGamesForUserNeedingAttendanceUpdate")
        class GetParticipationAndPastGamesTests {

                @Test
                @DisplayName("getGameParticipation should return participation when found")
                void getGameParticipation_WhenFound_ShouldReturnDto() {
                        GameParticipation p = GameParticipation.builder()
                                        .participationId(UUID.randomUUID())
                                        .game(testGame)
                                        .user(testUser)
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                        .joinedAt(Instant.now())
                                        .attendanceStatus(GameParticipation.AttendanceStatus.UNKNOWN)
                                        .build();
                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.of(p));

                        GameDto.ParticipantDto result = gameService.getGameParticipation(gameId, userId);

                        assertThat(result).isNotNull();
                        assertThat(result.getParticipationId()).isEqualTo(p.getParticipationId().toString());
                        assertThat(result.getUserId()).isEqualTo(testUser.getUserId().toString());
                        assertThat(result.getDisplayName()).isEqualTo(testUser.getDisplayName());
                        assertThat(result.getRole()).isEqualTo("PARTICIPANT");
                        assertThat(result.getJoinStatus()).isEqualTo("CONFIRMED");
                        assertThat(result.getAttendanceStatus()).isEqualTo("UNKNOWN");
                        verify(participationRepository).findByGameAndUser(gameId, userId);
                }

                @Test
                @DisplayName("getGameParticipation should throw when not found")
                void getGameParticipation_WhenNotFound_ShouldThrow() {
                        when(participationRepository.findByGameAndUser(gameId, userId))
                                        .thenReturn(Optional.empty());

                        assertThatThrownBy(() -> gameService.getGameParticipation(gameId, userId))
                                        .isInstanceOf(ResourceNotFoundException.class)
                                        .hasMessageContaining("Game Participation not found");

                        verify(participationRepository).findByGameAndUser(gameId, userId);
                }

                @Test
                @DisplayName("getPastGamesForUserNeedingAttendanceUpdate should return games for organizer")
                void getPastGamesForUserNeedingAttendanceUpdate_WhenOrganizer_ShouldReturnGames() {
                        when(gameRepository.findPastGamesForUserNeedingAttendanceUpdate(eq(organizerId), any(Instant.class)))
                                        .thenReturn(List.of(testGame));
                        when(participationRepository.countConfirmedParticipants(gameId)).thenReturn(1);
                        when(participationRepository.findWaitlistedByGame(gameId))
                                        .thenReturn(Collections.emptyList());

                        var result = gameService.getPastGamesForUserNeedingAttendanceUpdate(organizerId);

                        assertThat(result).hasSize(1);
                        assertThat(result.get(0).getGameId()).isEqualTo(gameId.toString());
                        assertThat(result.get(0).getTitle()).isEqualTo("Test Game");
                        assertThat(result.get(0).getSportName()).isEqualTo("Basketball");
                        verify(gameRepository).findPastGamesForUserNeedingAttendanceUpdate(eq(organizerId), any(Instant.class));
                }

                @Test
                @DisplayName("getPastGamesForUserNeedingAttendanceUpdate should return empty when none")
                void getPastGamesForUserNeedingAttendanceUpdate_WhenNone_ShouldReturnEmpty() {
                        when(gameRepository.findPastGamesForUserNeedingAttendanceUpdate(eq(organizerId), any(Instant.class)))
                                        .thenReturn(Collections.emptyList());

                        var result = gameService.getPastGamesForUserNeedingAttendanceUpdate(organizerId);

                        assertThat(result).isEmpty();
                        verify(gameRepository).findPastGamesForUserNeedingAttendanceUpdate(eq(organizerId), any(Instant.class));
                }
        }
}
