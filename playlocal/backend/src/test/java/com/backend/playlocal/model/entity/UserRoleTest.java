package com.backend.playlocal.model.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for UserRole entity.
 * UserStory: US-1.1
 */
class UserRoleTest {

    @Test
    @DisplayName("US-1.1: UserRole builder should construct valid entity")
    void userRoleBuilder_ConstructsValidEntity() {
        UUID id = UUID.randomUUID();
        User user = User.builder().email("test@example.com").slug("test-" + UUID.randomUUID()).build();
        Role role = Role.builder().name("USER").build();
        Instant now = Instant.now();

        UserRole userRole = UserRole.builder()
                .userRoleId(id)
                .user(user)
                .role(role)
                .grantedAt(now)
                .build();

        assertThat(userRole.getUserRoleId()).isEqualTo(id);
        assertThat(userRole.getUser()).isEqualTo(user);
        assertThat(userRole.getRole()).isEqualTo(role);
        assertThat(userRole.getGrantedAt()).isEqualTo(now);
        assertThat(userRole.getRevokedAt()).isNull();
    }

    @Test
    @DisplayName("US-1.1: UserRole should default grantedAt to now")
    void userRoleDefaults_ShouldSetGrantedAt() {
        UserRole userRole = UserRole.builder().build();
        assertThat(userRole.getGrantedAt()).isNotNull();
    }

    @Test
    @DisplayName("US-1.1: UserRole setters should work")
    void userRoleSetters_ShouldWork() {
        UserRole userRole = new UserRole();
        Instant revoked = Instant.now();

        userRole.setRevokedAt(revoked);
        assertThat(userRole.getRevokedAt()).isEqualTo(revoked);
    }
}
