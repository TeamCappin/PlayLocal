package com.backend.playlocal.unit;

import com.backend.playlocal.controller.OrganizerQualityController;
import com.backend.playlocal.model.dto.OrganizerQualityDto;
import com.backend.playlocal.service.OrganizerQualityService;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrganizerQualityController.
 * Implements: US-6.1 - Organizer Quality Score
 */
@ExtendWith(MockitoExtension.class)
class OrganizerQualityControllerTest {

    @Mock
    private OrganizerQualityService oqsService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private OrganizerQualityController controller;

    private UUID testUserId;
    private OrganizerQualityDto.OqsResponse mockOqsResponse;
    private OrganizerQualityDto.OqsSummary mockOqsSummary;
    private OrganizerQualityDto.OqsInfoCard mockInfoCard;
    private OrganizerQualityDto.OqsHistoryResponse mockHistoryResponse;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        mockOqsResponse = OrganizerQualityDto.OqsResponse.builder()
                .userId(testUserId.toString())
                .displayName("Test Organizer")
                .oqsScore(85.5f)
                .gameCompletionRate(90.0f)
                .repeatPlayerRate(80.0f)
                .totalGamesHosted(10)
                .completedGames(9)
                .cancelledGames(1)
                .totalUniquePlayers(50)
                .repeatPlayers(40)
                .confidenceLevel("HIGH")
                .confidenceDescription("Based on 10+ games")
                .lastCalculatedAt("2026-01-01T00:00:00Z")
                .build();

        mockOqsSummary = OrganizerQualityDto.OqsSummary.builder()
                .userId(testUserId.toString())
                .oqsScore(85.5f)
                .confidenceLevel("HIGH")
                .totalGamesHosted(10)
                .build();

        mockInfoCard = OrganizerQualityDto.OqsInfoCard.builder()
                .oqsScore(85.5f)
                .overallDescription("Great organizer!")
                .gameCompletionRate(90.0f)
                .completionRateDescription("9 of 10 games completed")
                .completedGames(9)
                .totalGames(10)
                .repeatPlayerRate(80.0f)
                .repeatRateDescription("40 of 50 players returned")
                .repeatPlayers(40)
                .totalUniquePlayers(50)
                .confidenceLevel("HIGH")
                .confidenceDescription("High confidence based on game history")
                .gamesForNextLevel(0)
                .build();

        OrganizerQualityDto.OqsHistoryEntry historyEntry = OrganizerQualityDto.OqsHistoryEntry.builder()
                .historyId(UUID.randomUUID().toString())
                .organizerId(testUserId.toString())
                .gameId(UUID.randomUUID().toString())
                .gameTitle("Basketball Game")
                .previousOqs(80.0f)
                .newOqs(85.5f)
                .delta(5.5f)
                .previousCompletionRate(85.0f)
                .newCompletionRate(90.0f)
                .previousRepeatRate(75.0f)
                .newRepeatRate(80.0f)
                .reason("GAME_COMPLETED")
                .description("Game completed successfully")
                .createdAt("2026-01-01T00:00:00Z")
                .build();

        mockHistoryResponse = OrganizerQualityDto.OqsHistoryResponse.builder()
                .organizerId(testUserId.toString())
                .displayName("Test Organizer")
                .currentOqs(85.5f)
                .history(List.of(historyEntry))
                .totalEntries(1L)
                .currentPage(0)
                .totalPages(1)
                .build();
    }

    @Nested
    @DisplayName("GET /api/v2/organizers/{organizerId}/oqs")
    class GetOqsTests {

        @Test
        @DisplayName("Should return OQS for valid user ID")
        void getOqs_ValidUserId_ReturnsOqs() {
            when(oqsService.getOqs(testUserId)).thenReturn(mockOqsResponse);

            ResponseEntity<OrganizerQualityDto.OqsResponse> response = controller.getOqs(testUserId.toString());

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getOqsScore()).isEqualTo(85.5f);
            assertThat(response.getBody().getConfidenceLevel()).isEqualTo("HIGH");
            verify(oqsService).getOqs(testUserId);
        }
    }

    @Nested
    @DisplayName("GET /api/v2/organizers/me/oqs")
    class GetMyOqsTests {

        @Test
        @DisplayName("Should return OQS for authenticated user")
        void getMyOqs_AuthenticatedUser_ReturnsOqs() {
            when(authentication.getName()).thenReturn(testUserId.toString());
            when(oqsService.getOrganizerIdForUser(testUserId)).thenReturn(testUserId);
            when(oqsService.getOqs(testUserId)).thenReturn(mockOqsResponse);

            ResponseEntity<OrganizerQualityDto.OqsResponse> response = controller.getMyOqs(authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getUserId()).isEqualTo(testUserId.toString());
            verify(oqsService).getOrganizerIdForUser(testUserId);
            verify(oqsService).getOqs(testUserId);
        }
    }

    @Nested
    @DisplayName("GET /api/v2/organizers/{organizerId}/oqs/summary")
    class GetOqsSummaryTests {

        @Test
        @DisplayName("Should return OQS summary for valid user ID")
        void getOqsSummary_ValidUserId_ReturnsSummary() {
            when(oqsService.getOqsSummary(testUserId)).thenReturn(mockOqsSummary);

            ResponseEntity<OrganizerQualityDto.OqsSummary> response = controller.getOqsSummary(testUserId.toString());

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getOqsScore()).isEqualTo(85.5f);
            assertThat(response.getBody().getTotalGamesHosted()).isEqualTo(10);
            verify(oqsService).getOqsSummary(testUserId);
        }
    }

    @Nested
    @DisplayName("GET /api/v2/organizers/{organizerId}/oqs/info")
    class GetOqsInfoCardTests {

        @Test
        @DisplayName("Should return OQS info card for valid user ID")
        void getOqsInfoCard_ValidUserId_ReturnsInfoCard() {
            when(oqsService.getOqsInfoCard(testUserId)).thenReturn(mockInfoCard);

            ResponseEntity<OrganizerQualityDto.OqsInfoCard> response = controller.getOqsInfoCard(testUserId.toString());

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getOqsScore()).isEqualTo(85.5f);
            assertThat(response.getBody().getOverallDescription()).isEqualTo("Great organizer!");
            verify(oqsService).getOqsInfoCard(testUserId);
        }
    }

    @Nested
    @DisplayName("GET /api/v2/organizers/me/oqs/info")
    class GetMyOqsInfoCardTests {

        @Test
        @DisplayName("Should return OQS info card for authenticated user")
        void getMyOqsInfoCard_AuthenticatedUser_ReturnsInfoCard() {
            when(authentication.getName()).thenReturn(testUserId.toString());
            when(oqsService.getOrganizerIdForUser(testUserId)).thenReturn(testUserId);
            when(oqsService.getOqsInfoCard(testUserId)).thenReturn(mockInfoCard);

            ResponseEntity<OrganizerQualityDto.OqsInfoCard> response = controller.getMyOqsInfoCard(authentication);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getCompletedGames()).isEqualTo(9);
            verify(oqsService).getOrganizerIdForUser(testUserId);
            verify(oqsService).getOqsInfoCard(testUserId);
        }
    }

    @Nested
    @DisplayName("GET /api/v2/organizers/{organizerId}/oqs/history")
    class GetOqsHistoryTests {

        @Test
        @DisplayName("Should return OQS history with default pagination")
        void getOqsHistory_DefaultPagination_ReturnsHistory() {
            when(oqsService.getOqsHistory(testUserId, 0, 10)).thenReturn(mockHistoryResponse);

            ResponseEntity<OrganizerQualityDto.OqsHistoryResponse> response = 
                    controller.getOqsHistory(testUserId.toString(), 0, 10);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getHistory()).hasSize(1);
            assertThat(response.getBody().getTotalEntries()).isEqualTo(1L);
            verify(oqsService).getOqsHistory(testUserId, 0, 10);
        }

        @Test
        @DisplayName("Should cap page size at 50")
        void getOqsHistory_LargePageSize_CapsAt50() {
            when(oqsService.getOqsHistory(testUserId, 0, 50)).thenReturn(mockHistoryResponse);

            ResponseEntity<OrganizerQualityDto.OqsHistoryResponse> response = 
                    controller.getOqsHistory(testUserId.toString(), 0, 100);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(oqsService).getOqsHistory(testUserId, 0, 50);
        }

        @Test
        @DisplayName("Should handle custom pagination")
        void getOqsHistory_CustomPagination_ReturnsHistory() {
            when(oqsService.getOqsHistory(testUserId, 2, 20)).thenReturn(mockHistoryResponse);

            ResponseEntity<OrganizerQualityDto.OqsHistoryResponse> response = 
                    controller.getOqsHistory(testUserId.toString(), 2, 20);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(oqsService).getOqsHistory(testUserId, 2, 20);
        }
    }

    @Nested
    @DisplayName("GET /api/v2/organizers/me/oqs/history")
    class GetMyOqsHistoryTests {

        @Test
        @DisplayName("Should return OQS history for authenticated user")
        void getMyOqsHistory_AuthenticatedUser_ReturnsHistory() {
            when(authentication.getName()).thenReturn(testUserId.toString());
            when(oqsService.getOrganizerIdForUser(testUserId)).thenReturn(testUserId);
            when(oqsService.getOqsHistory(testUserId, 0, 10)).thenReturn(mockHistoryResponse);

            ResponseEntity<OrganizerQualityDto.OqsHistoryResponse> response = 
                    controller.getMyOqsHistory(authentication, 0, 10);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            verify(oqsService).getOrganizerIdForUser(testUserId);
            verify(oqsService).getOqsHistory(testUserId, 0, 10);
        }

        @Test
        @DisplayName("Should cap page size at 50 for authenticated user")
        void getMyOqsHistory_LargePageSize_CapsAt50() {
            when(authentication.getName()).thenReturn(testUserId.toString());
            when(oqsService.getOrganizerIdForUser(testUserId)).thenReturn(testUserId);
            when(oqsService.getOqsHistory(testUserId, 0, 50)).thenReturn(mockHistoryResponse);

            ResponseEntity<OrganizerQualityDto.OqsHistoryResponse> response = 
                    controller.getMyOqsHistory(authentication, 0, 200);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(oqsService).getOrganizerIdForUser(testUserId);
            verify(oqsService).getOqsHistory(testUserId, 0, 50);
        }
    }

    @Nested
    @DisplayName("GET /api/v2/organizers/oqs/weights")
    class GetOqsWeightsTests {

        @Test
        @DisplayName("Should return OQS calculation weights")
        void getOqsWeights_ReturnsWeights() {
            ResponseEntity<OrganizerQualityDto.OqsWeights> response = controller.getOqsWeights();

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getCompletionRateWeight()).isEqualTo(0.6f);
            assertThat(response.getBody().getRepeatPlayerRateWeight()).isEqualTo(0.4f);
        }
    }
}
