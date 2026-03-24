package com.backend.playlocal.controller;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.*;

import com.backend.playlocal.model.dto.MediaListItem;
import com.backend.playlocal.model.dto.RequestUploadSlotRequest;
import com.backend.playlocal.model.dto.RequestUploadSlotResponse;
import com.backend.playlocal.service.MediaService;

@RestController
@RequestMapping("/api/v1/games/{gameId}/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    // IMPORTANT: adapt to your real auth system (JWT -> userId).
    private UUID getUserId(Principal principal) {
        return UUID.fromString(principal.getName());
    }

    @PostMapping("/photos/upload-slot")
    public RequestUploadSlotResponse requestPhotoUploadSlot(
            @PathVariable UUID gameId,
            @RequestBody RequestUploadSlotRequest req,
            Principal principal
    ) {
        UUID userId = getUserId(principal);
        return mediaService.requestPhotoUploadSlot(gameId, userId, req);
    }

    @PostMapping("/photos/{mediaId}/finalize")
    public void finalizePhotoUpload(
            @PathVariable UUID gameId,
            @PathVariable UUID mediaId,
            Principal principal
    ) {
        UUID userId = getUserId(principal);
        mediaService.finalizeUpload(gameId, mediaId, userId);
    }

    @GetMapping("/photos")
    public List<MediaListItem> listPhotos(
            @PathVariable UUID gameId,
            Principal principal
    ) {
        UUID userId = getUserId(principal);
        return mediaService.listReadyPhotos(gameId, userId);
    }

    /**
     * US-7.15: Delete a photo from a game.
     * DELETE /api/v1/games/{gameId}/media/photos/{mediaId}
     * Only the uploader or game organizer can delete.
     */
    @DeleteMapping("/photos/{mediaId}")
    public void deletePhoto(
            @PathVariable UUID gameId,
            @PathVariable UUID mediaId,
            Principal principal
    ) {
        UUID userId = getUserId(principal);
        mediaService.deletePhoto(gameId, mediaId, userId);
    }
}
