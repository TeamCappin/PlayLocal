package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.MediaAsset;
import com.backend.playlocal.repository.MediaAssetRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * DataJpaTest for MediaAssetRepository derived query methods.
 */
@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@ActiveProfiles("test")
class MediaAssetRepositoryTest {

    @Autowired
    private MediaAssetRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findByGameIdAndMediaTypeAndDeletedAtIsNullOrderByCreatedAtDesc should return only non-deleted assets in desc order")
    void findByGameIdAndMediaTypeAndDeletedAtIsNullOrderByCreatedAtDesc_FiltersAndOrders() {
        // Arrange
        UUID gameId = UUID.randomUUID();
        UUID otherGameId = UUID.randomUUID();

        MediaAsset keepOlder = new MediaAsset();
        keepOlder.setUploaderUserId(UUID.randomUUID());
        keepOlder.setGameId(gameId);
        keepOlder.setMediaType(MediaAsset.MediaType.PHOTO);
        keepOlder.setStorageUrl("k1");
        keepOlder.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        entityManager.persist(keepOlder);

        MediaAsset keepNewer = new MediaAsset();
        keepNewer.setUploaderUserId(UUID.randomUUID());
        keepNewer.setGameId(gameId);
        keepNewer.setMediaType(MediaAsset.MediaType.PHOTO);
        keepNewer.setStorageUrl("k2");
        keepNewer.setCreatedAt(Instant.parse("2026-01-02T00:00:00Z"));
        entityManager.persist(keepNewer);

        MediaAsset deleted = new MediaAsset();
        deleted.setUploaderUserId(UUID.randomUUID());
        deleted.setGameId(gameId);
        deleted.setMediaType(MediaAsset.MediaType.PHOTO);
        deleted.setStorageUrl("k3");
        deleted.setCreatedAt(Instant.parse("2026-01-03T00:00:00Z"));
        deleted.setDeletedAt(Instant.parse("2026-01-04T00:00:00Z"));
        entityManager.persist(deleted);

        MediaAsset otherGame = new MediaAsset();
        otherGame.setUploaderUserId(UUID.randomUUID());
        otherGame.setGameId(otherGameId);
        otherGame.setMediaType(MediaAsset.MediaType.PHOTO);
        otherGame.setStorageUrl("k4");
        otherGame.setCreatedAt(Instant.parse("2026-01-05T00:00:00Z"));
        entityManager.persist(otherGame);

        entityManager.flush();

        // Act
        List<MediaAsset> results = repository.findByGameIdAndMediaTypeAndDeletedAtIsNullOrderByCreatedAtDesc(
                gameId,
                MediaAsset.MediaType.PHOTO
        );

        // Assert
        assertThat(results).hasSize(2);
        assertThat(results.get(0).getMediaId()).isEqualTo(keepNewer.getMediaId());
        assertThat(results.get(1).getMediaId()).isEqualTo(keepOlder.getMediaId());
    }

    @Test
    @DisplayName("countByGameIdAndMediaTypeAndDeletedAtIsNull should count only non-deleted assets")
    void countByGameIdAndMediaTypeAndDeletedAtIsNull_CountsNonDeletedOnly() {
        // Arrange
        UUID gameId = UUID.randomUUID();

        MediaAsset keep1 = new MediaAsset();
        keep1.setUploaderUserId(UUID.randomUUID());
        keep1.setGameId(gameId);
        keep1.setMediaType(MediaAsset.MediaType.PHOTO);
        keep1.setStorageUrl("k1");
        keep1.setCreatedAt(Instant.now());
        entityManager.persist(keep1);

        MediaAsset keep2 = new MediaAsset();
        keep2.setUploaderUserId(UUID.randomUUID());
        keep2.setGameId(gameId);
        keep2.setMediaType(MediaAsset.MediaType.PHOTO);
        keep2.setStorageUrl("k2");
        keep2.setCreatedAt(Instant.now());
        entityManager.persist(keep2);

        MediaAsset deleted = new MediaAsset();
        deleted.setUploaderUserId(UUID.randomUUID());
        deleted.setGameId(gameId);
        deleted.setMediaType(MediaAsset.MediaType.PHOTO);
        deleted.setStorageUrl("k3");
        deleted.setCreatedAt(Instant.now());
        deleted.setDeletedAt(Instant.now());
        entityManager.persist(deleted);

        entityManager.flush();

        // Act
        long count = repository.countByGameIdAndMediaTypeAndDeletedAtIsNull(gameId, MediaAsset.MediaType.PHOTO);

        // Assert
        assertThat(count).isEqualTo(2L);
    }

    @Test
    @DisplayName("findByMediaId should return Optional with matching entity")
    void findByMediaId_ReturnsEntity() {
        // Arrange
        MediaAsset asset = new MediaAsset();
        asset.setUploaderUserId(UUID.randomUUID());
        asset.setGameId(UUID.randomUUID());
        asset.setMediaType(MediaAsset.MediaType.PHOTO);
        asset.setStorageUrl("k1");
        asset.setCreatedAt(Instant.now());
        entityManager.persist(asset);
        entityManager.flush();

        // Act
        Optional<MediaAsset> found = repository.findByMediaId(asset.getMediaId());

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getMediaId()).isEqualTo(asset.getMediaId());
    }
}
