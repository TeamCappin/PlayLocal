package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a post-game rating given by one player to another.
 * Allows verified players to leave a scaled rating and optional textual feedback.
 * Includes constraints to ensure only one rating exists per rater-ratee pair for a given game.
 */
@Entity
@Table(
    name = "player_rating",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"game_id", "rater_id", "ratee_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerRating {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rating_id")
    private UUID ratingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rater_id", nullable = false)
    private User rater;

    /**
     * The player receiving the rating (the ratee).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ratee_id", nullable = false)
    private User ratee;

    /**
     * Numeric rating, typically on a scale of 1-5.
     */
    @Column(nullable = false)
    private int rating;

    /**
     * Optional text feedback from the rater. Maximum 500 characters.
     */
    @Column(length = 500)
    private String comment;

    /**
     * Indicates whether the comment has been flagged for moderation.
     */
    @Column(name = "is_flagged", nullable = false)
    @Builder.Default
    private boolean isFlagged = false;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
