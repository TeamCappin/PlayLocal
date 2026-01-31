package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Organizer Quality Score (OQS) entity.
 * Implements: US-6.1 - Organizer Quality Score
 * 
 * OQS is calculated from objective metrics:
 * - Game completion rate: (completed games / total games hosted) * 100
 * - Repeat player rate: (players who joined more than once / total unique players) * 100
 * 
 * The overall OQS is a weighted average of these metrics.
 */
@Entity
@Table(name = "organizer_quality_score")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizerQualityScore {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "oqs_score", nullable = false)
    @Builder.Default
    private Float oqsScore = 100.0f;

    @Column(name = "game_completion_rate", nullable = false)
    @Builder.Default
    private Float gameCompletionRate = 100.0f;

    @Column(name = "repeat_player_rate", nullable = false)
    @Builder.Default
    private Float repeatPlayerRate = 0.0f;

    // Metrics for calculation
    @Column(name = "total_games_hosted", nullable = false)
    @Builder.Default
    private Integer totalGamesHosted = 0;

    @Column(name = "completed_games", nullable = false)
    @Builder.Default
    private Integer completedGames = 0;

    @Column(name = "cancelled_games", nullable = false)
    @Builder.Default
    private Integer cancelledGames = 0;

    @Column(name = "total_unique_players", nullable = false)
    @Builder.Default
    private Integer totalUniquePlayers = 0;

    @Column(name = "repeat_players", nullable = false)
    @Builder.Default
    private Integer repeatPlayers = 0;

    @Column(name = "last_calculated_at")
    @Builder.Default
    private Instant lastCalculatedAt = Instant.now();

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    /**
     * Confidence level based on sample size (number of hosted games).
     */
    public ConfidenceLevel getConfidenceLevel() {
        if (totalGamesHosted < 3) {
            return ConfidenceLevel.LOW;
        } else if (totalGamesHosted < 10) {
            return ConfidenceLevel.MEDIUM;
        } else {
            return ConfidenceLevel.HIGH;
        }
    }

    public enum ConfidenceLevel {
        LOW,    // < 3 games hosted
        MEDIUM, // 3-9 games hosted
        HIGH    // 10+ games hosted
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
