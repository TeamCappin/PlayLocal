package com.backend.playlocal.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AiChatDto {

    public record ChatMessage(
            @NotBlank @Size(max = 16000) String role,
            @NotBlank @Size(max = 32000) String content) {
    }

    public record ChatRequest(
            @Size(max = 64) String sessionId,
            @NotEmpty @Size(min = 1, max = 50) List<@Valid ChatMessage> messages) {
    }

    public record AssistantMessage(
            String role,
            String content) {
    }

    public record ChatResponse(
            AssistantMessage message) {
    }

    public record TelemetryRequest(
            @NotBlank @Size(max = 64) String eventType,
            @Size(max = 64) String sessionId,
            @Size(max = 32) String context,
            @Size(max = 64) String gameId) {
    }
}
