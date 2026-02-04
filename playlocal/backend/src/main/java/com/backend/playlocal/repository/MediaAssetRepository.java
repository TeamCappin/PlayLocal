package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.MediaAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID> {

    List<MediaAsset> findByGameIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID gameId);

    List<MediaAsset> findByGameIdAndMediaTypeAndDeletedAtIsNullOrderByCreatedAtDesc(
            UUID gameId,
            MediaAsset.MediaType mediaType
    );

    List<MediaAsset> findByMatchRecordRevisionIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID matchRecordRevisionId);

    List<MediaAsset> findByMatchRecordRevisionIdAndMediaTypeAndDeletedAtIsNullOrderByCreatedAtDesc(
            UUID matchRecordRevisionId,
            MediaAsset.MediaType mediaType
    );

    Optional<MediaAsset> findByMediaId(UUID mediaId);

    long countByGameIdAndMediaTypeAndDeletedAtIsNull(UUID gameId, MediaAsset.MediaType mediaType);
}
