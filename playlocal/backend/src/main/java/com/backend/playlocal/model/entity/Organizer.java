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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Organizer entity representing the organizer profile linked to a User.
 * One-to-one relationship with User (optional FK from user perspective).
 * Tracks onboarding state, verification status, and trust progression.
 * 
 * Related: US-6.2 - New Organizer Onboarding
 */
@Entity
@Table(name = "organizer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organizer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "organizer_id")
    private UUID organizerId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrganizerStatus status = OrganizerStatus.NONE;

    // Onboarding tracking
    @Column(name = "onboarding_completed_at")
    private Instant onboardingCompletedAt;

    @Column(name = "organizer_addendum_accepted_at")
    private Instant organizerAddendumAcceptedAt;

    // Verification requirements
    @Column(name = "phone_verified", nullable = false)
    @Builder.Default
    private Boolean phoneVerified = false;

    @Column(name = "profile_picture_verified", nullable = false)
    @Builder.Default
    private Boolean profilePictureVerified = false;


    // Provisional organizer progression (games hosted before FULL promotion)
    @Column(name = "provisional_games_completed", nullable = false)
    @Builder.Default
    private Integer provisionalGamesCompleted = 0;

    // Timestamps
    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    public enum OrganizerStatus {
        NONE, PROVISIONAL, FULL
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
