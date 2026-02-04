package com.backend.playlocal.service;

import com.backend.playlocal.service.OrganizerQualityService;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.AttendanceDto;
import com.backend.playlocal.model.dto.ScoreHistoryDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ReliabilityService.
 * Tests US 2.7: Reliability Score Update + Score History (Audit Trail)
 */
@ExtendWith(MockitoExtension.class)
class ReliabilityServiceTest {

    @Mock
    private GameRepository gameRepository;

    @Mock
    private GameParticipationRepository participationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ScoreHistoryRepository scoreHistoryRepository;

    @Mock
    private OrganizerQualityService oqsService;

    @InjectMocks
    private ReliabilityService reliabilityService;

    @Captor
    private ArgumentCaptor<ScoreHistory> scoreHistoryCaptor;

    @Captor
    private ArgumentCaptor<User> userCaptor;

    private User organizer;
    private User participant;
    private Game game;
    private GameParticipation participation;
    private Sport testSport;

    @BeforeEach
    void setUp() {
        testSport = Sport.builder()
                .sportId(UUID.randomUUID())
                .name("Basketball")
                .build();

        // Set up organizer
        organizer = User.builder()
                .userId(UUID.randomUUID())
                .email("organizer@test.com")
                .displayName("Organizer")
                .reliabilityScore(100.0f)
                .attendedCount(10)
                .noShowCount(0)
                .gamesCount(10)
                .build();

        // Set up participant
        participant = User.builder()
                .userId(UUID.randomUUID())
                .email("participant@test.com")
                .displayName("Participant")
                .reliabilityScore(100.0f)
                .attendedCount(5)
                .noShowCount(0)
                .gamesCount(5)
                .build();

        // Set up game
        game = Game.builder()
                .gameId(UUID.randomUUID())
                .title("Test Basketball Game")
                .createdBy(organizer)
                .status(Game.GameStatus.SCHEDULED)
                .build();

        // Set up participation
        participation = GameParticipation.builder()
                .participationId(UUID.randomUUID())
                .game(game)
                .user(participant)
                .sport(testSport)
                .attendanceStatus(GameParticipation.AttendanceStatus.UNKNOWN)
                .build();
    }

    @Nested
    @DisplayName("getPendingAttendance Tests")
    class GetPendingAttendanceTests {

        @Test
        @DisplayName("Should return pending list for organizer")
        void getPendingAttendance_whenOrganizer_shouldReturnList() {
            UUID gameId = game.getGameId();
            UUID organizerId = organizer.getUserId();
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
            when(participationRepository.findForAttendanceConfirmation(gameId))
                    .thenReturn(List.of(participation));

            var result = reliabilityService.getPendingAttendance(gameId, organizerId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getParticipationId()).isEqualTo(participation.getParticipationId().toString());
            assertThat(result.get(0).getUserId()).isEqualTo(participant.getUserId().toString());
            assertThat(result.get(0).getSportId()).isEqualTo(testSport.getSportId().toString());
            assertThat(result.get(0).getAttendanceStatus()).isEqualTo("UNKNOWN");
            verify(gameRepository).findById(gameId);
            verify(participationRepository).findForAttendanceConfirmation(gameId);
        }

        @Test
        @DisplayName("Should return empty list when no pending participants")
        void getPendingAttendance_whenNone_shouldReturnEmpty() {
            UUID gameId = game.getGameId();
            UUID organizerId = organizer.getUserId();
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
            when(participationRepository.findForAttendanceConfirmation(gameId))
                    .thenReturn(List.of());

            var result = reliabilityService.getPendingAttendance(gameId, organizerId);

            assertThat(result).isEmpty();
            verify(gameRepository).findById(gameId);
            verify(participationRepository).findForAttendanceConfirmation(gameId);
        }

        @Test
        @DisplayName("Should throw when non-organizer requests pending attendance")
        void getPendingAttendance_whenNonOrganizer_shouldThrow() {
            UUID gameId = game.getGameId();
            UUID nonOrganizerId = UUID.randomUUID();
            when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

            assertThatThrownBy(() -> reliabilityService.getPendingAttendance(gameId, nonOrganizerId))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only the organizer can view attendance");

            verify(gameRepository).findById(gameId);
            verify(participationRepository, never()).findForAttendanceConfirmation(any());
        }

        @Test
        @DisplayName("Should throw when game not found")
        void getPendingAttendance_whenGameNotFound_shouldThrow() {
            UUID gameId = UUID.randomUUID();
            UUID organizerId = organizer.getUserId();
            when(gameRepository.findById(gameId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reliabilityService.getPendingAttendance(gameId, organizerId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Game not found");

            verify(gameRepository).findById(gameId);
            verify(participationRepository, never()).findForAttendanceConfirmation(any());
        }
    }

    @Nested
    @DisplayName("confirmAttendance Tests")
    class ConfirmAttendanceTests {

        @Test
        @DisplayName("Should log score history when participant attends")
        void confirmAttendance_whenAttended_shouldLogScoreHistory() {
            // Arrange
            UUID gameId = game.getGameId();
            UUID organizerId = organizer.getUserId();

            AttendanceDto.ConfirmRequest request = AttendanceDto.ConfirmRequest.builder()
                    .attendances(List.of(
                            AttendanceDto.AttendanceEntry.builder()
                                    .participationId(participation.getParticipationId().toString())
                                    .attendanceStatus("ATTENDED")
                                    .build()
                    ))
                    .build();

            when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
            when(participationRepository.findForAttendanceConfirmation(gameId))
                    .thenReturn(List.of(participation));
            when(userRepository.save(any(User.class))).thenReturn(participant);
            when(participationRepository.save(any(GameParticipation.class))).thenReturn(participation);
            when(scoreHistoryRepository.save(any(ScoreHistory.class))).thenAnswer(i -> i.getArgument(0));
            when(gameRepository.save(any(Game.class))).thenReturn(game);

            // Act
            AttendanceDto.AttendanceResponse response = reliabilityService.confirmAttendance(
                    gameId, organizerId, request);

            // Assert
            assertThat(response.getAttendedCount()).isEqualTo(1);
            assertThat(response.getNoShowCount()).isEqualTo(0);

            // Verify score history was logged
            verify(scoreHistoryRepository).save(scoreHistoryCaptor.capture());
            ScoreHistory savedHistory = scoreHistoryCaptor.getValue();

            assertThat(savedHistory.getUser()).isEqualTo(participant);
            assertThat(savedHistory.getGame()).isEqualTo(game);
            assertThat(savedHistory.getReason()).isEqualTo(ScoreHistory.ScoreChangeReason.ATTENDANCE);
            assertThat(savedHistory.getPreviousScore()).isEqualTo(100.0f);
            assertThat(savedHistory.getDescription()).contains("Attended game");
        }

        @Test
        @DisplayName("Should log score history when participant no-shows")
        void confirmAttendance_whenNoShow_shouldLogScoreHistory() {
            // Arrange
            UUID gameId = game.getGameId();
            UUID organizerId = organizer.getUserId();

            AttendanceDto.ConfirmRequest request = AttendanceDto.ConfirmRequest.builder()
                    .attendances(List.of(
                            AttendanceDto.AttendanceEntry.builder()
                                    .participationId(participation.getParticipationId().toString())
                                    .attendanceStatus("NO_SHOW")
                                    .build()
                    ))
                    .build();

            when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
            when(participationRepository.findForAttendanceConfirmation(gameId))
                    .thenReturn(List.of(participation));
            when(userRepository.save(any(User.class))).thenReturn(participant);
            when(participationRepository.save(any(GameParticipation.class))).thenReturn(participation);
            when(scoreHistoryRepository.save(any(ScoreHistory.class))).thenAnswer(i -> i.getArgument(0));
            when(gameRepository.save(any(Game.class))).thenReturn(game);

            // Act
            AttendanceDto.AttendanceResponse response = reliabilityService.confirmAttendance(
                    gameId, organizerId, request);

            // Assert
            assertThat(response.getAttendedCount()).isEqualTo(0);
            assertThat(response.getNoShowCount()).isEqualTo(1);

            // Verify score history was logged with NO_SHOW reason
            verify(scoreHistoryRepository).save(scoreHistoryCaptor.capture());
            ScoreHistory savedHistory = scoreHistoryCaptor.getValue();

            assertThat(savedHistory.getReason()).isEqualTo(ScoreHistory.ScoreChangeReason.NO_SHOW);
            assertThat(savedHistory.getDescription()).contains("No-show");
            assertThat(savedHistory.getDelta()).isLessThan(0); // Score should decrease
        }

        @Test
        @DisplayName("Should calculate correct reliability score after no-show")
        void confirmAttendance_whenNoShow_shouldCalculateCorrectScore() {
            // Arrange - participant has 5 attended, 0 no-shows
            // After no-show: 5 attended, 1 no-show, 6 total → 5/6 * 100 = 83.33%
            UUID gameId = game.getGameId();
            UUID organizerId = organizer.getUserId();

            AttendanceDto.ConfirmRequest request = AttendanceDto.ConfirmRequest.builder()
                    .attendances(List.of(
                            AttendanceDto.AttendanceEntry.builder()
                                    .participationId(participation.getParticipationId().toString())
                                    .attendanceStatus("NO_SHOW")
                                    .build()
                    ))
                    .build();

            when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
            when(participationRepository.findForAttendanceConfirmation(gameId))
                    .thenReturn(List.of(participation));
            when(userRepository.save(any(User.class))).thenReturn(participant);
            when(participationRepository.save(any(GameParticipation.class))).thenReturn(participation);
            when(scoreHistoryRepository.save(any(ScoreHistory.class))).thenAnswer(i -> i.getArgument(0));
            when(gameRepository.save(any(Game.class))).thenReturn(game);

            // Act
            reliabilityService.confirmAttendance(gameId, organizerId, request);

            // Assert - verify user was saved with correct score
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();

            assertThat(savedUser.getNoShowCount()).isEqualTo(1);
            assertThat(savedUser.getGamesCount()).isEqualTo(6);
            // 5/6 * 100 = 83.33...
            assertThat(savedUser.getReliabilityScore()).isCloseTo(83.33f, within(0.1f));
        }

        @Test
        @DisplayName("Should throw exception when game not found")
        void confirmAttendance_whenGameNotFound_shouldThrowException() {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID organizerId = organizer.getUserId();
            AttendanceDto.ConfirmRequest request = AttendanceDto.ConfirmRequest.builder()
                    .attendances(List.of())
                    .build();

            when(gameRepository.findById(gameId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> reliabilityService.confirmAttendance(gameId, organizerId, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Game not found");
        }

        @Test
        @DisplayName("Should throw exception when non-organizer tries to confirm")
        void confirmAttendance_whenNotOrganizer_shouldThrowException() {
            // Arrange
            UUID gameId = game.getGameId();
            UUID nonOrganizerId = UUID.randomUUID(); // Not the organizer
            AttendanceDto.ConfirmRequest request = AttendanceDto.ConfirmRequest.builder()
                    .attendances(List.of())
                    .build();

            when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

            // Act & Assert
            assertThatThrownBy(() -> reliabilityService.confirmAttendance(gameId, nonOrganizerId, request))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only the organizer");
        }

        @Test
        @DisplayName("Should be idempotent - skip already confirmed attendance")
        void confirmAttendance_whenAlreadyConfirmed_shouldSkip() {
            // Arrange - participation already confirmed
            participation.setAttendanceStatus(GameParticipation.AttendanceStatus.ATTENDED);

            UUID gameId = game.getGameId();
            UUID organizerId = organizer.getUserId();

            AttendanceDto.ConfirmRequest request = AttendanceDto.ConfirmRequest.builder()
                    .attendances(List.of(
                            AttendanceDto.AttendanceEntry.builder()
                                    .participationId(participation.getParticipationId().toString())
                                    .attendanceStatus("NO_SHOW") // Trying to change to no-show
                                    .build()
                    ))
                    .build();

            when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
            when(participationRepository.findForAttendanceConfirmation(gameId))
                    .thenReturn(List.of(participation));
            when(gameRepository.save(any(Game.class))).thenReturn(game);

            // Act
            AttendanceDto.AttendanceResponse response = reliabilityService.confirmAttendance(
                    gameId, organizerId, request);

            // Assert - should not process already confirmed
            assertThat(response.getAttendedCount()).isEqualTo(0);
            assertThat(response.getNoShowCount()).isEqualTo(0);

            // Verify no score history was logged
            verify(scoreHistoryRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getScoreHistory Tests")
    class GetScoreHistoryTests {

        @Test
        @DisplayName("Should return score history in most recent first order")
        void getScoreHistory_shouldReturnMostRecentFirst() {
            // Arrange
            UUID userId = participant.getUserId();

            ScoreHistory history1 = ScoreHistory.builder()
                    .scoreHistoryId(UUID.randomUUID())
                    .user(participant)
                    .previousScore(100.0f)
                    .newScore(90.0f)
                    .delta(-10.0f)
                    .reason(ScoreHistory.ScoreChangeReason.NO_SHOW)
                    .createdAt(Instant.now().minusSeconds(3600)) // 1 hour ago
                    .build();

            ScoreHistory history2 = ScoreHistory.builder()
                    .scoreHistoryId(UUID.randomUUID())
                    .user(participant)
                    .previousScore(90.0f)
                    .newScore(92.0f)
                    .delta(2.0f)
                    .reason(ScoreHistory.ScoreChangeReason.ATTENDANCE)
                    .createdAt(Instant.now()) // Now (most recent)
                    .build();

            // Return in most recent first order
            Page<ScoreHistory> page = new PageImpl<>(List.of(history2, history1));

            when(userRepository.findActiveById(userId)).thenReturn(Optional.of(participant));
            when(scoreHistoryRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any(PageRequest.class)))
                    .thenReturn(page);

            // Act
            ScoreHistoryDto.ScoreHistoryResponse response = reliabilityService.getScoreHistory(userId, 0, 10);

            // Assert
            assertThat(response.getHistory()).hasSize(2);
            assertThat(response.getHistory().get(0).getReason()).isEqualTo("ATTENDANCE"); // Most recent
            assertThat(response.getHistory().get(1).getReason()).isEqualTo("NO_SHOW"); // Older
            assertThat(response.getUserId()).isEqualTo(userId.toString());
            assertThat(response.getDisplayName()).isEqualTo("Participant");
        }

        @Test
        @DisplayName("Should return empty history for new user")
        void getScoreHistory_whenNoHistory_shouldReturnEmpty() {
            // Arrange
            UUID userId = participant.getUserId();
            Page<ScoreHistory> emptyPage = new PageImpl<>(List.of());

            when(userRepository.findActiveById(userId)).thenReturn(Optional.of(participant));
            when(scoreHistoryRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any(PageRequest.class)))
                    .thenReturn(emptyPage);

            // Act
            ScoreHistoryDto.ScoreHistoryResponse response = reliabilityService.getScoreHistory(userId, 0, 10);

            // Assert
            assertThat(response.getHistory()).isEmpty();
            assertThat(response.getTotalEntries()).isEqualTo(0);
            assertThat(response.getCurrentScore()).isEqualTo(100.0f);
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void getScoreHistory_whenUserNotFound_shouldThrowException() {
            // Arrange
            UUID userId = UUID.randomUUID();
            when(userRepository.findActiveById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> reliabilityService.getScoreHistory(userId, 0, 10))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("Should include pagination info in response")
        void getScoreHistory_shouldIncludePaginationInfo() {
            // Arrange
            UUID userId = participant.getUserId();

            List<ScoreHistory> historyList = new ArrayList<>();
            for (int i = 0; i < 5; i++) {
                historyList.add(ScoreHistory.builder()
                        .scoreHistoryId(UUID.randomUUID())
                        .user(participant)
                        .previousScore(100.0f - i)
                        .newScore(99.0f - i)
                        .delta(-1.0f)
                        .reason(ScoreHistory.ScoreChangeReason.NO_SHOW)
                        .createdAt(Instant.now().minusSeconds(i * 3600))
                        .build());
            }

            Page<ScoreHistory> page = new PageImpl<>(historyList, PageRequest.of(0, 10), 25);

            when(userRepository.findActiveById(userId)).thenReturn(Optional.of(participant));
            when(scoreHistoryRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any(PageRequest.class)))
                    .thenReturn(page);

            // Act
            ScoreHistoryDto.ScoreHistoryResponse response = reliabilityService.getScoreHistory(userId, 0, 10);

            // Assert
            assertThat(response.getCurrentPage()).isEqualTo(0);
            assertThat(response.getTotalEntries()).isEqualTo(25);
            assertThat(response.getTotalPages()).isEqualTo(3); // 25 items / 10 per page
        }
    }

    @Nested
    @DisplayName("getScoreSummary Tests")
    class GetScoreSummaryTests {

        @Test
        @DisplayName("Should return correct score summary")
        void getScoreSummary_shouldReturnCorrectSummary() {
            // Arrange
            UUID userId = participant.getUserId();
            participant.setAttendedCount(8);
            participant.setNoShowCount(2);
            participant.setGamesCount(10);
            participant.setReliabilityScore(80.0f);

            when(userRepository.findActiveById(userId)).thenReturn(Optional.of(participant));

            // Act
            ScoreHistoryDto.ScoreSummary summary = reliabilityService.getScoreSummary(userId);

            // Assert
            assertThat(summary.getCurrentScore()).isEqualTo(80.0f);
            assertThat(summary.getAttendedCount()).isEqualTo(8);
            assertThat(summary.getNoShowCount()).isEqualTo(2);
            assertThat(summary.getGamesCount()).isEqualTo(10);
            assertThat(summary.getAttendanceRate()).isEqualTo(80.0f); // 8/10 * 100
        }

        @Test
        @DisplayName("Should return 100% attendance rate for new user")
        void getScoreSummary_whenNoGames_shouldReturn100Percent() {
            // Arrange
            UUID userId = participant.getUserId();
            participant.setAttendedCount(0);
            participant.setNoShowCount(0);
            participant.setGamesCount(0);
            participant.setReliabilityScore(100.0f);

            when(userRepository.findActiveById(userId)).thenReturn(Optional.of(participant));

            // Act
            ScoreHistoryDto.ScoreSummary summary = reliabilityService.getScoreSummary(userId);

            // Assert
            assertThat(summary.getAttendanceRate()).isEqualTo(100.0f);
        }
    }

    @Nested
    @DisplayName("getUserReliability Tests")
    class GetUserReliabilityTests {

        @Test
        @DisplayName("Should return reliability info")
        void getUserReliability_shouldReturnReliabilityInfo() {
            // Arrange
            UUID userId = participant.getUserId();
            participant.setReliabilityScore(85.0f);
            participant.setAttendedCount(17);
            participant.setNoShowCount(3);
            participant.setGamesCount(20);

            when(userRepository.findActiveById(userId)).thenReturn(Optional.of(participant));

            // Act
            ReliabilityService.ReliabilityInfo info = reliabilityService.getUserReliability(userId);

            // Assert
            assertThat(info.score()).isEqualTo(85.0f);
            assertThat(info.attended()).isEqualTo(17);
            assertThat(info.noShows()).isEqualTo(3);
            assertThat(info.total()).isEqualTo(20);
        }
    }
}
