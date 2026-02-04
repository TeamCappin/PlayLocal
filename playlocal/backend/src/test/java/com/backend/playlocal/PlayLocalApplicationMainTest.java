package com.backend.playlocal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PlayLocalApplicationMainTest {

    @Test
    @DisplayName("US-1.1: main method should start application")
    void main_InvokesSpringRun() {
        // Pass arguments to override database config for safe local execution (H2)
        // avoiding the need for a real Postgres instance during this specific
        // invocation
        String[] args = {
                "--spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
                "--spring.datasource.driver-class-name=org.h2.Driver",
                "--spring.datasource.username=sa",
                "--spring.datasource.password=",
                "--spring.flyway.enabled=false",
                "--spring.jpa.hibernate.ddl-auto=create-drop",
                "--server.port=0" // Use random port to avoid conflicts
        };

        // This will verify the main method runs without throwing an exception
        PlayLocalApplication.main(args);
    }
}
