package com.backend.playlocal.service.assistant;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Blocks assistant flows that could leak secrets or other users' private data.
 * Messages are not logged here; callers record only refusal categories in telemetry.
 */
@Service
public class AssistantGuardrailService {

    private static final String SAFE_REFUSAL = "I can only share general PlayLocal help from our approved guide, "
            + "or information about your own account when you ask in your own words. "
            + "I can't look up other people's private details, credentials, or internal system data.";

    private final List<Pattern> allowPatterns = List.of(
            Pattern.compile("(?i)\\b(how\\s+do\\s+i|how\\s+to|can\\s+i|where\\s+can\\s+i)\\b.{0,60}\\b(reset|forgot|change|update)\\b.{0,40}\\bpassword\\b"),
            Pattern.compile("(?i)\\bforgot\\s+password\\b"),
            Pattern.compile("(?i)\\breset\\s+password\\b"),
            Pattern.compile("(?i)\\b(change|update)\\s+my\\s+password\\b"),
            Pattern.compile("(?i)\\b(can't|cannot|unable\\s+to)\\s+log\\s*in\\b"));

    private final List<Pattern> blockPatterns = List.of(
            Pattern.compile(
                    "(?i)\\b(password|api[_\\s-]*key|secret[_\\s-]*key|jwt|bearer\\s+\\S{10,}|auth\\s*token)\\b"),
            Pattern.compile("(?i)\\b(sql\\s*injection|drop\\s+table|select\\s+\\*\\s+from)\\b"),
            Pattern.compile("(?i)(other\\s+user|someone\\s+else|their\\s+(email|password|phone|messages|chats))"),
            Pattern.compile("(?i)\\b(admin\\s+panel|internal\\s+only|database\\s+dump)\\b"),
            Pattern.compile("(?i)(show\\s+me|what\\s+is|give\\s+me)\\s+.{0,40}\\b(email|phone|password)\\b"));

    public Optional<Refusal> evaluate(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return Optional.empty();
        }
        String text = userMessage.toLowerCase(Locale.ROOT);
        for (Pattern p : allowPatterns) {
            if (p.matcher(text).find()) {
                return Optional.empty();
            }
        }
        for (Pattern p : blockPatterns) {
            if (p.matcher(text).find()) {
                return Optional.of(new Refusal("policy_sensitive_request", SAFE_REFUSAL));
            }
        }
        return Optional.empty();
    }

    public record Refusal(String category, String userMessage) {
    }
}
