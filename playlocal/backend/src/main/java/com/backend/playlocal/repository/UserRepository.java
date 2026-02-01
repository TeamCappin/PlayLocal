package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email) AND u.deletedAt IS NULL")
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT u FROM User u WHERE u.userId = :userId AND u.deletedAt IS NULL")
    Optional<User> findActiveById(UUID userId);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.status = 'ACTIVE' " +
            "AND (LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(u.slug) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<User> searchByDisplayNameOrEmail(String query, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.status = 'ACTIVE'")
    Page<User> findAllActive(Pageable pageable);

    // Slug-based profile lookup (US 1.3 + US 1.4 merge)
    @Query("SELECT u FROM User u WHERE u.slug = :slug AND u.deletedAt IS NULL AND u.status = 'ACTIVE'")
    Optional<User> findBySlugAndDeletedAtIsNull(String slug);

    boolean existsBySlugAndUserIdNotAndDeletedAtIsNull(String slug, UUID userId);
}
