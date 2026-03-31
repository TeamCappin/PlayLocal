package com.backend.playlocal.unit;

import com.backend.playlocal.controller.AiController;
import com.backend.playlocal.model.dto.AiChatDto;
import com.backend.playlocal.model.dto.KnowledgeSearchDto;
import com.backend.playlocal.service.AiChatService;
import com.backend.playlocal.service.AssistantTelemetryService;
import com.backend.playlocal.service.knowledge.KnowledgeEntryModel;
import com.backend.playlocal.service.knowledge.KnowledgeRetrievalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiControllerTest {

    @Mock
    private AiChatService aiChatService;
    @Mock
    private AssistantTelemetryService assistantTelemetryService;
    @Mock
    private KnowledgeRetrievalService knowledgeRetrievalService;
    @Mock
    private Authentication authentication;

    private AiController controller;

    @BeforeEach
    void setUp() {
        controller = new AiController(aiChatService, assistantTelemetryService, knowledgeRetrievalService);
    }

    @Test
    @DisplayName("chat delegates to service using authenticated UUID")
    void chat_DelegatesToService() {
        UUID userId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(userId.toString());

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "session-1",
                List.of(new AiChatDto.ChatMessage("user", "hello")));
        AiChatDto.ChatResponse expected =
                new AiChatDto.ChatResponse(new AiChatDto.AssistantMessage("assistant", "hi"));
        when(aiChatService.chat(userId, request)).thenReturn(expected);

        ResponseEntity<AiChatDto.ChatResponse> response = controller.chat(authentication, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(expected);
        verify(aiChatService).chat(userId, request);
    }

    @Test
    @DisplayName("telemetry maps SESSION_STARTED and forwards parsed gameId")
    void telemetry_SessionStarted_MapsAndForwards() {
        UUID userId = UUID.randomUUID();
        UUID gameId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(userId.toString());

        AiChatDto.TelemetryRequest body =
                new AiChatDto.TelemetryRequest("SESSION_STARTED", "session-1", "discover", gameId.toString());

        ResponseEntity<Void> response = controller.telemetry(authentication, body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(assistantTelemetryService).recordEvent(
                AssistantTelemetryService.ASSISTANT_SESSION_STARTED,
                userId,
                "session-1",
                gameId,
                Map.of("context", "discover"));
    }

    @Test
    @DisplayName("telemetry maps unknown event type and drops invalid gameId")
    void telemetry_UnknownEvent_InvalidGameId() {
        UUID userId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(userId.toString());

        AiChatDto.TelemetryRequest body =
                new AiChatDto.TelemetryRequest("MODEL-TIMEOUT", "session-2", null, "not-a-uuid");

        ResponseEntity<Void> response = controller.telemetry(authentication, body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(assistantTelemetryService).recordEvent(
                eq("assistant_model_timeout"),
                eq(userId),
                eq("session-2"),
                eq(null),
                eq(Map.of()));
    }

    @Test
    @DisplayName("telemetry maps RESPONSE_ERROR to assistant_response_error")
    void telemetry_ResponseError_MapsExpectedEventName() {
        UUID userId = UUID.randomUUID();
        when(authentication.getName()).thenReturn(userId.toString());

        AiChatDto.TelemetryRequest body =
                new AiChatDto.TelemetryRequest("RESPONSE_ERROR", "session-3", "game", null);

        ResponseEntity<Void> response = controller.telemetry(authentication, body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(assistantTelemetryService).recordEvent(
                AssistantTelemetryService.ASSISTANT_RESPONSE_ERROR,
                userId,
                "session-3",
                null,
                Map.of("context", "game"));
    }

    @Test
    @DisplayName("knowledge search maps retrieval hits to snippets")
    void searchKnowledge_ReturnsSnippets() {
        KnowledgeEntryModel entry = new KnowledgeEntryModel(
                "help-block-user",
                "Blocking someone",
                "Safety",
                List.of("Profile", "Settings"),
                List.of("block"),
                List.of(),
                "/help/safety#block",
                "Short approved text about blocking users on the platform.");
        when(knowledgeRetrievalService.search("block", 8))
                .thenReturn(List.of(new KnowledgeRetrievalService.KnowledgeHit(entry, 0.42)));

        ResponseEntity<KnowledgeSearchDto.SearchResponse> response = controller.searchKnowledge("block");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().snippets()).hasSize(1);
        assertThat(response.getBody().snippets().get(0).id()).isEqualTo("help-block-user");
        assertThat(response.getBody().snippets().get(0).excerpt()).contains("Short approved");
    }

    @Test
    @DisplayName("knowledge search excerpt truncates long answer text with ellipsis")
    void searchKnowledge_LongAnswer_TruncatesExcerpt() {
        String longBody = "x".repeat(400);
        KnowledgeEntryModel entry = new KnowledgeEntryModel(
                "long-entry",
                "T",
                "S",
                List.of(),
                List.of("key"),
                List.of(),
                null,
                longBody);
        when(knowledgeRetrievalService.search("key", 8))
                .thenReturn(List.of(new KnowledgeRetrievalService.KnowledgeHit(entry, 0.1)));

        KnowledgeSearchDto.SearchResponse body = controller.searchKnowledge("key").getBody();

        assertThat(body.snippets().get(0).excerpt()).endsWith("…").hasSize(281);
    }
}
