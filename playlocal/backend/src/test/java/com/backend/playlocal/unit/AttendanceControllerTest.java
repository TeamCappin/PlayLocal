package com.backend.playlocal.unit;

import com.backend.playlocal.controller.AttendanceController;
import com.backend.playlocal.model.dto.AttendanceDto;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AttendanceController.
 * US-2.6 / US-3.1: Post-game attendance confirmation (organizer workflow).
 */
@ExtendWith(MockitoExtension.class)
class AttendanceControllerTest {

    @Mock
    private ReliabilityService reliabilityService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AttendanceController attendanceController;

    private UUID gameId;
    private UUID organizerId;
    private List<AttendanceDto.AttendanceEntry> mockPending;
    private AttendanceDto.AttendanceResponse mockResponse;

    @BeforeEach
    void setUp() {
        gameId = UUID.randomUUID();
        organizerId = UUID.randomUUID();

        mockPending = List.of(
                AttendanceDto.AttendanceEntry.builder()
                        .participationId(UUID.randomUUID().toString())
                        .attendanceStatus("ATTENDED")
                        .userId(UUID.randomUUID().toString())
                        .sportId(UUID.randomUUID().toString())
                        .requestedPositionRoleId("role-1")
                        .build()
        );

        mockResponse = AttendanceDto.AttendanceResponse.builder()
                .gameId(gameId.toString())
                .attendedCount(1)
                .noShowCount(0)
                .updatedScores(Collections.emptyList())
                .build();
    }

    @Nested
    @DisplayName("GET /api/v1/games/{gameId}/attendance – getPendingAttendance")
    class GetPendingAttendanceTests {

        @Test
        @DisplayName("Should return pending attendance list for organizer")
        void getPendingAttendance_whenOrganizer_shouldReturnList() {
            // Arrange
            when(authentication.getName()).thenReturn(organizerId.toString());
            when(reliabilityService.getPendingAttendance(eq(gameId), eq(organizerId)))
                    .thenReturn(mockPending);

            // Act
            ResponseEntity<List<AttendanceDto.AttendanceEntry>> response =
                    attendanceController.getPendingAttendance(gameId, authentication);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(1);
            assertThat(response.getBody().get(0).getParticipationId()).isNotNull();
            assertThat(response.getBody().get(0).getAttendanceStatus()).isEqualTo("ATTENDED");

            verify(authentication).getName();
            verify(reliabilityService).getPendingAttendance(gameId, organizerId);
        }

        @Test
        @DisplayName("Should return empty list when no pending attendance")
        void getPendingAttendance_whenEmpty_shouldReturnEmptyList() {
            // Arrange
            when(authentication.getName()).thenReturn(organizerId.toString());
            when(reliabilityService.getPendingAttendance(eq(gameId), eq(organizerId)))
                    .thenReturn(Collections.emptyList());

            // Act
            ResponseEntity<List<AttendanceDto.AttendanceEntry>> response =
                    attendanceController.getPendingAttendance(gameId, authentication);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).isEmpty();

            verify(reliabilityService).getPendingAttendance(gameId, organizerId);
        }

        @Test
        @DisplayName("Should propagate AccessDeniedException when non-organizer")
        void getPendingAttendance_whenNonOrganizer_shouldThrow() {
            // Arrange
            when(authentication.getName()).thenReturn(organizerId.toString());
            when(reliabilityService.getPendingAttendance(eq(gameId), eq(organizerId)))
                    .thenThrow(new AccessDeniedException("Only the organizer can view attendance"));

            // Act & Assert
            assertThatThrownBy(() ->
                    attendanceController.getPendingAttendance(gameId, authentication))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only the organizer");

            verify(reliabilityService).getPendingAttendance(gameId, organizerId);
        }
    }

    @Nested
    @DisplayName("POST /api/v1/games/{gameId}/attendance – confirmAttendance")
    class ConfirmAttendanceTests {

        @Test
        @DisplayName("Should confirm attendance and return response")
        void confirmAttendance_whenValid_shouldReturnResponse() {
            // Arrange
            when(authentication.getName()).thenReturn(organizerId.toString());
            AttendanceDto.ConfirmRequest request = AttendanceDto.ConfirmRequest.builder()
                    .attendances(mockPending)
                    .build();
            when(reliabilityService.confirmAttendance(eq(gameId), eq(organizerId), eq(request)))
                    .thenReturn(mockResponse);

            // Act
            ResponseEntity<AttendanceDto.AttendanceResponse> response =
                    attendanceController.confirmAttendance(gameId, request, authentication);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getGameId()).isEqualTo(gameId.toString());
            assertThat(response.getBody().getAttendedCount()).isEqualTo(1);
            assertThat(response.getBody().getNoShowCount()).isEqualTo(0);

            verify(authentication).getName();
            verify(reliabilityService).confirmAttendance(gameId, organizerId, request);
        }

        @Test
        @DisplayName("Should propagate exception when service fails")
        void confirmAttendance_whenServiceFails_shouldThrow() {
            // Arrange
            when(authentication.getName()).thenReturn(organizerId.toString());
            AttendanceDto.ConfirmRequest request = AttendanceDto.ConfirmRequest.builder()
                    .attendances(mockPending)
                    .build();
            when(reliabilityService.confirmAttendance(eq(gameId), eq(organizerId), eq(request)))
                    .thenThrow(new AccessDeniedException("Only the organizer can confirm attendance"));

            // Act & Assert
            assertThatThrownBy(() ->
                    attendanceController.confirmAttendance(gameId, request, authentication))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Only the organizer");

            verify(reliabilityService).confirmAttendance(gameId, organizerId, request);
        }
    }
}
