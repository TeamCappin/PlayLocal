# AI assistant: knowledge base and user-data tools

## Knowledge base (source of truth)

- **Location:** `playlocal/backend/src/main/resources/knowledge-base/kb-v1.json`
- **Format:** Versioned JSON with curated entries. Each entry includes `id`, `title`, `section`, `navPath`, `keywords`, `relatedIds`, optional `docLink`, and `answerText`.
- **Runtime loading:** `KnowledgeBaseBundle` loads the file from the classpath at startup. Failures are logged; the assistant falls back to uncertainty responses if the file is missing.
- **Retrieval:** `KnowledgeRetrievalService` builds an in-memory TF–IDF index over `title`, `section`, `keywords`, and `answerText`. Tuning: `playlocal.assistant.kb.min-score` in `application.yml`.
- **API:** `GET /api/v1/ai/knowledge/search?q=` (authenticated) returns ranked snippets for debugging or future UI.

### Update process

1. Edit `kb-v1.json` only with **approved** product/support copy (no user-generated content).
2. Bump `version` when making structural or large content changes.
3. Prefer adding new `id`s rather than reusing IDs that may already appear in analytics citations.
4. Run backend unit tests (`KnowledgeRetrievalServiceTest`, `AiChatServiceTest`) after substantive changes.

## Permission-scoped user data tools

Implemented in `AssistantUserDataToolService`. The assistant never accepts another user’s ID from the chat message; all queries use the authenticated principal only.

| Tool | Purpose | Data access |
|------|---------|-------------|
| `UPCOMING_GAMES_THIS_WEEK` | Confirmed games in the current UTC Monday–Sunday window | `GameParticipationRepository.findConfirmedByUserSince` + in-memory filters (cancelled games and `leftAt` excluded) |
| `PENDING_FRIEND_REQUESTS` | Counts of received vs sent pending requests | `FriendshipRepository` pending queries for the current user |
| `MY_RELIABILITY_SUMMARY` | Score and attended / no-show counts | `UserRepository.findById` for the current user |

No chat bodies, other users’ emails, or roster details are exposed through these tools.

## Guardrails

`AssistantGuardrailService` blocks a small set of high-risk patterns (credentials, “other user” private data, obvious injection tropes). Refusals are logged as `assistant_refusal` with a **category** only (not the user’s message text at INFO).

## Telemetry (minimal)

| Event | Meaning |
|-------|---------|
| `assistant_kb_hit` | A KB entry was used in the reply (`kbEntryId`) |
| `assistant_kb_miss` | No usable KB section (`reason`: `no_matching_entry` or `narrow_user_facts`) |
| `assistant_db_tool_used` | Whitelisted DB tool invoked (`tool` name) |
| `assistant_refusal` | Guardrail refusal (`category`) |
| `assistant_processing_error` | Unexpected failure (`error` class name only) |

Assistant-related INFO logs omit property maps; properties are logged at DEBUG.

## Chat behavior (summary)

Replies combine **only** approved KB `answerText` (with citation ID, nav path, related topics) and **factual strings** built server-side from the tools above. If neither applies, the assistant states uncertainty and suggests clarifying or using in-app navigation—no confident guessing.
