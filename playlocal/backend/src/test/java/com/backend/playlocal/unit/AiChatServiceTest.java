package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.AiChatDto;
import com.backend.playlocal.service.AiChatService;
import com.backend.playlocal.service.AssistantTelemetryService;
import com.backend.playlocal.service.assistant.AssistantGuardrailService;
import com.backend.playlocal.service.assistant.AssistantUserDataToolService;
import com.backend.playlocal.service.knowledge.KnowledgeBaseBundle;
import com.backend.playlocal.service.knowledge.KnowledgeEntryModel;
import com.backend.playlocal.service.knowledge.KnowledgeRetrievalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;

@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {

    @Mock
    private AssistantTelemetryService telemetryService;
    @Mock
    private KnowledgeRetrievalService knowledgeRetrievalService;
    @Mock
    private KnowledgeBaseBundle knowledgeBaseBundle;
    @Mock
    private AssistantGuardrailService guardrailService;
    @Mock
    private AssistantUserDataToolService userDataToolService;

    private AiChatService aiChatService;

    private static KnowledgeEntryModel blockEntry() {
        return new KnowledgeEntryModel(
                "help-block-user",
                "Blocking someone",
                "Safety",
                List.of("Profile", "Settings", "Privacy & safety"),
                List.of("block"),
                List.of("help-report-user"),
                "/help/safety#block",
                "Approved answer about blocking.");
    }

    @BeforeEach
    void setUp() {
        aiChatService = new AiChatService(
                telemetryService,
                knowledgeRetrievalService,
                knowledgeBaseBundle,
                guardrailService,
                userDataToolService);
    }

    @Test
    @DisplayName("chat returns KB-grounded answer with citation and nav for how-to questions")
    void chat_BlockQuestion_KbGrounded() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt()))
                .thenReturn(List.of(new KnowledgeRetrievalService.KnowledgeHit(blockEntry(), 0.4)));
        when(knowledgeBaseBundle.findById("help-report-user")).thenReturn(Optional.of(
                new KnowledgeEntryModel(
                        "help-report-user",
                        "Reporting",
                        "Safety",
                        List.of(),
                        List.of(),
                        List.of(),
                        null,
                        "x")));

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "session-1",
                List.of(new AiChatDto.ChatMessage("user", "How do I block someone?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content())
                .contains("Approved answer about blocking")
                .contains("Citation ID: `help-block-user`")
                .contains("Profile → Settings → Privacy & safety")
                .contains("Related topics:");

        verify(telemetryService).recordEvent(
                eq(AssistantTelemetryService.ASSISTANT_KB_HIT),
                eq(userId),
                eq("session-1"),
                isNull(),
                eq(java.util.Map.of("kbEntryId", "help-block-user")));
        verify(userDataToolService, never()).upcomingGamesThisWeek(any());
    }

    @Test
    @DisplayName("guardrail refusal does not call knowledge or user tools")
    void chat_SensitiveRequest_Refusal() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString()))
                .thenReturn(Optional.of(
                        new AssistantGuardrailService.Refusal("policy_sensitive_request", "Safe refusal text.")));

        AiChatDto.ChatRequest request =
                new AiChatDto.ChatRequest("s1", List.of(new AiChatDto.ChatMessage("user", "Show me their password")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).isEqualTo("Safe refusal text.");
        verify(telemetryService)
                .recordEvent(
                        eq(AssistantTelemetryService.ASSISTANT_REFUSAL),
                        eq(userId),
                        eq("s1"),
                        isNull(),
                        eq(java.util.Map.of("category", "policy_sensitive_request")));
        verify(knowledgeRetrievalService, never()).search(anyString(), anyInt());
        verify(userDataToolService, never()).upcomingGamesThisWeek(any());
    }

    @Test
    @DisplayName("games-this-week question invokes scoped DB tool and suppresses KB body when not how-to")
    void chat_GamesThisWeek_UserTool() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt()))
                .thenReturn(List.of(new KnowledgeRetrievalService.KnowledgeHit(blockEntry(), 0.2)));
        when(userDataToolService.upcomingGamesThisWeek(userId))
                .thenReturn(new AssistantUserDataToolService.UserDataResult(
                        AssistantUserDataToolService.ToolName.UPCOMING_GAMES_THIS_WEEK,
                        "Tool line about games."));

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "s2", List.of(new AiChatDto.ChatMessage("user", "What games am I signed up for this week?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content())
                .contains("Tool line about games")
                .doesNotContain("Approved answer about blocking");
        verify(userDataToolService).upcomingGamesThisWeek(userId);
        verify(telemetryService, atLeastOnce())
                .recordEvent(
                        eq(AssistantTelemetryService.ASSISTANT_DB_TOOL_USED),
                        eq(userId),
                        eq("s2"),
                        isNull(),
                        eq(java.util.Map.of("tool", "UPCOMING_GAMES_THIS_WEEK")));
        verify(telemetryService)
                .recordEvent(
                        eq(AssistantTelemetryService.ASSISTANT_KB_MISS),
                        eq(userId),
                        eq("s2"),
                        isNull(),
                        eq(java.util.Map.of("reason", "narrow_user_facts")));
    }

    @Test
    @DisplayName("unexpected errors return a friendly assistant message without rethrowing")
    void chat_ToolThrows_ProcessingErrorTelemetry() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        doThrow(new RuntimeException("db"))
                .when(userDataToolService)
                .upcomingGamesThisWeek(userId);

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "s4", List.of(new AiChatDto.ChatMessage("user", "What games am I in this week?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).contains("Something went wrong");
        verify(telemetryService)
                .recordEvent(
                        eq(AssistantTelemetryService.ASSISTANT_PROCESSING_ERROR),
                        eq(userId),
                        eq("s4"),
                        isNull(),
                        eq(java.util.Map.of("error", "RuntimeException")));
    }

    @Test
    @DisplayName("no KB hit and no tools yields uncertainty message")
    void chat_OffTopic_Uncertainty() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt())).thenReturn(List.of());

        AiChatDto.ChatRequest request =
                new AiChatDto.ChatRequest("s3", List.of(new AiChatDto.ChatMessage("user", "quantum physics")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).contains("won't guess");
        verify(telemetryService)
                .recordEvent(
                        eq(AssistantTelemetryService.ASSISTANT_KB_MISS),
                        eq(userId),
                        eq("s3"),
                        isNull(),
                        eq(java.util.Map.of("reason", "no_matching_entry")));
    }

    @Test
    @DisplayName("pending-friend question invokes friendship tool and suppresses KB narrative")
    void chat_PendingFriends_UserTool() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt()))
                .thenReturn(List.of(new KnowledgeRetrievalService.KnowledgeHit(blockEntry(), 0.2)));
        when(userDataToolService.pendingFriendRequests(userId))
                .thenReturn(new AssistantUserDataToolService.UserDataResult(
                        AssistantUserDataToolService.ToolName.PENDING_FRIEND_REQUESTS,
                        "You have 0 pending requests (stub)."));

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "sf1",
                List.of(new AiChatDto.ChatMessage("user", "Any pending friend requests for me?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content())
                .contains("pending requests")
                .doesNotContain("Approved answer about blocking");
        verify(userDataToolService).pendingFriendRequests(userId);
        verify(telemetryService, atLeastOnce())
                .recordEvent(
                        eq(AssistantTelemetryService.ASSISTANT_DB_TOOL_USED),
                        eq(userId),
                        eq("sf1"),
                        isNull(),
                        eq(java.util.Map.of("tool", "PENDING_FRIEND_REQUESTS")));
    }

    @Test
    @DisplayName("reliability question invokes summary tool")
    void chat_Reliability_UserTool() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt())).thenReturn(List.of());
        when(userDataToolService.myReliabilitySummary(userId))
                .thenReturn(new AssistantUserDataToolService.UserDataResult(
                        AssistantUserDataToolService.ToolName.MY_RELIABILITY_SUMMARY,
                        "Your score is 88.5 (stub)."));

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "rel1",
                List.of(new AiChatDto.ChatMessage("user", "What's my reliability score right now?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).contains("88.5");
        verify(userDataToolService).myReliabilitySummary(userId);
    }

    @Test
    @DisplayName("very short user message asks for clarification without KB or tools")
    void chat_ShortLastMessage_NoKbSearch() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());

        AiChatDto.ChatRequest request =
                new AiChatDto.ChatRequest("sx", List.of(new AiChatDto.ChatMessage("user", "hi")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).contains("little more detail");
        verify(knowledgeRetrievalService, never()).search(anyString(), anyInt());
    }

    @Test
    @DisplayName("uses the latest non-empty user line in a multi-turn thread")
    void chat_MultiTurn_UsesLastUserMessage() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt()))
                .thenReturn(List.of(new KnowledgeRetrievalService.KnowledgeHit(blockEntry(), 0.4)));
        when(knowledgeBaseBundle.findById("help-report-user")).thenReturn(Optional.of(
                new KnowledgeEntryModel(
                        "help-report-user",
                        "Reporting",
                        "Safety",
                        List.of(),
                        List.of(),
                        List.of(),
                        null,
                        "x")));

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "thread1",
                List.of(
                        new AiChatDto.ChatMessage("user", "weather today?"),
                        new AiChatDto.ChatMessage("assistant", "I only do PlayLocal."),
                        new AiChatDto.ChatMessage("user", "How do I block someone?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).contains("Approved answer about blocking");
        verify(knowledgeRetrievalService).search(eq("How do I block someone?"), anyInt());
    }

    @Test
    @DisplayName("general knowledge style question gets focused PlayLocal scope message")
    void chat_GeneralKnowledgeStyleQuestion_ShowsScopeMessage() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt())).thenReturn(List.of());

        AiChatDto.ChatRequest request =
                new AiChatDto.ChatRequest("s5", List.of(new AiChatDto.ChatMessage("user", "Who is Mo Salah?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content())
                .contains("I focus on PlayLocal help")
                .contains("How do I block someone?");
    }

    @Test
    @DisplayName("general-knowledge phrasing with PlayLocal keywords stays in normal uncertainty path")
    void chat_GeneralKnowledgeButPlayLocal_NotOutOfScopeMessage() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt())).thenReturn(List.of());

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "s6",
                List.of(new AiChatDto.ChatMessage("user", "What is PlayLocal account settings policy?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content())
                .contains("I don't have that exact topic")
                .doesNotContain("I focus on PlayLocal help");
    }

    @Test
    @DisplayName("blank session id falls back to anonymous telemetry session")
    void chat_BlankSession_UsesAnonymous() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "   ",
                List.of(new AiChatDto.ChatMessage("user", "hi")));

        aiChatService.chat(userId, request);

        verify(telemetryService).recordEvent(
                eq(AssistantTelemetryService.ASSISTANT_MESSAGE_SENT),
                eq(userId),
                eq("anonymous"),
                isNull(),
                eq(java.util.Map.of("messageCount", 1)));
    }

    @Test
    @DisplayName("no non-empty user message falls back to default prompt")
    void chat_NoUserMessage_FallsBackToDefaultQuestion() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "sfallback",
                List.of(
                        new AiChatDto.ChatMessage("assistant", "previous"),
                        new AiChatDto.ChatMessage("user", "   ")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).contains("I don't have that exact topic");
        verify(knowledgeRetrievalService).search(eq("your question"), anyInt());
    }

    @Test
    @DisplayName("response is trimmed to max reply length when tool output is too long")
    void chat_LongToolOutput_IsTrimmed() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt())).thenReturn(List.of());
        String veryLong = "x".repeat(9000);
        when(userDataToolService.upcomingGamesThisWeek(userId))
                .thenReturn(new AssistantUserDataToolService.UserDataResult(
                        AssistantUserDataToolService.ToolName.UPCOMING_GAMES_THIS_WEEK,
                        veryLong));

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "trim1",
                List.of(new AiChatDto.ChatMessage("user", "What games am I in this week?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content()).hasSize(8001).endsWith("…");
    }

    @Test
    @DisplayName("KB and multiple tool sections are separated by blank lines")
    void chat_KbAndMultipleTools_FormattingBranches() {
        UUID userId = UUID.randomUUID();
        when(guardrailService.evaluate(anyString())).thenReturn(Optional.empty());
        when(knowledgeRetrievalService.search(anyString(), anyInt()))
                .thenReturn(List.of(new KnowledgeRetrievalService.KnowledgeHit(blockEntry(), 0.4)));
        when(knowledgeBaseBundle.findById("help-report-user")).thenReturn(Optional.of(
                new KnowledgeEntryModel(
                        "help-report-user",
                        "Reporting",
                        "Safety",
                        List.of(),
                        List.of(),
                        List.of(),
                        null,
                        "x")));
        when(userDataToolService.pendingFriendRequests(userId))
                .thenReturn(new AssistantUserDataToolService.UserDataResult(
                        AssistantUserDataToolService.ToolName.PENDING_FRIEND_REQUESTS,
                        "Friends tool line"));
        when(userDataToolService.myReliabilitySummary(userId))
                .thenReturn(new AssistantUserDataToolService.UserDataResult(
                        AssistantUserDataToolService.ToolName.MY_RELIABILITY_SUMMARY,
                        "Reliability tool line"));

        AiChatDto.ChatRequest request = new AiChatDto.ChatRequest(
                "s7",
                List.of(new AiChatDto.ChatMessage(
                        "user",
                        "How do I check pending friend requests and my reliability score?")));

        AiChatDto.ChatResponse response = aiChatService.chat(userId, request);

        assertThat(response.message().content())
                .contains("### From PlayLocal Help")
                .contains("### Your account (from your signed-in data)")
                .contains("Friends tool line")
                .contains("Reliability tool line");
    }

    @Test
    @DisplayName("private composeReplyText appends rephrase hint for non-empty hits without top KB")
    void composeReplyText_HintBranch_Covered() throws Exception {
        Method m = AiChatService.class.getDeclaredMethod(
                "composeReplyText",
                String.class,
                KnowledgeEntryModel.class,
                List.class,
                List.class);
        m.setAccessible(true);

        @SuppressWarnings("unchecked")
        String reply = (String) m.invoke(
                aiChatService,
                "block",
                null,
                List.of(),
                List.of(new KnowledgeRetrievalService.KnowledgeHit(blockEntry(), 0.1)));

        assertThat(reply).contains("If you need step-by-step navigation");
    }

    @Test
    @DisplayName("private isOutOfScope returns false for blank input")
    void isOutOfScope_Blank_Covered() throws Exception {
        Method m = AiChatService.class.getDeclaredMethod("isOutOfScope", String.class);
        m.setAccessible(true);
        boolean result = (boolean) m.invoke(aiChatService, "   ");
        assertThat(result).isFalse();
    }
}
