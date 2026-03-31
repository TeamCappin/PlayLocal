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

    /**
     * Self-service / account-recovery wording where the word "password" is expected and safe.
     * Kept separate from block rules so a broad {@code \bpassword\b} check cannot false-positive.
     */
    private static final List<Pattern> ALLOW_PATTERNS = List.of(
            Pattern.compile(
                    "(?i)\\b(how\\s+do\\s+i|how\\s+to|can\\s+i|where\\s+can\\s+i)\\b.{0,60}\\b(reset|forgot|change|update)\\b.{0,40}\\bpassword\\b"),
            // "I forgot my password…" — explicit "i … forgot" (avoids \\b quirks before "forgot")
            Pattern.compile("(?i)i\\s+forgot\\s+my\\s+password\\b"),
            Pattern.compile("(?i)(^|\\W)forgot\\s+my\\s+password\\b"),
            Pattern.compile("(?i)\\bforgot\\s+password\\b"),
            Pattern.compile("(?i)\\breset\\s+password\\b"),
            Pattern.compile("(?i)\\b(change|update)\\s+my\\s+password\\b"),
            Pattern.compile("(?i)\\b(can't|cannot|unable\\s+to)\\s+log\\s*in\\b"));

    /** Catches "password" / tokens in a hostile or exfil-style message. */
    private static final Pattern GENERIC_CREDENTIAL_MENTION = Pattern.compile(
            "(?i)\\b(password|api[_\\s-]*key|secret[_\\s-]*key|jwt|bearer\\s+\\S{10,}|auth\\s*token)\\b");

    private static final List<Pattern> BLOCK_PATTERNS = List.of(
            Pattern.compile("(?i)\\b(sql\\s*injection|drop\\s+table|select\\s+\\*\\s+from)\\b"),
            Pattern.compile("(?i)(other\\s+user|someone\\s+else|their\\s+(email|password|phone|messages|chats))"),
            Pattern.compile("(?i)\\b(admin\\s+panel|internal\\s+only|database\\s+dump)\\b"),
            Pattern.compile("(?i)(show\\s+me|what\\s+is|give\\s+me)\\s+.{0,40}\\b(email|phone|password)\\b"));

    public Optional<Refusal> evaluate(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return Optional.empty();
        }
        String text = userMessage.toLowerCase(Locale.ROOT);

        if (matchesAny(ALLOW_PATTERNS, text)) {
            return Optional.empty();
        }
        if (GENERIC_CREDENTIAL_MENTION.matcher(text).find()) {
            return Optional.of(new Refusal("policy_sensitive_request", SAFE_REFUSAL));
        }
        if (matchesAny(BLOCK_PATTERNS, text)) {
            return Optional.of(new Refusal("policy_sensitive_request", SAFE_REFUSAL));
        }
        return Optional.empty();
    }

    private static boolean matchesAny(List<Pattern> patterns, String text) {
        for (Pattern p : patterns) {
            if (p.matcher(text).find()) {
                return true;
            }
        }
        return false;
    }

    public record Refusal(String category, String userMessage) {
    }
}
