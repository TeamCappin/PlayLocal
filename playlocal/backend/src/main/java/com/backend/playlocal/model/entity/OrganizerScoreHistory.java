package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Audit trail for Organizer Quality Score changes.
 * Implements: US-6.1 - OQS history changes are audit-logged
 * 
 * Logs: organizerId, previous score, new score, timestamp, reason
 */
@Entity
@Table(name = "organizer_score_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizerScoreHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "history_id")
    private UUID historyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;  // nullable for manual adjustments

    @Column(name = "previous_oqs", nullable = false)
    private Float previousOqs;

    @Column(name = "new_oqs", nullable = false)
    private Float newOqs;

    @Column(name = "delta", nullable = false)
    private Float delta;

    @Column(name = "previous_completion_rate")
    private Float previousCompletionRate;

    @Column(name = "new_completion_rate")
    private Float newCompletionRate;

    @Column(name = "previous_repeat_rate")
    private Float previousRepeatRate;

    @Column(name = "new_repeat_rate")
    private Float newRepeatRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    private OqsChangeReason reason;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum OqsChangeReason {
        GAME_COMPLETED,      // Organizer completed a game successfully
        GAME_CANCELLED,      // Organizer cancelled a game
        PLAYER_RETURNED,     // A player joined another game by this organizer
        INITIAL_CALCULATION, // First time OQS was calculated
        MANUAL_ADJUSTMENT,   // Admin adjustment
        RECALCULATION        // Periodic or triggered recalculation
    }
}
