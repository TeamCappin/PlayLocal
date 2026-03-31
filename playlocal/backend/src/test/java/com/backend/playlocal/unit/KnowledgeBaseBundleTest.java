package com.backend.playlocal.unit;

import com.backend.playlocal.service.knowledge.KnowledgeBaseBundle;
import com.backend.playlocal.service.knowledge.KnowledgeEntryModel;
import com.backend.playlocal.service.knowledge.KnowledgeFileRoot;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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

    @Test
    @DisplayName("handles parsed file with null entries list")
    void loadClasspathKb_NullEntries() throws Exception {
        ObjectMapper objectMapper = mock(ObjectMapper.class);
        when(objectMapper.readValue(any(java.io.InputStream.class), eq(KnowledgeFileRoot.class)))
                .thenReturn(new KnowledgeFileRoot(1, null));

        KnowledgeBaseBundle bundle = new KnowledgeBaseBundle(objectMapper);

        assertThat(bundle.allEntries()).isEmpty();
        assertThat(bundle.findById("anything")).isEmpty();
    }
}
