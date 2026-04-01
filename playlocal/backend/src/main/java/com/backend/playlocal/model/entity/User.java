package com.backend.playlocal.model.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "\"user\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    // Public username/handle used in profile URLs (e.g., "john-doe")
    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "phone_e164")
    private String phoneE164;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "default_intensity")
    private String defaultIntensity;

    @Column(name = "availability")
    private String availability;

    @Column(name = "bio", length = 500)
    private String bio;

    @Column(name = "location")
    private String location;

    // Reliability metrics
    @Column(name = "reliability_score")
    @Builder.Default
    private Float reliabilityScore = 100.0f;

    @Column(name = "attended_count")
    @Builder.Default
    private Integer attendedCount = 0;

    @Column(name = "no_show_count")
    @Builder.Default
    private Integer noShowCount = 0;

    @Column(name = "games_count")
    @Builder.Default
    private Integer gamesCount = 0;

    // Timestamps
    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "mfa_enabled")
    @Builder.Default
    private Boolean mfaEnabled = false;

    @Column(name = "age_confirmed_at")
    private Instant ageConfirmedAt;

    public enum UserStatus {
        ACTIVE, SUSPENDED, DELETED
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        this.updatedAt = Instant.now();
        updateSlugIfNeeded();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
        updateSlugIfNeeded();
    }

    private void updateSlugIfNeeded() {
        if (this.slug == null && this.displayName != null) {
            this.slug = generateSlug(this.displayName);
        }
    }

    public static String generateSlug(String displayName) {
        if (displayName == null)
            return null;
        return displayName.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-)|(-$)", "")
                .replaceAll("-+", "-");
    }
}
