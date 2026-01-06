package com.backend.playlocal.controller;

import com.backend.playlocal.config.SecurityConfig;
import com.backend.playlocal.security.JwtService;
import com.backend.playlocal.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import static org.hamcrest.Matchers.containsString;

@WebMvcTest(HealthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(SecurityConfig.class)
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserService userService;

    // SecurityConfig needs these mocked beans to load context
    @MockBean(name = "mvcHandlerMappingIntrospector")
    private org.springframework.web.servlet.handler.HandlerMappingIntrospector mvcHandlerMappingIntrospector;

    @Test
    @DisplayName("US-1.1: Health Check Endpoint should return UP status")
    void healthCheck_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("UP")))
                .andExpect(content().string(containsString("playlocal-backend")));
    }
}
