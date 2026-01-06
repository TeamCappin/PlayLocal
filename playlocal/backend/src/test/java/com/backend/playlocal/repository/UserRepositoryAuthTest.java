package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for UserRepository methods used in Auth flows.
 * UserStory: US-1.1
 */
@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@ActiveProfiles("test")
class UserRepositoryAuthTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("US-1.1: findByEmailIgnoreCase should find user ignoring case")
    void findByEmailIgnoreCase_Found() {
        User user = User.builder()
                .email("Test@Example.com")
                .passwordHash("hashed")
                .displayName("Test")
                .status(User.UserStatus.ACTIVE)
                .ageConfirmedAt(Instant.now())
                .build();
        entityManager.persist(user);
        entityManager.flush();

        Optional<User> found = userRepository.findByEmailIgnoreCase("test@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("Test@Example.com");
    }

    @Test
    @DisplayName("US-1.1: existsByEmailIgnoreCase should return true for case-insensitive match")
    void existsByEmailIgnoreCase_True() {
        User user = User.builder()
                .email("Exists@Example.com")
                .passwordHash("hashed")
                .displayName("Test")
                .status(User.UserStatus.ACTIVE)
                .ageConfirmedAt(Instant.now())
                .build();
        entityManager.persist(user);
        entityManager.flush();

        boolean exists = userRepository.existsByEmailIgnoreCase("exists@example.com");
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("US-1.1: findActiveById should NOT return deleted user")
    void findActiveById_ExcludesDeleted() {
        User user = User.builder()
                .email("deleted@example.com")
                .passwordHash("hashed")
                .displayName("Deleted")
                .status(User.UserStatus.DELETED)
                .ageConfirmedAt(Instant.now())
                .build();
        user.setDeletedAt(Instant.now()); // Simulate soft delete
        entityManager.persist(user);
        entityManager.flush();

        Optional<User> found = userRepository.findActiveById(user.getUserId());
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("US-1.1: findActiveById should return active user")
    void findActiveById_Found() {
        User user = User.builder()
                .email("active@example.com")
                .passwordHash("hashed")
                .displayName("Active")
                .status(User.UserStatus.ACTIVE)
                .ageConfirmedAt(Instant.now())
                .build();
        entityManager.persist(user);
        entityManager.flush();

        Optional<User> found = userRepository.findActiveById(user.getUserId());
        assertThat(found).isPresent();
    }
}
