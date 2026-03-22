package com.backend.playlocal.service;

import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.MediaAsset;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.MediaAssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaServiceDeleteTest {

    @Mock
    private MediaAssetRepository mediaRepo;

    @Mock
    private GameRepository gameRepo;

    @Mock
    private S3Client s3;

    @Mock
    private S3Presigner presigner;

    @InjectMocks
    private MediaService mediaService;

    private UUID gameId;
    private UUID mediaId;
    private UUID uploaderId;
    private UUID organizerId;
    private MediaAsset mediaAsset;
    private Game game;
    private User uploader;
    private User organizer;

    @BeforeEach
    void setUp() {
        gameId = UUID.randomUUID();
        mediaId = UUID.randomUUID();
        uploaderId = UUID.randomUUID();
        organizerId = UUID.randomUUID();

        uploader = new User();
        uploader.setUserId(uploaderId);

        organizer = new User();
        organizer.setUserId(organizerId);

        mediaAsset = new MediaAsset();
        mediaAsset.setMediaId(mediaId);
        mediaAsset.setGameId(gameId);
        mediaAsset.setUploaderUserId(uploaderId);
        mediaAsset.setStorageUrl("games/" + gameId + "/photos/" + mediaId);
        mediaAsset.setDeletedAt(null);

        game = new Game();
        game.setGameId(gameId);
        game.setCreatedBy(organizer);
    }

    @Test
    void deletePhoto_uploaderCanDelete() {
        when(mediaRepo.findById(mediaId)).thenReturn(Optional.of(mediaAsset));
        when(gameRepo.findById(gameId)).thenReturn(Optional.of(game));

        mediaService.deletePhoto(gameId, mediaId, uploaderId);

        verify(mediaRepo).save(argThat(asset -> asset.getDeletedAt() != null));
        verify(s3).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void deletePhoto_organizerCanDelete() {
        when(mediaRepo.findById(mediaId)).thenReturn(Optional.of(mediaAsset));
        when(gameRepo.findById(gameId)).thenReturn(Optional.of(game));

        mediaService.deletePhoto(gameId, mediaId, organizerId);

        verify(mediaRepo).save(argThat(asset -> asset.getDeletedAt() != null));
        verify(s3).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void deletePhoto_otherUserCannotDelete() {
        UUID otherId = UUID.randomUUID();
        when(mediaRepo.findById(mediaId)).thenReturn(Optional.of(mediaAsset));
        when(gameRepo.findById(gameId)).thenReturn(Optional.of(game));

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> mediaService.deletePhoto(gameId, mediaId, otherId)
        );

        assertEquals(403, exception.getStatusCode().value());
        verify(mediaRepo, never()).save(any());
    }

    @Test
    void deletePhoto_photoNotFound() {
        when(mediaRepo.findById(mediaId)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> mediaService.deletePhoto(gameId, mediaId, uploaderId)
        );

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void deletePhoto_photoDoesNotBelongToGame() {
        mediaAsset.setGameId(UUID.randomUUID()); // Different game
        when(mediaRepo.findById(mediaId)).thenReturn(Optional.of(mediaAsset));

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> mediaService.deletePhoto(gameId, mediaId, uploaderId)
        );

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void deletePhoto_alreadyDeleted() {
        mediaAsset.setDeletedAt(Instant.now());
        when(mediaRepo.findById(mediaId)).thenReturn(Optional.of(mediaAsset));

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> mediaService.deletePhoto(gameId, mediaId, uploaderId)
        );

        assertEquals(410, exception.getStatusCode().value());
    }

    @Test
    void deletePhoto_s3FailureDoesNotPreventSoftDelete() {
        when(mediaRepo.findById(mediaId)).thenReturn(Optional.of(mediaAsset));
        when(gameRepo.findById(gameId)).thenReturn(Optional.of(game));
        doThrow(new RuntimeException("S3 error")).when(s3).deleteObject(any(DeleteObjectRequest.class));

        // Should not throw - soft delete succeeds even if S3 fails
        assertDoesNotThrow(() -> mediaService.deletePhoto(gameId, mediaId, uploaderId));

        verify(mediaRepo).save(argThat(asset -> asset.getDeletedAt() != null));
    }
}
