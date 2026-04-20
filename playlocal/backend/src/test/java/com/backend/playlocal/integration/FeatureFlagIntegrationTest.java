package com.backend.playlocal.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class FeatureFlagIntegrationTest extends IntegrationTestBase {

  @Autowired
  private MockMvc mockMvc;

  private static final String ADMIN_EMAIL = "playlocal.mgdfd@simplelogin.com";
  private static final String ADMIN_PASSWORD = "password123";
  private static final String REGULAR_EMAIL = "alex.chen@demo.com";
  private static final String REGULAR_PASSWORD = "password123";
  private static final String BASE_URL = "/api/v1/feature-flags/ads-switch";

  private String adminToken;
  private String regularUserToken;

  @BeforeEach
  void setUp() throws Exception {
    adminToken = loginAndGetToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    regularUserToken = loginAndGetToken(REGULAR_EMAIL, REGULAR_PASSWORD);
  }

  @Test
  @DisplayName("Feature Flag: GET /ads-switch is publicly accessible")
  void getAdsSwitch_PublicAccess() throws Exception {
    mockMvc.perform(get(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.adminAdsSwitchOn").isBoolean());
  }

  @Test
  @DisplayName("Feature Flag: PUT /ads-switch rejects unauthenticated requests")
  void updateAdsSwitch_UnauthenticatedDenied() throws Exception {
    mockMvc.perform(put(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"adminAdsSwitchOn\":false}"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Feature Flag: PUT /ads-switch rejects non-admin users")
  void updateAdsSwitch_NonAdminDenied() throws Exception {
    mockMvc.perform(put(BASE_URL)
            .header("Authorization", "Bearer " + regularUserToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"adminAdsSwitchOn\":false}"))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("Feature Flag: PUT /ads-switch allows admin and persists update")
  void updateAdsSwitch_AdminAllowedAndPersisted() throws Exception {
    mockMvc.perform(put(BASE_URL)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"adminAdsSwitchOn\":false}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.adminAdsSwitchOn").value(false));

    mockMvc.perform(get(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.adminAdsSwitchOn").value(false));

    // Reset for test isolation in repeated local runs.
    mockMvc.perform(put(BASE_URL)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"adminAdsSwitchOn\":true}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.adminAdsSwitchOn").value(true));
  }

  private String loginAndGetToken(String email, String password) throws Exception {
    String loginJson = "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";

    MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(loginJson))
        .andExpect(status().isOk())
        .andReturn();

    String responseJson = result.getResponse().getContentAsString();
    int tokenStart = responseJson.indexOf("\"token\":\"") + 9;
    int tokenEnd = responseJson.indexOf("\"", tokenStart);
    return responseJson.substring(tokenStart, tokenEnd);
  }
}