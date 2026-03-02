package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.StatsDto;
import com.backend.playlocal.service.StatsService;
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

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for StatsController.
 * US-7.6: Stats & Analytics Dashboard + Metric Explanations
 */
@ExtendWith(MockitoExtension.class)
class StatsControllerTest {

    @Mock
    private StatsService statsService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private StatsController statsController;

    private UUID testUserId;

    private StatsDto.StatsResponse dataResponse;
    private StatsDto.StatsResponse emptyResponse;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(testUserId.toString());

        dataResponse = StatsDto.StatsResponse.builder()
                .metric("test_metric")
                .value(75.0)
                .timeframe("30")
                .dataPoints(List.of(
                        StatsDto.DataPoint.builder().date("2025-01").value(75.0).build()))
                .empty(false)
                .build();

        emptyResponse = StatsDto.StatsResponse.builder()
                .metric("test_metric")
                .timeframe("30")
                .dataPoints(List.of())
                .empty(true)
                .build();
    }

    // -------------------------------------------------------------------------
    // GET /api/v1/stats/win-rate
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/v1/stats/win-rate")
    class GetWinRateTests {

        @Test
        @DisplayName("Returns 200 with data response for authenticated user")
        void getWinRate_withData_returns200() {
            when(statsService.getWinRate(eq(testUserId), eq("30"))).thenReturn(dataResponse);

            ResponseEntity<StatsDto.StatsResponse> result =
                    statsController.getWinRate("30", authentication);

            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).isNotNull();
            assertThat(result.getBody().isEmpty()).isFalse();
            assertThat(result.getBody().getValue()).isEqualTo(75.0);
        }

        @Test
        @DisplayName("Returns 200 with empty response when user has no data")
        void getWinRate_noData_returns200WithEmpty() {
            when(statsService.getWinRate(eq(testUserId), eq("30"))).thenReturn(emptyResponse);

            ResponseEntity<StatsDto.StatsResponse> result =
                    statsController.getWinRate("30", authentication);

            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).isNotNull();
            assertThat(result.getBody().isEmpty()).isTrue();
            assertThat(result.getBody().getValue()).isNull();
            assertThat(result.getBody().getDataPoints()).isEmpty();
        }

        @Test
        @DisplayName("Passes timeframe parameter to service")
        void getWinRate_passesTimeframeToService() {
            when(statsService.getWinRate(any(UUID.class), eq("90"))).thenReturn(dataResponse);

            statsController.getWinRate("90", authentication);

            verify(statsService).getWinRate(testUserId, "90");
        }

        @Test
        @DisplayName("Passes all-time timeframe to service")
        void getWinRate_allTimeframe_passedCorrectly() {
            when(statsService.getWinRate(any(UUID.class), eq("all"))).thenReturn(dataResponse);

            statsController.getWinRate("all", authentication);

            verify(statsService).getWinRate(testUserId, "all");
        }

        @Test
        @DisplayName("Propagates IllegalArgumentException for invalid timeframe")
        void getWinRate_invalidTimeframe_propagatesException() {
            when(statsService.getWinRate(any(UUID.class), eq("7")))
                    .thenThrow(new IllegalArgumentException("Invalid timeframe '7'"));

            assertThatThrownBy(() -> statsController.getWinRate("7", authentication))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid timeframe '7'");
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/v1/stats/skill-trend
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/v1/stats/skill-trend")
    class GetSkillTrendTests {

        @Test
        @DisplayName("Returns 200 with skill trend data")
        void getSkillTrend_withData_returns200() {
            when(statsService.getSkillTrend(eq(testUserId), eq("30"))).thenReturn(dataResponse);

            ResponseEntity<StatsDto.StatsResponse> result =
                    statsController.getSkillTrend("30", authentication);

            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody().isEmpty()).isFalse();
        }

        @Test
        @DisplayName("Returns 200 with empty response for new user with no score history")
        void getSkillTrend_noHistory_returns200WithEmpty() {
            when(statsService.getSkillTrend(eq(testUserId), eq("30"))).thenReturn(emptyResponse);

            ResponseEntity<StatsDto.StatsResponse> result =
                    statsController.getSkillTrend("30", authentication);

            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody().isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Passes correct userId extracted from authentication")
        void getSkillTrend_passesUserIdFromAuthentication() {
            when(statsService.getSkillTrend(any(UUID.class), any())).thenReturn(dataResponse);

            statsController.getSkillTrend("30", authentication);

            verify(statsService).getSkillTrend(testUserId, "30");
        }

        @Test
        @DisplayName("Propagates IllegalArgumentException for invalid timeframe")
        void getSkillTrend_invalidTimeframe_propagatesException() {
            when(statsService.getSkillTrend(any(UUID.class), eq("invalid")))
                    .thenThrow(new IllegalArgumentException("Invalid timeframe 'invalid'"));

            assertThatThrownBy(() -> statsController.getSkillTrend("invalid", authentication))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/v1/stats/attendance-rate
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/v1/stats/attendance-rate")
    class GetAttendanceRateTests {

        @Test
        @DisplayName("Returns 200 with attendance rate data")
        void getAttendanceRate_withData_returns200() {
            when(statsService.getAttendanceRate(eq(testUserId), eq("30"))).thenReturn(dataResponse);

            ResponseEntity<StatsDto.StatsResponse> result =
                    statsController.getAttendanceRate("30", authentication);

            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody().getValue()).isEqualTo(75.0);
        }

        @Test
        @DisplayName("Returns 200 with empty response when user has no games")
        void getAttendanceRate_noGames_returns200WithEmpty() {
            when(statsService.getAttendanceRate(eq(testUserId), eq("30"))).thenReturn(emptyResponse);

            ResponseEntity<StatsDto.StatsResponse> result =
                    statsController.getAttendanceRate("30", authentication);

            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody().isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Passes 90-day timeframe to service")
        void getAttendanceRate_90DayTimeframe_passedToService() {
            when(statsService.getAttendanceRate(any(UUID.class), eq("90"))).thenReturn(dataResponse);

            statsController.getAttendanceRate("90", authentication);

            verify(statsService).getAttendanceRate(testUserId, "90");
        }

        @Test
        @DisplayName("Propagates IllegalArgumentException for invalid timeframe")
        void getAttendanceRate_invalidTimeframe_propagatesException() {
            when(statsService.getAttendanceRate(any(UUID.class), eq("bad")))
                    .thenThrow(new IllegalArgumentException("Invalid timeframe 'bad'"));

            assertThatThrownBy(() -> statsController.getAttendanceRate("bad", authentication))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
