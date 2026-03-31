package com.backend.playlocal.unit;

import com.backend.playlocal.service.knowledge.KnowledgeBaseBundle;
import com.backend.playlocal.service.knowledge.KnowledgeEntryModel;
import com.backend.playlocal.service.knowledge.KnowledgeRetrievalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KnowledgeRetrievalServiceTest {

    @Mock
    private KnowledgeBaseBundle bundle;

    @Test
    @DisplayName("search ranks blocking entry for block query")
    void search_BlockQuery() {
        List<KnowledgeEntryModel> entries = List.of(
                new KnowledgeEntryModel(
                        "join",
                        "Join",
                        "Games",
                        List.of(),
                        List.of("join"),
                        List.of(),
                        null,
                        "How to join games"),
                new KnowledgeEntryModel(
                        "block",
                        "Block",
                        "Safety",
                        List.of(),
                        List.of("block", "ignore"),
                        List.of(),
                        null,
                        "How to block someone"));
        when(bundle.allEntries()).thenReturn(entries);

        KnowledgeRetrievalService svc = new KnowledgeRetrievalService(bundle, 0.01, 1);
        List<KnowledgeRetrievalService.KnowledgeHit> hits = svc.search("How do I block a user?", 2);

        assertThat(hits).isNotEmpty();
        assertThat(hits.get(0).entry().id()).isEqualTo("block");
    }

    @Test
    @DisplayName("blank query returns no hits")
    void search_Blank() {
        when(bundle.allEntries()).thenReturn(List.of());
        KnowledgeRetrievalService svc = new KnowledgeRetrievalService(bundle, 0.01, 1);
        assertThat(svc.search("   ", 3)).isEmpty();
    }

    @Test
    @DisplayName("query with no token overlap returns no hits even with low score threshold")
    void search_NoOverlap_ReturnsEmpty() {
        List<KnowledgeEntryModel> entries = List.of(
                new KnowledgeEntryModel(
                        "block",
                        "Block",
                        "Safety",
                        List.of(),
                        List.of("block"),
                        List.of(),
                        null,
                        "How to block someone"));
        when(bundle.allEntries()).thenReturn(entries);
        KnowledgeRetrievalService svc = new KnowledgeRetrievalService(bundle, 0.0, 1);
        assertThat(svc.search("Who is mo salah", 3)).isEmpty();
    }
}
