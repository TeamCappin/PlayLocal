package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.AiChatDto;
import com.backend.playlocal.service.AiChatService;
import com.backend.playlocal.service.AssistantTelemetryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final AiChatService aiChatService;
    private final AssistantTelemetryService assistantTelemetryService;

    public AiController(AiChatService aiChatService, AssistantTelemetryService assistantTelemetryService) {
        this.aiChatService = aiChatService;
        this.assistantTelemetryService = assistantTelemetryService;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatDto.ChatResponse> chat(
            Authentication authentication,
            @Valid @RequestBody AiChatDto.ChatRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(aiChatService.chat(userId, request));
    }

    @PostMapping("/telemetry")
    public ResponseEntity<Void> telemetry(
            Authentication authentication,
            @Valid @RequestBody AiChatDto.TelemetryRequest body) {
        UUID userId = UUID.fromString(authentication.getName());
        UUID gameId = null;
        if (body.gameId() != null && !body.gameId().isBlank()) {
            try {
                gameId = UUID.fromString(body.gameId());
            } catch (IllegalArgumentException ignored) {
                // omit invalid game id
            }
        }
        String eventName = mapTelemetryEvent(body.eventType());
        Map<String, Object> props = new HashMap<>();
        if (body.context() != null) {
            props.put("context", body.context());
        }
        assistantTelemetryService.recordEvent(
                eventName,
                userId,
                body.sessionId(),
                gameId,
                props);
        return ResponseEntity.noContent().build();
    }

    private static String mapTelemetryEvent(String eventType) {
        return switch (eventType.toUpperCase()) {
            case "SESSION_STARTED" -> AssistantTelemetryService.ASSISTANT_SESSION_STARTED;
            case "RESPONSE_ERROR" -> AssistantTelemetryService.ASSISTANT_RESPONSE_ERROR;
            default -> "assistant_" + eventType.toLowerCase().replace('-', '_');
        };
    }
}
