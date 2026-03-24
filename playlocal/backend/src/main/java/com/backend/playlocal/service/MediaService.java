package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.MediaListItem;
import com.backend.playlocal.model.dto.RequestUploadSlotRequest;
import com.backend.playlocal.model.dto.RequestUploadSlotResponse;
import com.backend.playlocal.model.entity.ContentVisibility;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.MediaAsset;
import com.backend.playlocal.repository.ContentVisibilityRepository;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.MediaAssetRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
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
    private final GameRepository gameRepo;
    private final GameParticipationRepository gameParticipationRepo;
    private final ContentVisibilityRepository contentVisibilityRepo;
    private final S3Client s3;
    private final S3Presigner presigner;
    private static final int MAX_PHOTOS_PER_GAME = 5;
    private static final String DEFAULT_VISIBILITY_CODE = "public";

    @Value("${s3.bucket:uploads}")
    private String bucketName;

    @Value("${s3.presignExpirySeconds:900}")
    private long presignExpirySeconds;

    public MediaService(
            MediaAssetRepository mediaRepo,
            GameRepository gameRepo,
            GameParticipationRepository gameParticipationRepo,
            ContentVisibilityRepository contentVisibilityRepo,
            S3Client s3,
            S3Presigner presigner
    ) {
        this.mediaRepo = mediaRepo;
        this.gameRepo = gameRepo;
        this.gameParticipationRepo = gameParticipationRepo;
        this.contentVisibilityRepo = contentVisibilityRepo;
        this.s3 = s3;
        this.presigner = presigner;
    }

    public RequestUploadSlotResponse requestPhotoUploadSlot(UUID gameId, UUID uploaderUserId, RequestUploadSlotRequest req) {
        Game game = gameRepo.findById(gameId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Game not found"
                ));

        if (!canUploadPhotos(game, uploaderUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Join the game to upload photos"
            );
        }

        ContentVisibility defaultVisibility = contentVisibilityRepo.findByCode(DEFAULT_VISIBILITY_CODE)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Default photo visibility is not configured"
                ));

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
        asset.setVisibilityId(defaultVisibility.getContentVisibilityId());
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

    private boolean canUploadPhotos(Game game, UUID userId) {
        if (game.getCreatedBy() != null && game.getCreatedBy().getUserId().equals(userId)) {
            return true;
        }

        return gameParticipationRepo.findByGameAndUser(game.getGameId(), userId)
                .filter(participation -> participation.getLeftAt() == null)
                .map(GameParticipation::getJoinStatus)
                .filter(status ->
                        status == GameParticipation.JoinStatus.CONFIRMED ||
                        status == GameParticipation.JoinStatus.WAITLISTED
                )
                .isPresent();
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

    /**
     * US-7.15: Delete a photo (soft delete in DB, hard delete from S3).
     * Only the uploader or game organizer can delete.
     */
    public void deletePhoto(UUID gameId, UUID mediaId, UUID userId) {
        // Get the media asset
        MediaAsset asset = mediaRepo.findById(mediaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Photo not found"
                ));

        // Verify it belongs to the correct game
        if (asset.getGameId() == null || !asset.getGameId().equals(gameId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Photo does not belong to this game"
            );
        }

        // Verify it's not already deleted
        if (asset.getDeletedAt() != null) {
            throw new ResponseStatusException(
                    HttpStatus.GONE,
                    "Photo already deleted"
            );
        }

        // Check authorization: uploader or game organizer
        boolean isUploader = asset.getUploaderUserId().equals(userId);
        boolean isOrganizer = false;

        Game game = gameRepo.findById(gameId).orElse(null);
        if (game != null && game.getCreatedBy() != null && game.getCreatedBy().getUserId().equals(userId)) {
            isOrganizer = true;
        }

        if (!isUploader && !isOrganizer) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the photo uploader or game organizer can delete this photo"
            );
        }

        // Soft delete in database
        asset.setDeletedAt(Instant.now());
        mediaRepo.save(asset);

        // Hard delete from S3 (optional - could be done by scheduled cleanup job)
        try {
            s3.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(asset.getStorageUrl())
                    .build());
        } catch (Exception e) {
            // Log but don't fail - the soft delete succeeded
            System.err.println("Failed to delete photo from S3: " + e.getMessage());
        }
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
