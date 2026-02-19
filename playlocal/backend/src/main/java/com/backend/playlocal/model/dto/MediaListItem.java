package com.backend.playlocal.model.dto;

import java.time.Instant;
import java.util.UUID;

public class MediaListItem {
    private UUID mediaId;
    private String url;          // presigned GET url
    private Instant createdAt;
    private UUID uploaderUserId;

    public MediaListItem() {}

    public MediaListItem(UUID mediaId, String url, Instant createdAt, UUID uploaderUserId) {
        this.mediaId = mediaId;
        this.url = url;
        this.createdAt = createdAt;
        this.uploaderUserId = uploaderUserId;
    }

    public UUID getMediaId() { return mediaId; }
    public void setMediaId(UUID mediaId) { this.mediaId = mediaId; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public UUID getUploaderUserId() { return uploaderUserId; }
    public void setUploaderUserId(UUID uploaderUserId) { this.uploaderUserId = uploaderUserId; }
}
