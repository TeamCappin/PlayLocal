package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.AiChatDto;
import com.backend.playlocal.service.assistant.AssistantGuardrailService;
import com.backend.playlocal.service.assistant.AssistantUserDataToolService;
import com.backend.playlocal.service.knowledge.KnowledgeBaseBundle;
import com.backend.playlocal.service.knowledge.KnowledgeEntryModel;
import com.backend.playlocal.service.knowledge.KnowledgeRetrievalService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);
    private static final int MAX_REPLY = 8000;

    private final AssistantTelemetryService assistantTelemetryService;
    private final KnowledgeRetrievalService knowledgeRetrievalService;
    private final KnowledgeBaseBundle knowledgeBaseBundle;
    private final AssistantGuardrailService guardrailService;
    private final AssistantUserDataToolService userDataToolService;

    private static final Pattern HOW_TO =
            Pattern.compile("(?i)\\b(how\\s+do|how\\s+to|how\\s+can|where\\s+do|where\\s+can)\\b");
    private static final Pattern GAMES_WEEK_FACTS = Pattern.compile(
            "(?i)(what|which|any|list)\\s.{0,48}(game|games)|"
                    + "(game|games)\\s.{0,24}(this\\s+week|week|upcoming|scheduled)|"
                    + "(my|i'?m|i\\s+am)\\s.{0,24}(game|games).{0,32}(week|upcoming|scheduled|signed)|"
                    + "signed\\s+up.{0,40}(game|games)|"
                    + "(game|games)\\s.{0,20}signed");
    private static final Pattern PENDING_FRIENDS_FACTS =
            Pattern.compile("(?i)pending\\s.{0,20}friend|friend\\s.{0,20}request|incoming\\s.{0,20}request");
    private static final Pattern RELIABILITY_FACTS =
            Pattern.compile("(?i)\\b(my|what'?s|what\\s+is)\\s.{0,20}reliability|\\breliability\\s+score\\b");
    private static final Pattern GENERAL_KNOWLEDGE_STYLE =
            Pattern.compile("(?i)^\\s*(who|what|when|where|why)\\s+(is|are|was|were)\\b");

    public AiChatService(
            AssistantTelemetryService assistantTelemetryService,
            KnowledgeRetrievalService knowledgeRetrievalService,
            KnowledgeBaseBundle knowledgeBaseBundle,
            AssistantGuardrailService guardrailService,
            AssistantUserDataToolService userDataToolService) {
        this.assistantTelemetryService = assistantTelemetryService;
        this.knowledgeRetrievalService = knowledgeRetrievalService;
        this.knowledgeBaseBundle = knowledgeBaseBundle;
        this.guardrailService = guardrailService;
        this.userDataToolService = userDataToolService;
    }

    public AiChatDto.ChatResponse chat(UUID userId, AiChatDto.ChatRequest request) {
        String sessionKey = request.sessionId() != null && !request.sessionId().isBlank()
                ? request.sessionId().trim()
                : "anonymous";

        try {
            assistantTelemetryService.recordEvent(
                    AssistantTelemetryService.ASSISTANT_MESSAGE_SENT,
                    userId,
                    sessionKey,
                    null,
                    Map.of("messageCount", request.messages().size()));

            String lastUser = lastUserMessage(request);
            Optional<AssistantGuardrailService.Refusal> refusal = guardrailService.evaluate(lastUser);
            if (refusal.isPresent()) {
                assistantTelemetryService.recordEvent(
                        AssistantTelemetryService.ASSISTANT_REFUSAL,
                        userId,
                        sessionKey,
                        null,
                        Map.of("category", refusal.get().category()));
                return trim(new AiChatDto.ChatResponse(
                        new AiChatDto.AssistantMessage("assistant", refusal.get().userMessage())));
            }

            if (lastUser.length() < 4) {
                return trim(new AiChatDto.ChatResponse(new AiChatDto.AssistantMessage(
                        "assistant",
                        "Could you add a little more detail? For example, mention games, friends, blocking, "
                                + "or your reliability score so I can use the right help article or your account data.")));
            }

            List<AssistantUserDataToolService.UserDataResult> toolResults = new ArrayList<>();
            if (GAMES_WEEK_FACTS.matcher(lastUser).find()) {
                var r = userDataToolService.upcomingGamesThisWeek(userId);
                toolResults.add(r);
                recordDbTool(userId, sessionKey, r.tool().name());
            }
            if (PENDING_FRIENDS_FACTS.matcher(lastUser).find()) {
                var r = userDataToolService.pendingFriendRequests(userId);
                toolResults.add(r);
                recordDbTool(userId, sessionKey, r.tool().name());
            }
            if (RELIABILITY_FACTS.matcher(lastUser).find()) {
                var r = userDataToolService.myReliabilitySummary(userId);
                toolResults.add(r);
                recordDbTool(userId, sessionKey, r.tool().name());
            }

            List<KnowledgeRetrievalService.KnowledgeHit> hits =
                    knowledgeRetrievalService.search(lastUser, 3);

            boolean suppressKb = suppressKbForNarrowFacts(lastUser, toolResults);
            KnowledgeEntryModel topKb = (!hits.isEmpty() && !suppressKb) ? hits.get(0).entry() : null;

            recordKbTelemetry(userId, sessionKey, topKb, hits, suppressKb, toolResults, lastUser);

            String reply = composeReplyText(lastUser, topKb, toolResults, hits);
            return trim(new AiChatDto.ChatResponse(new AiChatDto.AssistantMessage("assistant", reply)));
        } catch (RuntimeException e) {
            log.warn("Assistant chat failed: {}", e.toString());
            assistantTelemetryService.recordEvent(
                    AssistantTelemetryService.ASSISTANT_PROCESSING_ERROR,
                    userId,
                    sessionKey,
                    null,
                    Map.of("error", e.getClass().getSimpleName()));
            return trim(new AiChatDto.ChatResponse(new AiChatDto.AssistantMessage(
                    "assistant",
                    "Something went wrong while preparing a reply. Please try again in a moment.")));
        }
    }

    private void recordKbTelemetry(
            UUID userId,
            String sessionKey,
            KnowledgeEntryModel topKb,
            List<KnowledgeRetrievalService.KnowledgeHit> hits,
            boolean suppressKb,
            List<AssistantUserDataToolService.UserDataResult> toolResults,
            String lastUser) {
        if (topKb != null) {
            assistantTelemetryService.recordEvent(
                    AssistantTelemetryService.ASSISTANT_KB_HIT,
                    userId,
                    sessionKey,
                    null,
                    Map.of("kbEntryId", topKb.id()));
            return;
        }
        if (!hits.isEmpty() && suppressKb) {
            assistantTelemetryService.recordEvent(
                    AssistantTelemetryService.ASSISTANT_KB_MISS,
                    userId,
                    sessionKey,
                    null,
                    Map.of("reason", "narrow_user_facts"));
            return;
        }
        if (hits.isEmpty()) {
            assistantTelemetryService.recordEvent(
                    AssistantTelemetryService.ASSISTANT_KB_MISS,
                    userId,
                    sessionKey,
                    null,
                    Map.of("reason", "no_matching_entry"));
        }
    }

    private void recordDbTool(UUID userId, String sessionKey, String toolName) {
        assistantTelemetryService.recordEvent(
                AssistantTelemetryService.ASSISTANT_DB_TOOL_USED,
                userId,
                sessionKey,
                null,
                Map.of("tool", toolName));
    }

    private boolean suppressKbForNarrowFacts(
            String lastUser, List<AssistantUserDataToolService.UserDataResult> tools) {
        if (HOW_TO.matcher(lastUser).find()) {
            return false;
        }
        if (tools.isEmpty()) {
            return false;
        }
        boolean games = GAMES_WEEK_FACTS.matcher(lastUser).find();
        boolean friends = PENDING_FRIENDS_FACTS.matcher(lastUser).find();
        boolean rel = RELIABILITY_FACTS.matcher(lastUser).find();
        return games || friends || rel;
    }

    private String composeReplyText(
            String lastUser,
            KnowledgeEntryModel topKb,
            List<AssistantUserDataToolService.UserDataResult> toolResults,
            List<KnowledgeRetrievalService.KnowledgeHit> hits) {

        StringBuilder sb = new StringBuilder();

        if (topKb != null) {
            sb.append(formatKbSection(topKb));
        }

        if (!toolResults.isEmpty()) {
            if (sb.length() > 0) {
                sb.append("\n");
            }
            sb.append("### Your account (from your signed-in data)\n\n");
            for (int i = 0; i < toolResults.size(); i++) {
                if (i > 0) {
                    sb.append("\n");
                }
                sb.append(toolResults.get(i).factualText());
            }
            sb.append("\n");
        }

        if (sb.length() == 0) {
            if (isOutOfScope(lastUser)) {
                sb.append("I focus on PlayLocal help and your signed-in PlayLocal account data, so I can't reliably "
                        + "answer general knowledge questions like that.\n\n"
                        + "Try asking me something in-app, for example:\n"
                        + "- How do I block someone?\n"
                        + "- What games am I signed up for this week?\n"
                        + "- Do I have pending friend requests?\n");
            } else {
                sb.append("I don't have that exact topic in the approved PlayLocal help yet, so I won't guess. "
                        + "Tell me a bit more—are you asking about **joining games**, **friends**, **blocking/reporting**, "
                        + "or **your profile settings**? You can also open **Profile → Settings** in the app.\n");
                if (!hits.isEmpty()) {
                    sb.append("\nIf you need step-by-step navigation, try rephrasing with words like “how do I …”.\n");
                }
            }
        }

        return sb.toString().trim();
    }

    private String formatKbSection(KnowledgeEntryModel top) {
        StringBuilder sb = new StringBuilder();
        sb.append("### From PlayLocal Help\n\n");
        sb.append(top.answerText()).append("\n\n");
        sb.append("**Source:** ").append(top.title());
        sb.append(" · Citation ID: `").append(top.id()).append("`");
        if (top.docLink() != null && !top.docLink().isBlank()) {
            sb.append(" · Link: ").append(top.docLink());
        }
        sb.append("\n");
        if (top.navPath() != null && !top.navPath().isEmpty()) {
            sb.append("**Where in the app:** ").append(String.join(" → ", top.navPath())).append("\n");
        }
        if (top.relatedIds() != null && !top.relatedIds().isEmpty()) {
            List<String> titles = new ArrayList<>();
            for (String rid : top.relatedIds()) {
                knowledgeBaseBundle.findById(rid).ifPresent(e -> titles.add(e.title()));
            }
            if (!titles.isEmpty()) {
                int n = Math.min(3, titles.size());
                sb.append("**Related topics:** ").append(String.join(" · ", titles.subList(0, n))).append("\n");
            }
        }
        return sb.toString();
    }

    private boolean isOutOfScope(String userText) {
        if (userText == null || userText.isBlank()) {
            return false;
        }
        String q = userText.toLowerCase();
        boolean asksGeneralKnowledge = GENERAL_KNOWLEDGE_STYLE.matcher(q).find();
        if (!asksGeneralKnowledge) {
            return false;
        }
        // Keep PlayLocal-specific questions on the normal KB/tool path.
        return !(q.contains("playlocal")
                || q.contains("game")
                || q.contains("friend")
                || q.contains("reliability")
                || q.contains("profile")
                || q.contains("settings")
                || q.contains("block")
                || q.contains("report"));
    }

    private static String lastUserMessage(AiChatDto.ChatRequest request) {
        List<AiChatDto.ChatMessage> messages = request.messages();
        for (int i = messages.size() - 1; i >= 0; i--) {
            AiChatDto.ChatMessage m = messages.get(i);
            if ("user".equalsIgnoreCase(m.role())) {
                String c = m.content() != null ? m.content().trim() : "";
                if (!c.isEmpty()) {
                    return c;
                }
            }
        }
        return "your question";
    }

    private AiChatDto.ChatResponse trim(AiChatDto.ChatResponse response) {
        String c = response.message().content();
        if (c.length() > MAX_REPLY) {
            c = c.substring(0, MAX_REPLY) + "…";
        }
        return new AiChatDto.ChatResponse(new AiChatDto.AssistantMessage(response.message().role(), c));
    }
}
