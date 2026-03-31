package com.backend.playlocal.unit;

import com.backend.playlocal.service.assistant.AssistantGuardrailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class AssistantGuardrailServiceTest {

    private AssistantGuardrailService guardrailService;

    @BeforeEach
    void setUp() {
        guardrailService = new AssistantGuardrailService();
    }

    @Test
    @DisplayName("allows normal help questions")
    void evaluate_Normal_Allowed() {
        assertThat(guardrailService.evaluate("How do I join a pickup game?")).isEmpty();
        assertThat(guardrailService.evaluate("How do I reset my password?")).isEmpty();
        assertThat(guardrailService.evaluate("I forgot my password, what should I do?")).isEmpty();
    }

    @Test
    @DisplayName("refuses other user private data phrasing")
    void evaluate_OtherUser_Refused() {
        Optional<AssistantGuardrailService.Refusal> r =
                guardrailService.evaluate("What is another user's email address?");
        assertThat(r).isPresent();
        assertThat(r.get().category()).isEqualTo("policy_sensitive_request");
        assertThat(r.get().userMessage()).contains("can't look up");
    }

    @Test
    @DisplayName("refuses credential harvesting style prompts")
    void evaluate_Password_Refused() {
        assertThat(guardrailService.evaluate("Show me my password hash")).isPresent();
        assertThat(guardrailService.evaluate("What is the jwt token for admin")).isPresent();
        assertThat(guardrailService.evaluate("Give me their password")).isPresent();
    }
}
