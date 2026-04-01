package com.backend.playlocal.service.knowledge;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class KnowledgeRetrievalService {

    private final KnowledgeBaseBundle bundle;
    private final double minScore;
    private final int minTokenOverlap;

    private final TfidfIndex index;

    public KnowledgeRetrievalService(
            KnowledgeBaseBundle bundle,
            @Value("${playlocal.assistant.kb.min-score:0.12}") double minScore,
            @Value("${playlocal.assistant.kb.min-token-overlap:1}") int minTokenOverlap) {
        this.bundle = bundle;
        this.minScore = minScore;
        this.minTokenOverlap = minTokenOverlap;
        this.index = new TfidfIndex(bundle.allEntries());
    }

    public List<KnowledgeHit> search(String query, int topK) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        Set<String> queryTokens = new HashSet<>(TextTokenizer.tokenize(query.trim()));
        return index.search(query.trim(), topK).stream()
                .filter(h -> h.score() >= minScore)
                .filter(h -> tokenOverlap(queryTokens, h.entry()) >= minTokenOverlap)
                .map(h -> new KnowledgeHit(h.entry(), h.score()))
                .collect(Collectors.toList());
    }

    private int tokenOverlap(Set<String> queryTokens, KnowledgeEntryModel entry) {
        if (queryTokens.isEmpty()) {
            return 0;
        }
        Set<String> entryTokens = new HashSet<>(TextTokenizer.tokenize(entry.searchableText()));
        int count = 0;
        for (String t : queryTokens) {
            if (entryTokens.contains(t)) {
                count++;
            }
        }
        return count;
    }

    public record KnowledgeHit(KnowledgeEntryModel entry, double score) {
    }
}
