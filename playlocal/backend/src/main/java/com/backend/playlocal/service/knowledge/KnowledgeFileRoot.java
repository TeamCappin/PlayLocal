package com.backend.playlocal.service.knowledge;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record KnowledgeFileRoot(int version, List<KnowledgeEntryModel> entries) {
}
