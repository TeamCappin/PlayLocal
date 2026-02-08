package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "game")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "game_id")
    private UUID gameId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sport_id", nullable = false)
    private Sport sport;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visibility_id", nullable = false)
    private GameVisibility visibility;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "indoor_outdoor", columnDefinition = "TEXT")
    private String indoorOutdoor;

    @Column(name = "intensity_band", columnDefinition = "TEXT")
    private String intensityBand;

    @Column(name = "skill_band", columnDefinition = "TEXT")
    private String skillBand;

    @Column(name = "min_players", nullable = false)
    @Builder.Default
    private Integer minPlayers = 2;

    @Column(name = "max_players", nullable = false)
    @Builder.Default
    private Integer maxPlayers = 20;

    @Column(name = "allow_waitlist")
    @Builder.Default
    private Boolean allowWaitlist = true;

    @Column(name = "min_reliability_required")
    private Float minReliabilityRequired;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Builder.Default
    private String timezone = "America/Montreal";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GameStatus status = GameStatus.SCHEDULED;

    @Column(name = "checkin_open_at")
    private Instant checkinOpenAt;

    @Column(name = "checkin_close_at")
    private Instant checkinCloseAt;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    public enum GameStatus {
        SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, ARCHIVED
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
