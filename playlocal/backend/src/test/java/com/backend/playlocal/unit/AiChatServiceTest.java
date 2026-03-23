package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.AiChatDto;
import com.backend.playlocal.service.AiChatService;
import com.backend.playlocal.service.AssistantTelemetryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {

    @Mock
    private AssistantTelemetryService telemetryService;

    private AiChatService aiChatService;

    @BeforeEach
    void setUp() {
        aiChatService = new AiChatService(telemetryService);
    }

    @Test
    @DisplayName("chat returns assistant reply and records message telemetry")
    void chat_WithUserMessage_ReturnsReplyAndRecordsTelemetry() {
        UUID userId = UUID.randomUUID();
        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "session-123",
                List.of(
                        new AiChatDto.ChatMessage("assistant", "Previous answer"),
                        new AiChatDto.ChatMessage("user", "How do I join a game?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.message()).isNotNull();
        assertThat(response.message().role()).isEqualTo("assistant");
        assertThat(response.message().content()).contains("How do I join a game?");

        verify(telemetryService).recordEvent(
                AssistantTelemetryService.ASSISTANT_MESSAGE_SENT,
                userId,
                "session-123",
                null,
                java.util.Map.of("messageCount", 2));
    }

    @Test
    @DisplayName("chat uses anonymous session and fallback text when no user message")
    void chat_NoSessionAndNoUserMessage_UsesFallbacks() {
        UUID userId = UUID.randomUUID();
        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "   ",
                List.of(new AiChatDto.ChatMessage("assistant", "Only assistant so far")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).contains("your question");
        verify(telemetryService).recordEvent(
                AssistantTelemetryService.ASSISTANT_MESSAGE_SENT,
                userId,
                "anonymous",
                null,
                java.util.Map.of("messageCount", 1));
    }

    @Test
    @DisplayName("chat truncates very long reply snippets and handles null sessionId")
    void chat_LongUserMessage_TruncatesAndUsesAnonymous() {
        UUID userId = UUID.randomUUID();
        String longMessage = "x".repeat(9000);
        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                null,
                List.of(new AiChatDto.ChatMessage("user", longMessage)));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).hasSizeLessThanOrEqualTo(8001);
        assertThat(response.message().content()).contains("baseline reply");
        verify(telemetryService).recordEvent(
                AssistantTelemetryService.ASSISTANT_MESSAGE_SENT,
                userId,
                "anonymous",
                null,
                java.util.Map.of("messageCount", 1));
    }

    @Test
    @DisplayName("chat records response_error telemetry when an exception happens")
    void chat_WhenTelemetryThrows_RecordsErrorAndRethrows() {
        UUID userId = UUID.randomUUID();
        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "session-err",
                List.of(new AiChatDto.ChatMessage("user", "trigger")));

        RuntimeException boom = new RuntimeException("boom");
        doThrow(boom).doNothing()
                .when(telemetryService)
                .recordEvent(anyString(), any(), anyString(), isNull(), anyMap());

        assertThatThrownBy(() -> aiChatService.chat(userId, request))
                .isSameAs(boom);

        verify(telemetryService).recordEvent(
                AssistantTelemetryService.ASSISTANT_RESPONSE_ERROR,
                userId,
                "session-err",
                null,
                java.util.Map.of("error", "RuntimeException", "message", "boom"));
    }
}
