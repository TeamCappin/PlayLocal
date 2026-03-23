package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.AiChatDto;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AiChatDtoTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    @DisplayName("chat and telemetry DTO records expose values as expected")
    void dtoRecords_StoreValues() {
        AiChatDto.ChatMessage msg = new AiChatDto.ChatMessage("user", "hello");
        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest("session-1", List.of(msg));
        AiChatDto.AssistantMessage assistantMessage = new AiChatDto.AssistantMessage("assistant", "hi");
        AiChatDto.ChatResponse response = new AiChatDto.ChatResponse(assistantMessage);
        AiChatDto.TelemetryRequest telemetry =
                new AiChatDto.TelemetryRequest("SESSION_STARTED", "session-1", "discover", "game-1");

        assertThat(msg.role()).isEqualTo("user");
        assertThat(request.messages()).hasSize(1);
        assertThat(response.message().content()).isEqualTo("hi");
        assertThat(telemetry.context()).isEqualTo("discover");
    }

    @Test
    @DisplayName("validation rejects blank role/content and blank telemetry event type")
    void dtoValidation_RejectsInvalidValues() {
        AiChatDto.ChatMessage invalidMessage = new AiChatDto.ChatMessage(" ", " ");
        AiChatDto.ChatRequest invalidRequest = new AiChatDto.ChatRequest("session", List.of(invalidMessage));
        AiChatDto.TelemetryRequest invalidTelemetry =
                new AiChatDto.TelemetryRequest(" ", "session", "discover", "game");

        assertThat(validator.validate(invalidMessage)).isNotEmpty();
        assertThat(validator.validate(invalidRequest)).isNotEmpty();
        assertThat(validator.validate(invalidTelemetry)).isNotEmpty();
    }
}
