package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.PlayerRatingDto;
import com.backend.playlocal.security.JwtService;
import com.backend.playlocal.service.PlayerRatingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PlayerRatingController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for simple unit testing if possible, or use @WithMockUser
class PlayerRatingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PlayerRatingService playerRatingService;

    @MockBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID raterId;
    private UUID rateeId;
    private UUID gameId;
    private UUID ratingId;

    @BeforeEach
    void setUp() {
        raterId = UUID.randomUUID();
        rateeId = UUID.randomUUID();
        gameId = UUID.randomUUID();
        ratingId = UUID.randomUUID();
    }

    @Test
    void createRating_Success() throws Exception {
        PlayerRatingDto.CreateRequest request = new PlayerRatingDto.CreateRequest();
        request.setGameId(gameId);
        request.setRateeId(rateeId);
        request.setRating(5);
        request.setComment("Great player!");

        PlayerRatingDto.Response response = new PlayerRatingDto.Response();
        response.setRatingId(ratingId);
        response.setRating(5);

        Mockito.when(jwtService.getUserIdFromToken("valid-token")).thenReturn(raterId);
        Mockito.when(playerRatingService.createRating(eq(raterId), any(PlayerRatingDto.CreateRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/ratings")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ratingId").value(ratingId.toString()))
                .andExpect(jsonPath("$.rating").value(5));
    }

    @Test
    void updateRating_Success() throws Exception {
        PlayerRatingDto.UpdateRequest request = new PlayerRatingDto.UpdateRequest();
        request.setRating(4);
        request.setComment("Updated");

        PlayerRatingDto.Response response = new PlayerRatingDto.Response();
        response.setRatingId(ratingId);
        response.setRating(4);
        response.setComment("Updated");

        Mockito.when(jwtService.getUserIdFromToken("valid-token")).thenReturn(raterId);
        Mockito.when(playerRatingService.updateRating(eq(raterId), eq(ratingId), any(PlayerRatingDto.UpdateRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/ratings/" + ratingId)
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ratingId").value(ratingId.toString()))
                .andExpect(jsonPath("$.rating").value(4));
    }

    @Test
    void getRatingsForUser_Success() throws Exception {
        PlayerRatingDto.Response response = new PlayerRatingDto.Response();
        response.setRatingId(ratingId);
        response.setRateeId(rateeId);

        Mockito.when(playerRatingService.getRatingsForUser(rateeId)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/ratings/user/" + rateeId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ratingId").value(ratingId.toString()));
    }

    @Test
    void flagRating_Success() throws Exception {
        Mockito.doNothing().when(playerRatingService).flagRating(ratingId);

        mockMvc.perform(post("/api/ratings/" + ratingId + "/flag")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk());
    }
}