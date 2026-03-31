package com.backend.playlocal.service.knowledge;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record KnowledgeEntryModel(
        String id,
        String title,
        String section,
        List<String> navPath,
        List<String> keywords,
        List<String> relatedIds,
        String docLink,
        String answerText) {

    public String searchableText() {
        StringBuilder sb = new StringBuilder();
        if (title != null) {
            sb.append(title).append(' ');
        }
        if (section != null) {
            sb.append(section).append(' ');
        }
        if (keywords != null && !keywords.isEmpty()) {
            sb.append(String.join(" ", keywords)).append(' ');
        }
        if (answerText != null) {
            sb.append(answerText);
        }
        return sb.toString();
    }
}
