package com.backend.playlocal.unit;

import com.backend.playlocal.service.knowledge.KnowledgeEntryModel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class KnowledgeEntryModelTest {

    @Test
    @DisplayName("searchableText concatenates fields used for retrieval overlap")
    void searchableText_CombinesFields() {
        KnowledgeEntryModel e = new KnowledgeEntryModel(
                "id-1",
                "Title",
                "Section",
                List.of("A", "B"),
                List.of("kw1", "kw2"),
                List.of(),
                "/doc",
                "Answer body.");
        String s = e.searchableText();
        assertThat(s).contains("Title").contains("Section").contains("kw1").contains("Answer body");
    }

    @Test
    @DisplayName("searchableText tolerates null optional fields")
    void searchableText_Nulls() {
        KnowledgeEntryModel e = new KnowledgeEntryModel(
                "id-2",
                null,
                null,
                List.of(),
                null,
                List.of(),
                null,
                null);
        assertThat(e.searchableText()).isEmpty();
    }
}
