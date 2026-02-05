package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "media_asset")
public class MediaAsset {

    public enum MediaType { PHOTO }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "media_id", nullable = false, updatable = false)
    private UUID mediaId;

    @Column(name = "uploader_user_id", nullable = false)
    private UUID uploaderUserId;

    @Column(name = "game_id")
    private UUID gameId;

    @Column(name = "match_record_revision_id")
    private UUID matchRecordRevisionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type")
    private MediaType mediaType;

    @Column(name = "storage_url", length = 500)
    private String storageUrl;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "visibility_id")
    private UUID visibilityId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "delete_after")
    private Instant deleteAfter;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ---- getters/setters ----

    public UUID getMediaId() { return mediaId; }
    public void setMediaId(UUID mediaId) { this.mediaId = mediaId; }

    public UUID getUploaderUserId() { return uploaderUserId; }
    public void setUploaderUserId(UUID uploaderUserId) { this.uploaderUserId = uploaderUserId; }

    public UUID getGameId() { return gameId; }
    public void setGameId(UUID gameId) { this.gameId = gameId; }

    public UUID getMatchRecordRevisionId() { return matchRecordRevisionId; }
    public void setMatchRecordRevisionId(UUID matchRecordRevisionId) { this.matchRecordRevisionId = matchRecordRevisionId; }

    public MediaType getMediaType() { return mediaType; }
    public void setMediaType(MediaType mediaType) { this.mediaType = mediaType; }

    public String getStorageUrl() { return storageUrl; }
    public void setStorageUrl(String storageUrl) { this.storageUrl = storageUrl; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public UUID getVisibilityId() { return visibilityId; }
    public void setVisibilityId(UUID visibilityId) { this.visibilityId = visibilityId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getDeleteAfter() { return deleteAfter; }
    public void setDeleteAfter(Instant deleteAfter) { this.deleteAfter = deleteAfter; }

    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
}
