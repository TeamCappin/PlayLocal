package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.MediaListItem;
import com.backend.playlocal.model.dto.RequestUploadSlotRequest;
import com.backend.playlocal.model.dto.RequestUploadSlotResponse;
import com.backend.playlocal.model.entity.MediaAsset;
import com.backend.playlocal.repository.MediaAssetRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MediaService {

    private final MediaAssetRepository mediaRepo;
    private final S3Client s3;
    private final S3Presigner presigner;
    private static final int MAX_PHOTOS_PER_GAME = 5;
    private static final UUID DEFAULT_VISIBILITY_ID = UUID.fromString("77830009-26af-4661-9b9b-e778899cd9ae");
    
    @Value("${s3.bucket:uploads}")
    private String bucketName;

    @Value("${s3.presignExpirySeconds:900}")
    private long presignExpirySeconds;

    public MediaService(MediaAssetRepository mediaRepo, S3Client s3, S3Presigner presigner) {
        this.mediaRepo = mediaRepo;
        this.s3 = s3;
        this.presigner = presigner;
    }

    public RequestUploadSlotResponse requestPhotoUploadSlot(UUID gameId, UUID uploaderUserId, RequestUploadSlotRequest req) {

        long existing = mediaRepo.countByGameIdAndMediaTypeAndDeletedAtIsNull(gameId, MediaAsset.MediaType.PHOTO);
        if (existing >= MAX_PHOTOS_PER_GAME) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Max " + MAX_PHOTOS_PER_GAME + " photos per game"
            );
        }

        MediaAsset asset = new MediaAsset();
        asset.setUploaderUserId(uploaderUserId);
        asset.setGameId(gameId);
        asset.setMatchRecordRevisionId(null);
        asset.setMediaType(MediaAsset.MediaType.PHOTO);

        asset.setStorageUrl(null);   // will set after ID exists
        asset.setThumbnailUrl(null);
        asset.setVisibilityId(DEFAULT_VISIBILITY_ID);
        asset.setCreatedAt(Instant.now());
        asset.setDeleteAfter(null);
        asset.setDeletedAt(null);

        // Force insert so Postgres generates media_id
        asset = mediaRepo.save(asset);

        UUID mediaId = asset.getMediaId();
        if (mediaId == null) {
            throw new IllegalStateException("DB did not generate media_id");
        }

        String objectKey = "games/" + gameId + "/photos/" + mediaId;

        asset.setStorageUrl(objectKey);
        mediaRepo.save(asset);

        String uploadUrl = presignPut(bucketName, objectKey, req != null ? req.getContentType() : null);

        return new RequestUploadSlotResponse(mediaId, uploadUrl, objectKey);
    }



    /**
     * Optional finalize endpoint: verifies the object exists (HEAD).
     * If you later add thumbnails / metadata extraction, do it here.
     */
    public void finalizeUpload(UUID gameId, UUID mediaId, UUID userId) {
        MediaAsset asset = mediaRepo.findById(mediaId)
                .orElseThrow(() -> new IllegalArgumentException("Media not found"));

        // basic ownership check (optional)
        if (!asset.getUploaderUserId().equals(userId)) {
            throw new IllegalArgumentException("Not your media");
        }

        // basic parent check (optional)
        if (asset.getGameId() == null || !asset.getGameId().equals(gameId)) {
            throw new IllegalArgumentException("Media does not belong to this game");
        }

        // verify object exists in storage
        try {
            s3.headObject(
                    HeadObjectRequest.builder()
                            .bucket(bucketName)
                            .key(asset.getStorageUrl())
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Upload not found in storage (did you PUT to the presigned URL?)", e);
        }
    }

    public List<MediaListItem> listReadyPhotos(UUID gameId, UUID viewerUserId) {
        // If you later enforce visibility rules, apply them here using viewerUserId + visibilityId.
        List<MediaAsset> assets = mediaRepo.findByGameIdAndMediaTypeAndDeletedAtIsNullOrderByCreatedAtDesc(
                gameId,
                MediaAsset.MediaType.PHOTO
        );

        return assets.stream()
                .map(a -> new MediaListItem(
                        a.getMediaId(),
                        presignGet(bucketName, a.getStorageUrl()),
                        a.getCreatedAt(),
                        a.getUploaderUserId()
                ))
                .toList();
    }

    private String presignPut(String bucket, String key, String contentType) {
        PutObjectRequest.Builder putReq = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key);

        if (contentType != null && !contentType.isBlank()) {
            putReq = putReq.contentType(contentType);
        }

        PutObjectPresignRequest presignReq = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(presignExpirySeconds))
                .putObjectRequest(putReq.build())
                .build();

        return presigner.presignPutObject(presignReq).url().toString();
    }

    private String presignGet(String bucket, String key) {
        GetObjectRequest getReq = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        GetObjectPresignRequest presignReq = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(presignExpirySeconds))
                .getObjectRequest(getReq)
                .build();

        return presigner.presignGetObject(presignReq).url().toString();
    }
}
