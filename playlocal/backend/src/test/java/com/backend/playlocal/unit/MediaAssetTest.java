package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.MediaAsset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class MediaAssetTest {

    @Test
    @DisplayName("MediaAsset should support getters/setters for all fields")
    void mediaAsset_GettersSetters() {
        // Arrange
        MediaAsset asset = new MediaAsset();
        UUID mediaId = UUID.randomUUID();
        UUID uploaderId = UUID.randomUUID();
        UUID gameId = UUID.randomUUID();
        UUID matchRevId = UUID.randomUUID();
        UUID visibilityId = UUID.randomUUID();
        Instant createdAt = Instant.now();
        Instant deleteAfter = createdAt.plusSeconds(3600);
        Instant deletedAt = createdAt.plusSeconds(7200);

        // Act
        asset.setMediaId(mediaId);
        asset.setUploaderUserId(uploaderId);
        asset.setGameId(gameId);
        asset.setMatchRecordRevisionId(matchRevId);
        asset.setMediaType(MediaAsset.MediaType.PHOTO);
        asset.setStorageUrl("storageKey");
        asset.setThumbnailUrl("thumbKey");
        asset.setVisibilityId(visibilityId);
        asset.setCreatedAt(createdAt);
        asset.setDeleteAfter(deleteAfter);
        asset.setDeletedAt(deletedAt);

        // Assert
        assertThat(asset.getMediaId()).isEqualTo(mediaId);
        assertThat(asset.getUploaderUserId()).isEqualTo(uploaderId);
        assertThat(asset.getGameId()).isEqualTo(gameId);
        assertThat(asset.getMatchRecordRevisionId()).isEqualTo(matchRevId);
        assertThat(asset.getMediaType()).isEqualTo(MediaAsset.MediaType.PHOTO);
        assertThat(asset.getStorageUrl()).isEqualTo("storageKey");
        assertThat(asset.getThumbnailUrl()).isEqualTo("thumbKey");
        assertThat(asset.getVisibilityId()).isEqualTo(visibilityId);
        assertThat(asset.getCreatedAt()).isEqualTo(createdAt);
        assertThat(asset.getDeleteAfter()).isEqualTo(deleteAfter);
        assertThat(asset.getDeletedAt()).isEqualTo(deletedAt);
    }
}
