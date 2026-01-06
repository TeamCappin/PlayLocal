package com.backend.playlocal.model.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for Role entity.
 * UserStory: US-1.1
 */
class RoleTest {

    @Test
    @DisplayName("US-1.1: Role builder should construct valid role")
    void roleBuilder_ConstructsValidRole() {
        UUID id = UUID.randomUUID();
        Role role = Role.builder()
                .roleId(id)
                .name("CUSTOM_ROLE")
                .description("A custom role")
                .build();

        assertThat(role.getRoleId()).isEqualTo(id);
        assertThat(role.getName()).isEqualTo("CUSTOM_ROLE");
        assertThat(role.getDescription()).isEqualTo("A custom role");
    }

    @Test
    @DisplayName("US-1.1: Role constants should match Auth requirements")
    void roleConstants_MatchRequirements() {
        assertThat(Role.USER).isEqualTo("user");
        assertThat(Role.ADMIN).isEqualTo("admin");
        assertThat(Role.MODERATOR).isEqualTo("moderator");
    }

    @Test
    @DisplayName("US-1.1: Role no-args constructor should work")
    void roleNoArgsConstructor_ShouldWork() {
        Role role = new Role();
        assertThat(role).isNotNull();
    }
}
