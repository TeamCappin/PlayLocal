package com.backend.playlocal.unit;

import com.backend.playlocal.controller.MediaController;
import com.backend.playlocal.model.dto.MediaListItem;
import com.backend.playlocal.model.dto.RequestUploadSlotRequest;
import com.backend.playlocal.model.dto.RequestUploadSlotResponse;
import com.backend.playlocal.service.MediaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MediaControllerTest {

    @Mock
    private MediaService mediaService;

    @InjectMocks
    private MediaController mediaController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private final UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
    private final UUID gameId = UUID.fromString("660e8400-e29b-41d4-a716-446655440001");

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(mediaController).build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    private UsernamePasswordAuthenticationToken principal() {
        return new UsernamePasswordAuthenticationToken(userId.toString(), null);
    }

    @Test
    @DisplayName("POST photos/upload-slot delegates to MediaService")
    void requestPhotoUploadSlot_ReturnsResponse() throws Exception {
        UUID mediaId = UUID.randomUUID();
        RequestUploadSlotResponse resp = new RequestUploadSlotResponse(mediaId, "http://put", "games/x/photos/y");
        when(mediaService.requestPhotoUploadSlot(eq(gameId), eq(userId), any(RequestUploadSlotRequest.class)))
                .thenReturn(resp);

        RequestUploadSlotRequest req = new RequestUploadSlotRequest("image/jpeg", "p.jpg");

        mockMvc.perform(post("/api/v1/games/{gameId}/media/photos/upload-slot", gameId)
                        .principal(principal())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mediaId").value(mediaId.toString()));

        verify(mediaService).requestPhotoUploadSlot(eq(gameId), eq(userId), any(RequestUploadSlotRequest.class));
    }

    @Test
    @DisplayName("POST photos/{mediaId}/finalize delegates to MediaService")
    void finalizePhotoUpload_CallsService() throws Exception {
        UUID mediaId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/games/{gameId}/media/photos/{mediaId}/finalize", gameId, mediaId)
                        .principal(principal()))
                .andExpect(status().isOk());

        verify(mediaService).finalizeUpload(eq(gameId), eq(mediaId), eq(userId));
    }

    @Test
    @DisplayName("GET photos delegates to MediaService")
    void listPhotos_ReturnsList() throws Exception {
        MediaListItem item = new MediaListItem(UUID.randomUUID(), "http://get", Instant.parse("2026-01-01T00:00:00Z"), userId);
        when(mediaService.listReadyPhotos(eq(gameId), eq(userId))).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/games/{gameId}/media/photos", gameId)
                        .principal(principal()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].url").value("http://get"));

        verify(mediaService).listReadyPhotos(eq(gameId), eq(userId));
    }

    @Test
    @DisplayName("US-7.15: DELETE photos/{mediaId} delegates to MediaService")
    void deletePhoto_CallsService() throws Exception {
        UUID mediaId = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/games/{gameId}/media/photos/{mediaId}", gameId, mediaId)
                        .principal(principal()))
                .andExpect(status().isOk());

        verify(mediaService).deletePhoto(eq(gameId), eq(mediaId), eq(userId));
    }
}
