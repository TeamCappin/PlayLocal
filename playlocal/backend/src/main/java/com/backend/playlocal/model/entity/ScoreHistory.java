package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "score_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "score_history_id")
    private UUID scoreHistoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;  // nullable for manual adjustments

    @Column(name = "previous_score", nullable = false)
    private Float previousScore;

    @Column(name = "new_score", nullable = false)
    private Float newScore;

    @Column(name = "delta", nullable = false)
    private Float delta;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    private ScoreChangeReason reason;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;  // who triggered the change

    public enum ScoreChangeReason {
        ATTENDANCE,       // User showed up to a game
        NO_SHOW,          // User didn't show up
        MANUAL_ADJUSTMENT, // Admin adjustment
        DISPUTE_RESOLVED   // Score corrected after dispute
    }
}
