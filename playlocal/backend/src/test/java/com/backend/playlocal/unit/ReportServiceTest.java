package com.backend.playlocal.unit;

import com.backend.playlocal.config.RateLimitConfig;
import com.backend.playlocal.exception.RateLimitExceededException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.ReportDto;
import com.backend.playlocal.model.entity.Endorsement;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.Report;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.ReportRepository;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for US 1.4 - Report Issue.
 * 
 * Tests cover:
 * 1. Report creation with valid user target
 * 2. Report creation with valid game target
 * 3. Report with both targets (user AND game)
 * 4. Report without any target throws exception
 * 5. Rate limiting enforcement
 * 6. Cannot report yourself
 */
@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

        @Mock
        private ReportRepository reportRepository;

        @Mock
        private UserRepository userRepository;

        @Mock
        private GameRepository gameRepository;

        @Mock
        private EndorsementRepository endorsementRepository;

        @Mock
        private RateLimitConfig rateLimitConfig;

        @Mock
        private RateLimitConfig.ReportLimit reportLimit;

        @InjectMocks
        private ReportService reportService;

        private User reporter;
        private User reportedUser;
        private Game game;
        private UUID reporterId;
        private UUID reportedUserId;
        private UUID gameId;

        @BeforeEach
        void setUp() {
                reporterId = UUID.randomUUID();
                reportedUserId = UUID.randomUUID();
                gameId = UUID.randomUUID();

                reporter = User.builder()
                                .userId(reporterId)
                                .email("reporter@example.com")
                                .displayName("Reporter User")
                                .slug("reporter-user-" + UUID.randomUUID())
                                .status(User.UserStatus.ACTIVE)
                                .build();

                reportedUser = User.builder()
                                .userId(reportedUserId)
                                .email("reported@example.com")
                                .displayName("Reported User")
                                .slug("reported-user-" + UUID.randomUUID())
                                .status(User.UserStatus.ACTIVE)
                                .build();

                game = Game.builder()
                                .gameId(gameId)
                                .title("Test Game")
                                .build();

                when(rateLimitConfig.getReport()).thenReturn(reportLimit);
                when(reportLimit.getMaxPerHour()).thenReturn(2);
        }

        @Test
        @DisplayName("US-1.4: createReport with valid user target succeeds")
        void createReport_WithValidUserTarget_Success() {
                // Given
                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter));
                when(userRepository.findActiveById(reportedUserId)).thenReturn(Optional.of(reportedUser));
                when(reportRepository.countRecentReportsByUser(eq(reporterId), any(Instant.class))).thenReturn(0);
                when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> {
                        Report r = invocation.getArgument(0);
                        r.setReportId(UUID.randomUUID());
                        return r;
                });

                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .reportedUserId(reportedUserId.toString())
                                .reportType("HARASSMENT")
                                .details("This user was harassing me during the game")
                                .build();

                // When
                ReportDto.ReportResponse response = reportService.createReport(request, reporterId);

                // Then
                assertThat(response).isNotNull();
                assertThat(response.getReportId()).isNotNull();
                assertThat(response.getReportedUserId()).isEqualTo(reportedUserId.toString());
                assertThat(response.getReportType()).isEqualTo("HARASSMENT");
                assertThat(response.getStatus()).isEqualTo("OPEN");
                verify(reportRepository).save(any(Report.class));
        }

        @Test
        @DisplayName("US-1.4: createReport with valid game target succeeds")
        void createReport_WithValidGameTarget_Success() {
                // Given
                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter));
                when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
                when(reportRepository.countRecentReportsByUser(eq(reporterId), any(Instant.class))).thenReturn(0);
                when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> {
                        Report r = invocation.getArgument(0);
                        r.setReportId(UUID.randomUUID());
                        return r;
                });

                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .gameId(gameId.toString())
                                .reportType("SAFETY")
                                .details("This game has safety concerns")
                                .build();

                // When
                ReportDto.ReportResponse response = reportService.createReport(request, reporterId);

                // Then
                assertThat(response).isNotNull();
                assertThat(response.getGameId()).isEqualTo(gameId.toString());
                assertThat(response.getReportType()).isEqualTo("SAFETY");
                assertThat(response.getStatus()).isEqualTo("OPEN");
        }

        @Test
        @DisplayName("US-1.4: createReport with both user and game targets succeeds")
        void createReport_WithBothTargets_Success() {
                // Given
                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter));
                when(userRepository.findActiveById(reportedUserId)).thenReturn(Optional.of(reportedUser));
                when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
                when(reportRepository.countRecentReportsByUser(eq(reporterId), any(Instant.class))).thenReturn(0);
                when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> {
                        Report r = invocation.getArgument(0);
                        r.setReportId(UUID.randomUUID());
                        return r;
                });

                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .reportedUserId(reportedUserId.toString())
                                .gameId(gameId.toString())
                                .reportType("SPORTSMANSHIP")
                                .details("Bad sportsmanship during this game")
                                .build();

                // When
                ReportDto.ReportResponse response = reportService.createReport(request, reporterId);

                // Then
                assertThat(response).isNotNull();
                assertThat(response.getReportedUserId()).isEqualTo(reportedUserId.toString());
                assertThat(response.getGameId()).isEqualTo(gameId.toString());
        }

        @Test
        @DisplayName("US-3.3: createReport with valid endorsement target succeeds")
        void createReport_WithValidEndorsementTarget_Success() {
                // Given
                UUID endorsementId = UUID.randomUUID();
                Endorsement endorsement = Endorsement.builder()
                                .endorsementId(endorsementId)
                                .build();

                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter));
                when(endorsementRepository.findById(endorsementId)).thenReturn(Optional.of(endorsement));
                when(reportRepository.countRecentReportsByUser(eq(reporterId), any(Instant.class))).thenReturn(0);
                when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> {
                        Report r = invocation.getArgument(0);
                        r.setReportId(UUID.randomUUID());
                        r.setCreatedAt(Instant.now());
                        return r;
                });

                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .endorsementId(endorsementId.toString())
                                .reportType("SPAM")
                                .details("This endorsement is spam")
                                .build();

                // When
                ReportDto.ReportResponse response = reportService.createReport(request, reporterId);

                // Then
                assertThat(response).isNotNull();
                assertThat(response.getEndorsementId()).isEqualTo(endorsementId.toString());
                assertThat(response.getReportType()).isEqualTo("SPAM");
                assertThat(response.getStatus()).isEqualTo("OPEN");
        }

        @Test
        @DisplayName("US-1.4: createReport without any target throws exception")
        void createReport_WithNoTarget_ThrowsException() {
                // Given
                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter));
                when(reportRepository.countRecentReportsByUser(eq(reporterId), any(Instant.class))).thenReturn(0);

                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .reportType("OTHER")
                                .details("Some issue")
                                .build();

                // When/Then
                assertThatThrownBy(() -> reportService.createReport(request, reporterId))
                                .isInstanceOf(IllegalArgumentException.class)
                                .hasMessageContaining("Must specify either reportedUserId, gameId, or endorsementId");
        }

        @Test
        @DisplayName("US-1.4: createReport rate limit exceeded throws exception (max 2 per hour)")
        void createReport_RateLimitExceeded_ThrowsException() {
                // Given: user already has 2 reports in the last hour (limit is 2)
                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter));
                when(reportRepository.countRecentReportsByUser(eq(reporterId), any(Instant.class))).thenReturn(2);

                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .reportedUserId(reportedUserId.toString())
                                .reportType("SPAM")
                                .details("Spam report")
                                .build();

                // When/Then
                assertThatThrownBy(() -> reportService.createReport(request, reporterId))
                                .isInstanceOf(RateLimitExceededException.class)
                                .hasMessageContaining("Report rate limit exceeded");
        }

        @Test
        @DisplayName("US-1.4: createReport cannot report yourself")
        void createReport_CannotReportSelf_ThrowsException() {
                // Given
                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter));
                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter)); // Same user
                when(reportRepository.countRecentReportsByUser(eq(reporterId), any(Instant.class))).thenReturn(0);

                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .reportedUserId(reporterId.toString()) // Reporting self
                                .reportType("OTHER")
                                .details("Trying to report myself")
                                .build();

                // When/Then
                assertThatThrownBy(() -> reportService.createReport(request, reporterId))
                                .isInstanceOf(IllegalArgumentException.class)
                                .hasMessageContaining("Cannot report yourself");
        }

        @Test
        @DisplayName("US-1.4: createReport with invalid report type throws exception")
        void createReport_InvalidReportType_ThrowsException() {
                // Given
                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter));
                when(userRepository.findActiveById(reportedUserId)).thenReturn(Optional.of(reportedUser));
                when(reportRepository.countRecentReportsByUser(eq(reporterId), any(Instant.class))).thenReturn(0);

                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .reportedUserId(reportedUserId.toString())
                                .reportType("INVALID_TYPE")
                                .details("Some details")
                                .build();

                // When/Then
                assertThatThrownBy(() -> reportService.createReport(request, reporterId))
                                .isInstanceOf(IllegalArgumentException.class)
                                .hasMessageContaining("Invalid report type");
        }

        @Test
        @DisplayName("US-1.4: createReport with non-existent reported user throws exception")
        void createReport_NonExistentReportedUser_ThrowsException() {
                // Given
                when(userRepository.findActiveById(reporterId)).thenReturn(Optional.of(reporter));
                when(userRepository.findActiveById(reportedUserId)).thenReturn(Optional.empty());
                when(reportRepository.countRecentReportsByUser(eq(reporterId), any(Instant.class))).thenReturn(0);

                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .reportedUserId(reportedUserId.toString())
                                .reportType("HARASSMENT")
                                .details("Some details")
                                .build();

                // When/Then
                assertThatThrownBy(() -> reportService.createReport(request, reporterId))
                                .isInstanceOf(ResourceNotFoundException.class)
                                .hasMessageContaining("Reported user not found");
        }
}
