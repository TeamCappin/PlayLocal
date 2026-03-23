package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.AiChatDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AiChatService {

    private static final int MAX_REPLY = 8000;

    private final AssistantTelemetryService assistantTelemetryService;

    public AiChatService(AssistantTelemetryService assistantTelemetryService) {
        this.assistantTelemetryService = assistantTelemetryService;
    }

    public AiChatDto.ChatResponse chat(UUID userId, AiChatDto.ChatRequest request) {
        String sessionKey = request.sessionId() != null && !request.sessionId().isBlank()
                ? request.sessionId()
                : "anonymous";

        try {
            assistantTelemetryService.recordEvent(
                    AssistantTelemetryService.ASSISTANT_MESSAGE_SENT,
                    userId,
                    sessionKey,
                    null,
                    java.util.Map.of("messageCount", request.messages().size()));

            List<AiChatDto.ChatMessage> messages = request.messages();
            String lastUser = "";
            for (int i = messages.size() - 1; i >= 0; i--) {
                AiChatDto.ChatMessage m = messages.get(i);
                if ("user".equalsIgnoreCase(m.role())) {
                    lastUser = m.content().trim();
                    break;
                }
            }
            if (lastUser.isEmpty()) {
                lastUser = "your question";
            }
            String reply = buildStubReply(lastUser);
            if (reply.length() > MAX_REPLY) {
                reply = reply.substring(0, MAX_REPLY) + "…";
            }
            return new AiChatDto.ChatResponse(new AiChatDto.AssistantMessage("assistant", reply));
        } catch (RuntimeException e) {
            assistantTelemetryService.recordEvent(
                    AssistantTelemetryService.ASSISTANT_RESPONSE_ERROR,
                    userId,
                    sessionKey,
                    null,
                    java.util.Map.of(
                            "error", e.getClass().getSimpleName(),
                            "message", String.valueOf(e.getMessage())));
            throw e;
        }
    }

    /**
     * Placeholder until US 8.2 replaces with grounded / external model flow.
     */
    private String buildStubReply(String userMessage) {
        String snippet = userMessage.length() > 500 ? userMessage.substring(0, 500) + "…" : userMessage;
        return "Thanks for using the PlayLocal assistant. This is a baseline reply (US 8.1); richer help is coming. "
                + "You said: \"" + snippet + "\". "
                + "Try Discover to find games, open a game for details and chat, or check your profile for reliability and history.";
    }
}
