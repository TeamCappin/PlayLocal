package com.backend.playlocal.service.knowledge;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class KnowledgeBaseBundle {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseBundle.class);
    private static final String RESOURCE = "knowledge-base/kb-v1.json";

    private final List<KnowledgeEntryModel> entries;
    private final Map<String, KnowledgeEntryModel> byId;

    public KnowledgeBaseBundle(ObjectMapper objectMapper) {
        List<KnowledgeEntryModel> loaded = List.of();
        try (InputStream in = new ClassPathResource(RESOURCE).getInputStream()) {
            KnowledgeFileRoot root = objectMapper.readValue(in, KnowledgeFileRoot.class);
            if (root.entries() != null) {
                loaded = List.copyOf(root.entries());
            }
        } catch (IOException e) {
            log.error("Failed to load knowledge base from {}: {}", RESOURCE, e.toString());
        }
        this.entries = loaded;
        Map<String, KnowledgeEntryModel> map = new HashMap<>();
        for (KnowledgeEntryModel e : entries) {
            if (e.id() != null) {
                map.put(e.id(), e);
            }
        }
        this.byId = Collections.unmodifiableMap(map);
    }

    public List<KnowledgeEntryModel> allEntries() {
        return entries;
    }

    public Optional<KnowledgeEntryModel> findById(String id) {
        return Optional.ofNullable(id).map(byId::get);
    }
}
