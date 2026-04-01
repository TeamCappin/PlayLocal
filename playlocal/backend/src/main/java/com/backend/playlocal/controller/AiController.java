package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.AiChatDto;
import com.backend.playlocal.model.dto.KnowledgeSearchDto;
import com.backend.playlocal.service.AiChatService;
import com.backend.playlocal.service.AssistantTelemetryService;
import com.backend.playlocal.service.knowledge.KnowledgeRetrievalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ai")
@Validated
public class AiController {

    private final AiChatService aiChatService;
    private final AssistantTelemetryService assistantTelemetryService;
    private final KnowledgeRetrievalService knowledgeRetrievalService;

    public AiController(
            AiChatService aiChatService,
            AssistantTelemetryService assistantTelemetryService,
            KnowledgeRetrievalService knowledgeRetrievalService) {
        this.aiChatService = aiChatService;
        this.assistantTelemetryService = assistantTelemetryService;
        this.knowledgeRetrievalService = knowledgeRetrievalService;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatDto.ChatResponse> chat(
            Authentication authentication,
            @Valid @RequestBody AiChatDto.ChatRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(aiChatService.chat(userId, request));
    }

    /**
     * Keyword-style retrieval over the approved in-app knowledge base (debugging / future UI).
     */
    @GetMapping("/knowledge/search")
    public ResponseEntity<KnowledgeSearchDto.SearchResponse> searchKnowledge(
            @RequestParam @Size(max = 500) String q) {
        List<KnowledgeSearchDto.Snippet> snippets = knowledgeRetrievalService.search(q, 8).stream()
                .map(h -> new KnowledgeSearchDto.Snippet(
                        h.entry().id(),
                        h.entry().title(),
                        h.entry().section(),
                        h.score(),
                        excerpt(h.entry().answerText(), 280)))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new KnowledgeSearchDto.SearchResponse(snippets));
    }

    private static String excerpt(String text, int maxLen) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String t = text.replaceAll("\\s+", " ").trim();
        return t.length() <= maxLen ? t : t.substring(0, maxLen) + "…";
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
