package com.backend.playlocal.unit;

import com.backend.playlocal.controller.ReportController;
import com.backend.playlocal.model.dto.ReportDto;
import com.backend.playlocal.service.ReportService;
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

import java.security.Principal;
import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller tests for US 1.4 - Report Issue.
 * 
 * Tests cover:
 * 1. Valid report request returns 201
 * 2. Missing details returns 400
 * 3. Valid game report returns 201
 */
@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

        @Mock
        private ReportService reportService;

        @InjectMocks
        private ReportController reportController;

        private MockMvc mockMvc;
        private ObjectMapper objectMapper = new ObjectMapper();

        private static final String REPORTER_ID = "550e8400-e29b-41d4-a716-446655440000";
        private static final String REPORTED_USER_ID = "550e8400-e29b-41d4-a716-446655440001";
        private static final String GAME_ID = "660e8400-e29b-41d4-a716-446655440002";

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders.standaloneSetup(reportController).build();
                objectMapper.findAndRegisterModules(); // For Instant serialization
        }

        private Principal createPrincipal() {
                return new UsernamePasswordAuthenticationToken(REPORTER_ID, null);
        }

        @Test
        @DisplayName("US-1.4: createReport with valid user report returns 201")
        void createReport_ValidUserReport_Returns201() throws Exception {
                // Given
                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .reportedUserId(REPORTED_USER_ID)
                                .reportType("HARASSMENT")
                                .details("This user was harassing other players")
                                .build();

                ReportDto.ReportResponse response = ReportDto.ReportResponse.builder()
                                .reportId(UUID.randomUUID().toString())
                                .reporterUserId(REPORTER_ID)
                                .reportedUserId(REPORTED_USER_ID)
                                .reportType("HARASSMENT")
                                .details("This user was harassing other players")
                                .status("OPEN")
                                .createdAt(Instant.now())
                                .build();

                when(reportService.createReport(any(ReportDto.CreateRequest.class), eq(UUID.fromString(REPORTER_ID))))
                                .thenReturn(response);

                // When/Then
                mockMvc.perform(post("/api/v1/reports")
                                .principal(createPrincipal())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.reportId").exists())
                                .andExpect(jsonPath("$.reportType").value("HARASSMENT"))
                                .andExpect(jsonPath("$.status").value("OPEN"));
        }

        @Test
        @DisplayName("US-1.4: createReport with valid game report returns 201")
        void createReport_ValidGameReport_Returns201() throws Exception {
                // Given
                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .gameId(GAME_ID)
                                .reportType("INAPPROPRIATE_CONTENT")
                                .details("This game has inappropriate content")
                                .build();

                ReportDto.ReportResponse response = ReportDto.ReportResponse.builder()
                                .reportId(UUID.randomUUID().toString())
                                .reporterUserId(REPORTER_ID)
                                .gameId(GAME_ID)
                                .reportType("INAPPROPRIATE_CONTENT")
                                .details("This game has inappropriate content")
                                .status("OPEN")
                                .createdAt(Instant.now())
                                .build();

                when(reportService.createReport(any(ReportDto.CreateRequest.class), eq(UUID.fromString(REPORTER_ID))))
                                .thenReturn(response);

                // When/Then
                mockMvc.perform(post("/api/v1/reports")
                                .principal(createPrincipal())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.reportId").exists())
                                .andExpect(jsonPath("$.gameId").value(GAME_ID))
                                .andExpect(jsonPath("$.reportType").value("INAPPROPRIATE_CONTENT"))
                                .andExpect(jsonPath("$.status").value("OPEN"));
        }

        @Test
        @DisplayName("US-1.4: createReport without details returns 400")
        void createReport_MissingDetails_Returns400() throws Exception {
                // Given
                ReportDto.CreateRequest request = ReportDto.CreateRequest.builder()
                                .reportedUserId(REPORTED_USER_ID)
                                .reportType("HARASSMENT")
                                .details("") // Empty details
                                .build();

                // When/Then
                mockMvc.perform(post("/api/v1/reports")
                                .principal(createPrincipal())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }
}
