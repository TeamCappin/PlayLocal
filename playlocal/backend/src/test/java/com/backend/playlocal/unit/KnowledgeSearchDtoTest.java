package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.KnowledgeSearchDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class KnowledgeSearchDtoTest {

    @Test
    @DisplayName("outer DTO class can be instantiated")
    void outerClass_Instantiation() {
        KnowledgeSearchDto dto = new KnowledgeSearchDto();
        assertThat(dto).isNotNull();
    }

    @Test
    @DisplayName("snippet and search response records expose assigned values")
    void records_ExposeValues() {
        KnowledgeSearchDto.Snippet snippet = new KnowledgeSearchDto.Snippet(
                "help-block-user", "Blocking someone", "Safety", 0.42, "Use block in settings.");
        KnowledgeSearchDto.SearchResponse response = new KnowledgeSearchDto.SearchResponse(List.of(snippet));

        assertThat(snippet.id()).isEqualTo("help-block-user");
        assertThat(snippet.score()).isEqualTo(0.42);
        assertThat(response.snippets()).hasSize(1);
        assertThat(response.snippets().get(0).title()).isEqualTo("Blocking someone");
    }
}
