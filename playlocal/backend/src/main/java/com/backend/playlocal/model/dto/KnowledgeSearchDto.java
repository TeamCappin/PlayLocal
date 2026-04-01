package com.backend.playlocal.model.dto;

import java.util.List;

public class KnowledgeSearchDto {

    public record Snippet(
            String id,
            String title,
            String section,
            double score,
            String excerpt) {
    }

    public record SearchResponse(List<Snippet> snippets) {
    }
}
