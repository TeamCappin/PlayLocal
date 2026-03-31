package com.backend.playlocal.unit;

import com.backend.playlocal.service.knowledge.KnowledgeBaseBundle;
import com.backend.playlocal.service.knowledge.KnowledgeEntryModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class KnowledgeBaseBundleTest {

    @Test
    @DisplayName("loads kb-v1.json from classpath and indexes entries by id")
    void loadClasspathKb() {
        KnowledgeBaseBundle bundle = new KnowledgeBaseBundle(new ObjectMapper());

        assertThat(bundle.allEntries()).isNotEmpty();
        assertThat(bundle.findById("help-block-user"))
                .map(KnowledgeEntryModel::title)
                .hasValue("Blocking someone");
        assertThat(bundle.findById("nonexistent-id")).isEmpty();
        assertThat(bundle.findById(null)).isEmpty();
    }
}
