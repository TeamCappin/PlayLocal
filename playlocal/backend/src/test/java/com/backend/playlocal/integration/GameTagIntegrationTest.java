package com.backend.playlocal.integration;

import com.backend.playlocal.model.entity.GameTag;
import com.backend.playlocal.repository.GameTagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for Community Tags API (US-4.2).
 */
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@Tag("integration")
class GameTagIntegrationTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private GameTagRepository tagRepository;

    @BeforeEach
    void setup() {
        tagRepository.deleteAll();
    }

    @Test
    @DisplayName("US-4.2: GET /api/v1/games/tags should return all system tags")
    @WithMockUser
    void getTags_ReturnsAllSystemTags() throws Exception {
        // Given: System tags exist in database (created by migration)
        GameTag tag1 = GameTag.builder()
                .tagType("community")
                .name("women")
                .isSystemTag(true)
                .isRestricted(true)
                .build();
        GameTag tag2 = GameTag.builder()
                .tagType("language")
                .name("french-speaking")
                .isSystemTag(true)
                .isRestricted(false)
                .build();
        tagRepository.saveAll(List.of(tag1, tag2));

        // When: GET /api/v1/games/tags
        // Then: Returns all system tags
        mockMvc.perform(get("/api/v1/games/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].tagType").exists())
                .andExpect(jsonPath("$[0].isRestricted").exists());
    }

    @Test
    @DisplayName("US-4.2: Tags should have correct structure")
    @WithMockUser
    void getTags_ReturnsCorrectStructure() throws Exception {
        // Given: A restricted community tag
        GameTag tag = GameTag.builder()
                .tagType("community")
                .name("men")
                .isSystemTag(true)
                .isRestricted(true)
                .build();
        tagRepository.save(tag);

        // When/Then: Verify tag structure
        mockMvc.perform(get("/api/v1/games/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tagId").exists())
                .andExpect(jsonPath("$[0].name").value("men"))
                .andExpect(jsonPath("$[0].tagType").value("community"))
                .andExpect(jsonPath("$[0].isRestricted").value(true));
    }

    @Test
    @DisplayName("US-4.2: GET /api/v1/games/tags should return empty list when no tags exist")
    @WithMockUser
    void getTags_ReturnsEmptyListWhenNoTags() throws Exception {
        // When: No tags in database
        // Then: Returns empty array
        mockMvc.perform(get("/api/v1/games/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
