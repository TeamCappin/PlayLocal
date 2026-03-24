package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.MediaListItem;
import com.backend.playlocal.model.dto.RequestUploadSlotRequest;
import com.backend.playlocal.model.dto.RequestUploadSlotResponse;
import com.backend.playlocal.model.entity.ContentVisibility;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.MediaAsset;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.ContentVisibilityRepository;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.MediaAssetRepository;
import com.backend.playlocal.service.MediaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.lang.reflect.Field;
import java.net.URL;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MediaService.
 */
@ExtendWith(MockitoExtension.class)
class MediaServiceTest {

    @Mock
    private MediaAssetRepository mediaRepo;

    @Mock
    private GameRepository gameRepo;

    @Mock
    private GameParticipationRepository gameParticipationRepo;

    @Mock
    private ContentVisibilityRepository contentVisibilityRepo;

    @Mock
    private S3Client s3;

    @Mock
    private S3Presigner presigner;

    @InjectMocks
    private MediaService mediaService;

    private static void setPrivateField(Object target, String fieldName, Object value) {
        try {
            Field f = target.getClass().getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field: " + fieldName, e);
        }
    }

    private static Game organizerGame(UUID gameId, UUID organizerId) {
        User organizer = new User();
        organizer.setUserId(organizerId);

        Game game = new Game();
        game.setGameId(gameId);
        game.setCreatedBy(organizer);
        return game;
    }

    private static ContentVisibility contentVisibility(UUID id, String code) {
        ContentVisibility visibility = new ContentVisibility();
        visibility.setContentVisibilityId(id);
        visibility.setCode(code);
        return visibility;
    }

    private static GameParticipation participation(Game game, UUID userId, GameParticipation.JoinStatus status, Instant leftAt) {
        User user = new User();
        user.setUserId(userId);

        GameParticipation participation = new GameParticipation();
        participation.setGame(game);
        participation.setUser(user);
        participation.setJoinStatus(status);
        participation.setLeftAt(leftAt);
        return participation;
    }

    @Nested
    class RequestUploadSlotTests {

        @Test
        @DisplayName("requestPhotoUploadSlot should reject when max photos per game is reached")
        void requestPhotoUploadSlot_RejectsWhenLimitReached() {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID uploaderUserId = UUID.randomUUID();
            UUID visibilityId = UUID.randomUUID();
            Game game = organizerGame(gameId, uploaderUserId);

            when(gameRepo.findById(eq(gameId))).thenReturn(Optional.of(game));
            when(contentVisibilityRepo.findByCode("public"))
                    .thenReturn(Optional.of(contentVisibility(visibilityId, "public")));

            when(mediaRepo.countByGameIdAndMediaTypeAndDeletedAtIsNull(eq(gameId), eq(MediaAsset.MediaType.PHOTO)))
                    .thenReturn(5L);

            // Act + Assert
            assertThatThrownBy(() -> mediaService.requestPhotoUploadSlot(
                    gameId, uploaderUserId, new RequestUploadSlotRequest("image/jpeg", "a.jpg")
            ))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> {
                        ResponseStatusException rse = (ResponseStatusException) ex;
                        assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                        assertThat(rse.getReason()).contains("Max 5 photos per game");
                    });

            verify(mediaRepo).countByGameIdAndMediaTypeAndDeletedAtIsNull(eq(gameId), eq(MediaAsset.MediaType.PHOTO));
            verifyNoMoreInteractions(mediaRepo);
        }

        @Test
        @DisplayName("requestPhotoUploadSlot should create MediaAsset, store objectKey, and return presigned PUT url (with contentType)")
        void requestPhotoUploadSlot_HappyPath_WithContentType() throws Exception {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID uploaderUserId = UUID.randomUUID();
            UUID generatedMediaId = UUID.randomUUID();
            UUID visibilityId = UUID.randomUUID();
            Game game = organizerGame(gameId, uploaderUserId);

            setPrivateField(mediaService, "bucketName", "uploads");
            setPrivateField(mediaService, "presignExpirySeconds", 900L);

            when(gameRepo.findById(eq(gameId))).thenReturn(Optional.of(game));
            when(contentVisibilityRepo.findByCode("public"))
                    .thenReturn(Optional.of(contentVisibility(visibilityId, "public")));
            when(mediaRepo.countByGameIdAndMediaTypeAndDeletedAtIsNull(eq(gameId), eq(MediaAsset.MediaType.PHOTO)))
                    .thenReturn(0L);

            // First save: simulate DB-generated mediaId
            when(mediaRepo.save(any(MediaAsset.class))).thenAnswer(inv -> {
                MediaAsset a = inv.getArgument(0);
                if (a.getMediaId() == null) {
                    a.setMediaId(generatedMediaId);
                }
                return a;
            });

            PresignedPutObjectRequest presignedPut = mock(PresignedPutObjectRequest.class);
            when(presignedPut.url()).thenReturn(new URL("http://example.com/put"));
            when(presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedPut);

            RequestUploadSlotRequest req = new RequestUploadSlotRequest("image/jpeg", "photo.jpg");

            ArgumentCaptor<MediaAsset> savedAssetCaptor = ArgumentCaptor.forClass(MediaAsset.class);
            ArgumentCaptor<PutObjectPresignRequest> presignCaptor = ArgumentCaptor.forClass(PutObjectPresignRequest.class);

            // Act
            RequestUploadSlotResponse resp = mediaService.requestPhotoUploadSlot(gameId, uploaderUserId, req);

            // Assert
            // Assert
            assertThat(resp.getMediaId()).isEqualTo(generatedMediaId);
            assertThat(resp.getUploadUrl()).isEqualTo("http://example.com/put");
            assertThat(resp.getObjectKey()).isEqualTo("games/" + gameId + "/photos/" + generatedMediaId);

            verify(mediaRepo, times(2)).save(savedAssetCaptor.capture());
            List<MediaAsset> savedAssets = savedAssetCaptor.getAllValues();

            String expectedKey = "games/" + gameId + "/photos/" + generatedMediaId;

            assertThat(savedAssets.get(0).getStorageUrl()).isEqualTo(expectedKey);
            assertThat(savedAssets.get(0).getUploaderUserId()).isEqualTo(uploaderUserId);
            assertThat(savedAssets.get(0).getGameId()).isEqualTo(gameId);
            assertThat(savedAssets.get(0).getMediaType()).isEqualTo(MediaAsset.MediaType.PHOTO);
            assertThat(savedAssets.get(0).getVisibilityId()).isEqualTo(visibilityId);

            assertThat(savedAssets.get(1).getStorageUrl()).isEqualTo(expectedKey);

            verify(presigner).presignPutObject(presignCaptor.capture());
            assertThat(presignCaptor.getValue().putObjectRequest().contentType()).isEqualTo("image/jpeg");

        }

        @Test
        @DisplayName("requestPhotoUploadSlot should still presign PUT when request body is null (no contentType)")
        void requestPhotoUploadSlot_AllowsNullRequest_NoContentType() throws Exception {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID uploaderUserId = UUID.randomUUID();
            UUID generatedMediaId = UUID.randomUUID();
            Game game = organizerGame(gameId, uploaderUserId);

            setPrivateField(mediaService, "bucketName", "uploads");
            setPrivateField(mediaService, "presignExpirySeconds", 900L);

            when(gameRepo.findById(eq(gameId))).thenReturn(Optional.of(game));
            when(contentVisibilityRepo.findByCode("public"))
                    .thenReturn(Optional.of(contentVisibility(UUID.randomUUID(), "public")));
            when(mediaRepo.countByGameIdAndMediaTypeAndDeletedAtIsNull(eq(gameId), eq(MediaAsset.MediaType.PHOTO)))
                    .thenReturn(0L);

            when(mediaRepo.save(any(MediaAsset.class))).thenAnswer(inv -> {
                MediaAsset a = inv.getArgument(0);
                if (a.getMediaId() == null) a.setMediaId(generatedMediaId);
                return a;
            });

            PresignedPutObjectRequest presignedPut = mock(PresignedPutObjectRequest.class);
            when(presignedPut.url()).thenReturn(new URL("http://example.com/put"));
            when(presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedPut);

            ArgumentCaptor<PutObjectPresignRequest> presignCaptor = ArgumentCaptor.forClass(PutObjectPresignRequest.class);

            // Act
            RequestUploadSlotResponse resp = mediaService.requestPhotoUploadSlot(gameId, uploaderUserId, null);

            // Assert
            assertThat(resp.getMediaId()).isEqualTo(generatedMediaId);
            verify(presigner).presignPutObject(presignCaptor.capture());
            assertThat(presignCaptor.getValue().putObjectRequest().contentType()).isNull();
        }

        @Test
        @DisplayName("requestPhotoUploadSlot should throw IllegalStateException when DB does not generate media_id")
        void requestPhotoUploadSlot_ThrowsWhenMediaIdNotGenerated() {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID uploaderUserId = UUID.randomUUID();
            Game game = organizerGame(gameId, uploaderUserId);

            when(gameRepo.findById(eq(gameId))).thenReturn(Optional.of(game));
            when(contentVisibilityRepo.findByCode("public"))
                    .thenReturn(Optional.of(contentVisibility(UUID.randomUUID(), "public")));
            when(mediaRepo.countByGameIdAndMediaTypeAndDeletedAtIsNull(eq(gameId), eq(MediaAsset.MediaType.PHOTO)))
                    .thenReturn(0L);

            when(mediaRepo.save(any(MediaAsset.class))).thenAnswer(inv -> inv.getArgument(0)); // mediaId remains null

            // Act + Assert
            assertThatThrownBy(() -> mediaService.requestPhotoUploadSlot(
                    gameId, uploaderUserId, new RequestUploadSlotRequest("image/jpeg", "a.jpg")
            ))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("DB did not generate media_id");
        }

        @Test
        @DisplayName("requestPhotoUploadSlot should return 404 when the game does not exist")
        void requestPhotoUploadSlot_ThrowsWhenGameMissing() {
            UUID gameId = UUID.randomUUID();

            when(gameRepo.findById(eq(gameId))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mediaService.requestPhotoUploadSlot(
                    gameId,
                    UUID.randomUUID(),
                    new RequestUploadSlotRequest("image/jpeg", "a.jpg")
            ))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> {
                        ResponseStatusException rse = (ResponseStatusException) ex;
                        assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                        assertThat(rse.getReason()).contains("Game not found");
                    });

            verifyNoInteractions(mediaRepo, contentVisibilityRepo, gameParticipationRepo);
        }

        @Test
        @DisplayName("requestPhotoUploadSlot should reject when the user has not joined the game")
        void requestPhotoUploadSlot_RejectsUnauthorizedUser() {
            UUID gameId = UUID.randomUUID();
            UUID organizerId = UUID.randomUUID();
            UUID uploaderUserId = UUID.randomUUID();
            Game game = organizerGame(gameId, organizerId);

            when(gameRepo.findById(eq(gameId))).thenReturn(Optional.of(game));
            when(gameParticipationRepo.findByGameAndUser(gameId, uploaderUserId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> mediaService.requestPhotoUploadSlot(
                    gameId,
                    uploaderUserId,
                    new RequestUploadSlotRequest("image/jpeg", "a.jpg")
            ))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> {
                        ResponseStatusException rse = (ResponseStatusException) ex;
                        assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                        assertThat(rse.getReason()).contains("Join the game to upload photos");
                    });

            verifyNoInteractions(contentVisibilityRepo);
            verifyNoInteractions(mediaRepo);
        }

        @Test
        @DisplayName("requestPhotoUploadSlot should allow an active participant")
        void requestPhotoUploadSlot_AllowsActiveParticipant() throws Exception {
            UUID gameId = UUID.randomUUID();
            UUID organizerId = UUID.randomUUID();
            UUID uploaderUserId = UUID.randomUUID();
            UUID generatedMediaId = UUID.randomUUID();
            UUID visibilityId = UUID.randomUUID();
            Game game = organizerGame(gameId, organizerId);

            setPrivateField(mediaService, "bucketName", "uploads");
            setPrivateField(mediaService, "presignExpirySeconds", 900L);

            when(gameRepo.findById(eq(gameId))).thenReturn(Optional.of(game));
            when(gameParticipationRepo.findByGameAndUser(gameId, uploaderUserId))
                    .thenReturn(Optional.of(participation(
                            game,
                            uploaderUserId,
                            GameParticipation.JoinStatus.CONFIRMED,
                            null
                    )));
            when(contentVisibilityRepo.findByCode("public"))
                    .thenReturn(Optional.of(contentVisibility(visibilityId, "public")));
            when(mediaRepo.countByGameIdAndMediaTypeAndDeletedAtIsNull(eq(gameId), eq(MediaAsset.MediaType.PHOTO)))
                    .thenReturn(0L);
            when(mediaRepo.save(any(MediaAsset.class))).thenAnswer(inv -> {
                MediaAsset a = inv.getArgument(0);
                if (a.getMediaId() == null) {
                    a.setMediaId(generatedMediaId);
                }
                return a;
            });

            PresignedPutObjectRequest presignedPut = mock(PresignedPutObjectRequest.class);
            when(presignedPut.url()).thenReturn(new URL("http://example.com/put"));
            when(presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedPut);

            RequestUploadSlotResponse response = mediaService.requestPhotoUploadSlot(
                    gameId,
                    uploaderUserId,
                    new RequestUploadSlotRequest("image/jpeg", "photo.jpg")
            );

            assertThat(response.getMediaId()).isEqualTo(generatedMediaId);
            verify(gameParticipationRepo).findByGameAndUser(gameId, uploaderUserId);
        }
    }

    @Nested
    class FinalizeUploadTests {

        @Test
        @DisplayName("finalizeUpload should throw when media does not exist")
        void finalizeUpload_ThrowsWhenNotFound() {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID mediaId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            when(mediaRepo.findById(eq(mediaId))).thenReturn(Optional.empty());

            // Act + Assert
            assertThatThrownBy(() -> mediaService.finalizeUpload(gameId, mediaId, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Media not found");
        }

        @Test
        @DisplayName("finalizeUpload should throw when user is not the uploader")
        void finalizeUpload_ThrowsWhenNotOwner() {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID mediaId = UUID.randomUUID();
            UUID uploaderId = UUID.randomUUID();
            UUID otherUserId = UUID.randomUUID();

            MediaAsset asset = new MediaAsset();
            asset.setMediaId(mediaId);
            asset.setGameId(gameId);
            asset.setUploaderUserId(uploaderId);
            asset.setStorageUrl("games/x/photos/y");
            asset.setCreatedAt(Instant.now());

            when(mediaRepo.findById(eq(mediaId))).thenReturn(Optional.of(asset));

            // Act + Assert
            assertThatThrownBy(() -> mediaService.finalizeUpload(gameId, mediaId, otherUserId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Not your media");
        }

        @Test
        @DisplayName("finalizeUpload should throw when media does not belong to the given game")
        void finalizeUpload_ThrowsWhenGameMismatch() {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID otherGameId = UUID.randomUUID();
            UUID mediaId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            MediaAsset asset = new MediaAsset();
            asset.setMediaId(mediaId);
            asset.setGameId(otherGameId);
            asset.setUploaderUserId(userId);
            asset.setStorageUrl("games/x/photos/y");
            asset.setCreatedAt(Instant.now());

            when(mediaRepo.findById(eq(mediaId))).thenReturn(Optional.of(asset));

            // Act + Assert
            assertThatThrownBy(() -> mediaService.finalizeUpload(gameId, mediaId, userId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Media does not belong to this game");
        }

        @Test
        @DisplayName("finalizeUpload should HEAD the object in S3 when checks pass")
        void finalizeUpload_HeadsObject_HappyPath() {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID mediaId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            setPrivateField(mediaService, "bucketName", "uploads");

            MediaAsset asset = new MediaAsset();
            asset.setMediaId(mediaId);
            asset.setGameId(gameId);
            asset.setUploaderUserId(userId);
            asset.setStorageUrl("games/" + gameId + "/photos/" + mediaId);
            asset.setCreatedAt(Instant.now());

            when(mediaRepo.findById(eq(mediaId))).thenReturn(Optional.of(asset));

            ArgumentCaptor<HeadObjectRequest> headCaptor = ArgumentCaptor.forClass(HeadObjectRequest.class);

            // Act
            mediaService.finalizeUpload(gameId, mediaId, userId);

            // Assert
            verify(s3).headObject(headCaptor.capture());
            assertThat(headCaptor.getValue().bucket()).isEqualTo("uploads");
            assertThat(headCaptor.getValue().key()).isEqualTo(asset.getStorageUrl());
        }

        @Test
        @DisplayName("finalizeUpload should throw RuntimeException when object does not exist in storage")
        void finalizeUpload_ThrowsWhenHeadFails() {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID mediaId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            setPrivateField(mediaService, "bucketName", "uploads");

            MediaAsset asset = new MediaAsset();
            asset.setMediaId(mediaId);
            asset.setGameId(gameId);
            asset.setUploaderUserId(userId);
            asset.setStorageUrl("games/" + gameId + "/photos/" + mediaId);
            asset.setCreatedAt(Instant.now());

            when(mediaRepo.findById(eq(mediaId))).thenReturn(Optional.of(asset));
            doThrow(new RuntimeException("nope")).when(s3).headObject(any(HeadObjectRequest.class));

            // Act + Assert
            assertThatThrownBy(() -> mediaService.finalizeUpload(gameId, mediaId, userId))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Upload not found in storage");
        }
    }

    @Nested
    class ListPhotosTests {

        @Test
        @DisplayName("listReadyPhotos should return MediaListItem with presigned GET urls")
        void listReadyPhotos_ReturnsPresignedUrls() throws Exception {
            // Arrange
            UUID gameId = UUID.randomUUID();
            UUID viewerUserId = UUID.randomUUID();

            setPrivateField(mediaService, "bucketName", "uploads");
            setPrivateField(mediaService, "presignExpirySeconds", 900L);

            UUID uploader1 = UUID.randomUUID();
            UUID uploader2 = UUID.randomUUID();

            MediaAsset a1 = new MediaAsset();
            a1.setMediaId(UUID.randomUUID());
            a1.setGameId(gameId);
            a1.setUploaderUserId(uploader1);
            a1.setMediaType(MediaAsset.MediaType.PHOTO);
            a1.setStorageUrl("games/" + gameId + "/photos/" + a1.getMediaId());
            a1.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));

            MediaAsset a2 = new MediaAsset();
            a2.setMediaId(UUID.randomUUID());
            a2.setGameId(gameId);
            a2.setUploaderUserId(uploader2);
            a2.setMediaType(MediaAsset.MediaType.PHOTO);
            a2.setStorageUrl("games/" + gameId + "/photos/" + a2.getMediaId());
            a2.setCreatedAt(Instant.parse("2026-01-02T00:00:00Z"));

            when(mediaRepo.findByGameIdAndMediaTypeAndDeletedAtIsNullOrderByCreatedAtDesc(eq(gameId), eq(MediaAsset.MediaType.PHOTO)))
                    .thenReturn(List.of(a2, a1)); // already desc

            PresignedGetObjectRequest presignedGet1 = mock(PresignedGetObjectRequest.class);
            when(presignedGet1.url()).thenReturn(new URL("http://example.com/get1"));

            PresignedGetObjectRequest presignedGet2 = mock(PresignedGetObjectRequest.class);
            when(presignedGet2.url()).thenReturn(new URL("http://example.com/get2"));

            when(presigner.presignGetObject(any(GetObjectPresignRequest.class)))
                    .thenReturn(presignedGet1, presignedGet2);

            // Act
            List<MediaListItem> items = mediaService.listReadyPhotos(gameId, viewerUserId);

            // Assert
            assertThat(items).hasSize(2);

            assertThat(items.get(0).getMediaId()).isEqualTo(a2.getMediaId());
            assertThat(items.get(0).getUrl()).isEqualTo("http://example.com/get1");
            assertThat(items.get(0).getCreatedAt()).isEqualTo(a2.getCreatedAt());
            assertThat(items.get(0).getUploaderUserId()).isEqualTo(uploader2);

            assertThat(items.get(1).getMediaId()).isEqualTo(a1.getMediaId());
            assertThat(items.get(1).getUrl()).isEqualTo("http://example.com/get2");
            assertThat(items.get(1).getCreatedAt()).isEqualTo(a1.getCreatedAt());
            assertThat(items.get(1).getUploaderUserId()).isEqualTo(uploader1);

            verify(mediaRepo).findByGameIdAndMediaTypeAndDeletedAtIsNullOrderByCreatedAtDesc(eq(gameId), eq(MediaAsset.MediaType.PHOTO));
            verify(presigner, times(2)).presignGetObject(any(GetObjectPresignRequest.class));
        }
    }
}
