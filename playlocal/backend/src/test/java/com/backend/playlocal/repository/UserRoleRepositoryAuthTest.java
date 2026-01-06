package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Role;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.model.entity.UserRole;
// Removed invalid import
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for UserRoleRepository methods used in Auth flows (Token Generation).
 * UserStory: US-1.1
 */
@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@ActiveProfiles("test")
class UserRoleRepositoryAuthTest {

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("US-1.1: findRoleNamesByUserId should return role names for active roles")
    void findRoleNamesByUserId_ReturnsExpectedRoles() {
        // Create User
        User user = User.builder()
                .email("role@example.com")
                .passwordHash("hashed")
                .displayName("RoleUser")
                .status(User.UserStatus.ACTIVE)
                .ageConfirmedAt(Instant.now())
                .build();
        entityManager.persist(user);

        // Create Roles
        Role roleUser = new Role();
        roleUser.setName("USER");
        entityManager.persist(roleUser);

        Role roleAdmin = new Role();
        roleAdmin.setName("ADMIN");
        entityManager.persist(roleAdmin);

        // Assign Roles
        UserRole assignment1 = new UserRole();
        assignment1.setUser(user);
        assignment1.setRole(roleUser);
        assignment1.setGrantedAt(Instant.now());
        entityManager.persist(assignment1);

        UserRole assignment2 = new UserRole();
        assignment2.setUser(user);
        assignment2.setRole(roleAdmin);
        assignment2.setGrantedAt(Instant.now());
        entityManager.persist(assignment2);

        entityManager.flush();

        List<String> roleNames = userRoleRepository.findRoleNamesByUserId(user.getUserId());
        assertThat(roleNames).containsExactlyInAnyOrder("USER", "ADMIN");
    }

    @Test
    @DisplayName("US-1.1: findRoleNamesByUserId should NOT return revoked roles")
    void findRoleNamesByUserId_ActiveOnly() {
        // Create User
        User user = User.builder()
                .email("revoked@example.com")
                .passwordHash("hashed")
                .displayName("RevokedUser")
                .status(User.UserStatus.ACTIVE)
                .ageConfirmedAt(Instant.now())
                .build();
        entityManager.persist(user);

        // Create Role
        Role roleUser = new Role();
        roleUser.setName("USER");
        entityManager.persist(roleUser);

        // Assign Role but Revoke it
        UserRole assignment = new UserRole();
        assignment.setUser(user);
        assignment.setRole(roleUser);
        assignment.setGrantedAt(Instant.now());
        assignment.setRevokedAt(Instant.now()); // Revoked!
        entityManager.persist(assignment);

        entityManager.flush();

        List<String> roleNames = userRoleRepository.findRoleNamesByUserId(user.getUserId());
        assertThat(roleNames).isEmpty();
    }
}
