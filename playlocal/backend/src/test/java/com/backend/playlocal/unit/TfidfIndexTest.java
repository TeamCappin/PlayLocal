package com.backend.playlocal.unit;

import com.backend.playlocal.service.knowledge.KnowledgeEntryModel;
import com.backend.playlocal.service.knowledge.TfidfIndex;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TfidfIndexTest {

    @Test
    @DisplayName("search returns empty for blank query or empty corpus")
    void search_BlankOrEmpty() {
        TfidfIndex empty = new TfidfIndex(List.of());
        assertThat(empty.search("block", 3)).isEmpty();

        TfidfIndex index = new TfidfIndex(List.of(
                new KnowledgeEntryModel("id", "Title", "S", List.of(), List.of("block"), List.of(), null, "x")
        ));
        assertThat(index.search("   ", 3)).isEmpty();
    }

    @Test
    @DisplayName("search ranks relevant entry first and honors topK")
    void search_RanksAndTopK() {
        KnowledgeEntryModel block = new KnowledgeEntryModel(
                "block", "Blocking", "Safety", List.of(), List.of("block"), List.of(), null, "Block abusive users");
        KnowledgeEntryModel join = new KnowledgeEntryModel(
                "join", "Joining", "Games", List.of(), List.of("join"), List.of(), null, "Join open games");

        TfidfIndex index = new TfidfIndex(List.of(block, join));
        List<TfidfIndex.ScoredEntry> hits = index.search("how to block user", 1);

        assertThat(hits).hasSize(1);
        assertThat(hits.get(0).entry().id()).isEqualTo("block");
        assertThat(hits.get(0).score()).isPositive();
    }

    @Test
    @DisplayName("search drops non-overlapping entries due to zero cosine")
    void search_DropsZeroSimilarity() {
        KnowledgeEntryModel join = new KnowledgeEntryModel(
                "join", "Joining", "Games", List.of(), List.of("join"), List.of(), null, "Join open games");

        TfidfIndex index = new TfidfIndex(List.of(join));
        assertThat(index.search("password reset", 3)).isEmpty();
    }
}
