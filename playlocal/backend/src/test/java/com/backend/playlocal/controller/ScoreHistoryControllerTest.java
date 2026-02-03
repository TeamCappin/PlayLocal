package com.backend.playlocal.controller;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.ScoreHistoryDto;
import com.backend.playlocal.service.ReliabilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ScoreHistoryController.
 * Tests US 2.7: Users can view Score History on their profile
 */
@ExtendWith(MockitoExtension.class)
class ScoreHistoryControllerTest {

    @Mock
    private ReliabilityService reliabilityService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ScoreHistoryController scoreHistoryController;

    private UUID testUserId;
    private ScoreHistoryDto.ScoreHistoryResponse mockHistoryResponse;
    private ScoreHistoryDto.ScoreSummary mockSummary;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        // Set up mock score history entry
        ScoreHistoryDto.ScoreHistoryEntry entry = ScoreHistoryDto.ScoreHistoryEntry.builder()
                .scoreHistoryId(UUID.randomUUID().toString())
                .userId(testUserId.toString())
                .gameId(UUID.randomUUID().toString())
                .gameTitle("Test Basketball Game")
                .previousScore(100.0f)
                .newScore(95.0f)
                .delta(-5.0f)
                .reason("NO_SHOW")
                .description("No-show for game: Test Basketball Game")
                .createdAt("2024-12-20T10:00:00Z")
                .createdByUserId(UUID.randomUUID().toString())
                .createdByDisplayName("Organizer")
                .build();

        // Set up mock history response
        mockHistoryResponse = ScoreHistoryDto.ScoreHistoryResponse.builder()
                .userId(testUserId.toString())
                .displayName("Test User")
                .currentScore(95.0f)
                .history(List.of(entry))
                .totalEntries(1)
                .currentPage(0)
                .totalPages(1)
                .build();

        // Set up mock summary
        mockSummary = ScoreHistoryDto.ScoreSummary.builder()
                .userId(testUserId.toString())
                .currentScore(95.0f)
                .attendedCount(19)
                .noShowCount(1)
                .gamesCount(20)
                .attendanceRate(95.0f)
                .build();
    }

    @Nested
    @DisplayName("GET /{userId}/score-history Tests")
    class GetScoreHistoryTests {

        @Test
        @DisplayName("Should return score history with default pagination")
        void getScoreHistory_withDefaultPagination_shouldReturnHistory() {
            // Arrange
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(0), eq(10)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 0, 10);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getUserId()).isEqualTo(testUserId.toString());
            assertThat(response.getBody().getCurrentScore()).isEqualTo(95.0f);
            assertThat(response.getBody().getHistory()).hasSize(1);

            verify(reliabilityService).getScoreHistory(testUserId, 0, 10);
        }

        @Test
        @DisplayName("Should return score history with custom pagination")
        void getScoreHistory_withCustomPagination_shouldReturnHistory() {
            // Arrange
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(2), eq(25)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 2, 25);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(reliabilityService).getScoreHistory(testUserId, 2, 25);
        }

        @Test
        @DisplayName("Should cap page size at 50")
        void getScoreHistory_withLargeSize_shouldCapAt50() {
            // Arrange
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(0), eq(50)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 0, 100);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            // Verify that size is capped at 50 (Math.min(100, 50) = 50)
            verify(reliabilityService).getScoreHistory(testUserId, 0, 50);
        }

        @Test
        @DisplayName("Should handle empty history")
        void getScoreHistory_whenEmpty_shouldReturnEmptyList() {
            // Arrange
            ScoreHistoryDto.ScoreHistoryResponse emptyResponse = ScoreHistoryDto.ScoreHistoryResponse.builder()
                    .userId(testUserId.toString())
                    .displayName("Test User")
                    .currentScore(100.0f)
                    .history(Collections.emptyList())
                    .totalEntries(0)
                    .currentPage(0)
                    .totalPages(0)
                    .build();

            when(reliabilityService.getScoreHistory(eq(testUserId), anyInt(), anyInt()))
                    .thenReturn(emptyResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 0, 10);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getHistory()).isEmpty();
            assertThat(response.getBody().getTotalEntries()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should throw exception for invalid UUID format")
        void getScoreHistory_withInvalidUUID_shouldThrowException() {
            // Act & Assert
            assertThatThrownBy(() ->
                    scoreHistoryController.getScoreHistory("invalid-uuid", 0, 10))
                    .isInstanceOf(IllegalArgumentException.class);

            verify(reliabilityService, never()).getScoreHistory(any(), anyInt(), anyInt());
        }

        @Test
        @DisplayName("Should propagate ResourceNotFoundException when user not found")
        void getScoreHistory_whenUserNotFound_shouldThrowException() {
            // Arrange
            when(reliabilityService.getScoreHistory(eq(testUserId), anyInt(), anyInt()))
                    .thenThrow(new ResourceNotFoundException("User not found"));

            // Act & Assert
            assertThatThrownBy(() ->
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 0, 10))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("GET /me/score-history Tests")
    class GetMyScoreHistoryTests {

        @Test
        @DisplayName("Should return authenticated user's score history")
        void getMyScoreHistory_whenAuthenticated_shouldReturnHistory() {
            // Arrange
            when(authentication.getName()).thenReturn(testUserId.toString());
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(0), eq(10)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getMyScoreHistory(authentication, 0, 10);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getUserId()).isEqualTo(testUserId.toString());

            verify(authentication).getName();
            verify(reliabilityService).getScoreHistory(testUserId, 0, 10);
        }

        @Test
        @DisplayName("Should cap page size at 50 for authenticated user")
        void getMyScoreHistory_withLargeSize_shouldCapAt50() {
            // Arrange
            when(authentication.getName()).thenReturn(testUserId.toString());
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(0), eq(50)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getMyScoreHistory(authentication, 0, 200);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            // Verify that size is capped at 50
            verify(reliabilityService).getScoreHistory(testUserId, 0, 50);
        }

        @Test
        @DisplayName("Should use custom pagination parameters")
        void getMyScoreHistory_withCustomPagination_shouldPassParameters() {
            // Arrange
            when(authentication.getName()).thenReturn(testUserId.toString());
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(5), eq(20)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getMyScoreHistory(authentication, 5, 20);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(reliabilityService).getScoreHistory(testUserId, 5, 20);
        }
    }

    @Nested
    @DisplayName("GET /{userId}/score-summary Tests")
    class GetScoreSummaryTests {

        @Test
        @DisplayName("Should return score summary for valid user")
        void getScoreSummary_withValidUser_shouldReturnSummary() {
            // Arrange
            when(reliabilityService.getScoreSummary(eq(testUserId)))
                    .thenReturn(mockSummary);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreSummary> response =
                    scoreHistoryController.getScoreSummary(testUserId.toString());

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getUserId()).isEqualTo(testUserId.toString());
            assertThat(response.getBody().getCurrentScore()).isEqualTo(95.0f);
            assertThat(response.getBody().getAttendedCount()).isEqualTo(19);
            assertThat(response.getBody().getNoShowCount()).isEqualTo(1);
            assertThat(response.getBody().getGamesCount()).isEqualTo(20);
            assertThat(response.getBody().getAttendanceRate()).isEqualTo(95.0f);

            verify(reliabilityService).getScoreSummary(testUserId);
        }

        @Test
        @DisplayName("Should throw exception for invalid UUID format")
        void getScoreSummary_withInvalidUUID_shouldThrowException() {
            // Act & Assert
            assertThatThrownBy(() ->
                    scoreHistoryController.getScoreSummary("not-a-valid-uuid"))
                    .isInstanceOf(IllegalArgumentException.class);

            verify(reliabilityService, never()).getScoreSummary(any());
        }

        @Test
        @DisplayName("Should propagate ResourceNotFoundException when user not found")
        void getScoreSummary_whenUserNotFound_shouldThrowException() {
            // Arrange
            when(reliabilityService.getScoreSummary(eq(testUserId)))
                    .thenThrow(new ResourceNotFoundException("User not found"));

            // Act & Assert
            assertThatThrownBy(() ->
                    scoreHistoryController.getScoreSummary(testUserId.toString()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("Should return summary for new user with no games")
        void getScoreSummary_forNewUser_shouldReturnDefaultValues() {
            // Arrange
            ScoreHistoryDto.ScoreSummary newUserSummary = ScoreHistoryDto.ScoreSummary.builder()
                    .userId(testUserId.toString())
                    .currentScore(100.0f)
                    .attendedCount(0)
                    .noShowCount(0)
                    .gamesCount(0)
                    .attendanceRate(100.0f)
                    .build();

            when(reliabilityService.getScoreSummary(eq(testUserId)))
                    .thenReturn(newUserSummary);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreSummary> response =
                    scoreHistoryController.getScoreSummary(testUserId.toString());

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getCurrentScore()).isEqualTo(100.0f);
            assertThat(response.getBody().getGamesCount()).isEqualTo(0);
            assertThat(response.getBody().getAttendanceRate()).isEqualTo(100.0f);
        }
    }

    @Nested
    @DisplayName("GET /me/score-summary Tests")
    class GetMyScoreSummaryTests {

        @Test
        @DisplayName("Should return authenticated user's score summary")
        void getMyScoreSummary_whenAuthenticated_shouldReturnSummary() {
            // Arrange
            when(authentication.getName()).thenReturn(testUserId.toString());
            when(reliabilityService.getScoreSummary(eq(testUserId)))
                    .thenReturn(mockSummary);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreSummary> response =
                    scoreHistoryController.getMyScoreSummary(authentication);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getUserId()).isEqualTo(testUserId.toString());
            assertThat(response.getBody().getCurrentScore()).isEqualTo(95.0f);

            verify(authentication).getName();
            verify(reliabilityService).getScoreSummary(testUserId);
        }

        @Test
        @DisplayName("Should propagate exception when service fails")
        void getMyScoreSummary_whenServiceFails_shouldThrowException() {
            // Arrange
            when(authentication.getName()).thenReturn(testUserId.toString());
            when(reliabilityService.getScoreSummary(eq(testUserId)))
                    .thenThrow(new ResourceNotFoundException("User not found"));

            // Act & Assert
            assertThatThrownBy(() ->
                    scoreHistoryController.getMyScoreSummary(authentication))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("Edge Cases and Boundary Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle page size of exactly 50")
        void getScoreHistory_withExactly50_shouldNotCap() {
            // Arrange
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(0), eq(50)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 0, 50);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(reliabilityService).getScoreHistory(testUserId, 0, 50);
        }

        @Test
        @DisplayName("Should handle page size of 51 (just over limit)")
        void getScoreHistory_with51_shouldCapTo50() {
            // Arrange
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(0), eq(50)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 0, 51);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(reliabilityService).getScoreHistory(testUserId, 0, 50);
        }

        @Test
        @DisplayName("Should handle page number 0")
        void getScoreHistory_withPageZero_shouldWork() {
            // Arrange
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(0), eq(10)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 0, 10);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(reliabilityService).getScoreHistory(testUserId, 0, 10);
        }

        @Test
        @DisplayName("Should handle high page numbers")
        void getScoreHistory_withHighPageNumber_shouldWork() {
            // Arrange
            ScoreHistoryDto.ScoreHistoryResponse emptyPageResponse = ScoreHistoryDto.ScoreHistoryResponse.builder()
                    .userId(testUserId.toString())
                    .displayName("Test User")
                    .currentScore(95.0f)
                    .history(Collections.emptyList())
                    .totalEntries(5)
                    .currentPage(100)
                    .totalPages(1)
                    .build();

            when(reliabilityService.getScoreHistory(eq(testUserId), eq(100), eq(10)))
                    .thenReturn(emptyPageResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 100, 10);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().getHistory()).isEmpty();
        }

        @Test
        @DisplayName("Should handle minimum page size of 1")
        void getScoreHistory_withSizeOne_shouldWork() {
            // Arrange
            when(reliabilityService.getScoreHistory(eq(testUserId), eq(0), eq(1)))
                    .thenReturn(mockHistoryResponse);

            // Act
            ResponseEntity<ScoreHistoryDto.ScoreHistoryResponse> response =
                    scoreHistoryController.getScoreHistory(testUserId.toString(), 0, 1);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(reliabilityService).getScoreHistory(testUserId, 0, 1);
        }
    }
}