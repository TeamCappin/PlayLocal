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
 * OrganizerVerification entity for tracking optional ID verification and other verification details.
 * One-to-one relationship with Organizer.
 * 
 * Related: US-6.2 - New Organizer Onboarding
 */
@Entity
@Table(name = "organizer_verification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizerVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "organizer_verification_id")
    private UUID organizerVerificationId;

    @OneToOne
    @JoinColumn(name = "organizer_id", nullable = false, unique = true)
    private Organizer organizer;

    @Enumerated(EnumType.STRING)
    @Column(name = "id_verification_status")
    private VerificationStatus idVerificationStatus;

    @Column(nullable = false)
    private String verificationProvider; // e.g., "Persona"

    @Column(name = "id_verification_verified_at")
    private Instant idVerificationVerifiedAt;

    @Column(name = "id_verification_notes")
    private String idVerificationNotes;

    // Timestamps
    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    public enum VerificationStatus {
        PENDING, VERIFIED, REJECTED
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
