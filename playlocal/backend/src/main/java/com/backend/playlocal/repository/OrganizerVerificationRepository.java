package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.OrganizerVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for OrganizerVerification entity.
 * Manages optional ID verification and other verification details.
 */
@Repository
public interface OrganizerVerificationRepository extends JpaRepository<OrganizerVerification, UUID> {

    /**
     * Find verification record by organizer ID.
     */
    Optional<OrganizerVerification> findByOrganizer_OrganizerId(UUID organizerId);

    /**
     * Find verified organizers by ID verification status.
     */
    @Query("SELECT ov FROM OrganizerVerification ov WHERE ov.idVerificationStatus = 'VERIFIED' ORDER BY ov.idVerificationVerifiedAt DESC")
    java.util.List<OrganizerVerification> findVerifiedOrganizers();

    /**
     * Count pending ID verifications.
     */
    @Query("SELECT COUNT(ov) FROM OrganizerVerification ov WHERE ov.idVerificationStatus = 'PENDING'")
    long countPendingVerifications();
}
