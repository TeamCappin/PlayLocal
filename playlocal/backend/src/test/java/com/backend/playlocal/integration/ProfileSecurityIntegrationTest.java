package com.backend.playlocal.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=password"
})
class ProfileSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getProfile_AsAnonymous_ReturnsUnauthorized() throws Exception {
        UUID randomUserId = UUID.randomUUID();
        
        // Try to access a profile without a token
        mockMvc.perform(get("/api/v1/users/" + randomUserId + "/profile"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getGame_AsAnonymous_ReturnsAllowed() throws Exception {
        UUID randomGameId = UUID.randomUUID();
        
        // Public endpoint
        // 404 means request reached controller (fetched nothing), so Security let it through.
        // 401/403 would mean Security blocked it.
        mockMvc.perform(get("/api/v1/games/" + randomGameId))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    if (s == 401 || s == 403) {
                        throw new AssertionError("Expected access allowed (not 401/403) but got " + s);
                    }
                });
    }
}
