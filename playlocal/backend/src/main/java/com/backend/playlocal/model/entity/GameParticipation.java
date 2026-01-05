package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "game_participation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "participation_id")
    private UUID participationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sport_id", nullable = false)
    private Sport sport;

    @Enumerated(EnumType.STRING)
    @Column(name = "participation_role", nullable = false)
    @Builder.Default
    private ParticipationRole participationRole = ParticipationRole.PARTICIPANT;

    @Enumerated(EnumType.STRING)
    @Column(name = "join_status", nullable = false)
    @Builder.Default
    private JoinStatus joinStatus = JoinStatus.CONFIRMED;

    @Column(name = "waitlist_position")
    private Integer waitlistPosition;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false)
    @Builder.Default
    private AttendanceStatus attendanceStatus = AttendanceStatus.UNKNOWN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_confirmed_by_user_id")
    private User attendanceConfirmedBy;

    @Column(name = "attendance_confirmed_at")
    private Instant attendanceConfirmedAt;

    @Column(name = "joined_at")
    @Builder.Default
    private Instant joinedAt = Instant.now();

    @Column(name = "left_at")
    private Instant leftAt;

    private String notes;

    public enum ParticipationRole {
        ORGANIZER, CO_ORGANIZER, PARTICIPANT
    }

    public enum JoinStatus {
        CONFIRMED, WAITLISTED, REQUESTED, CANCELLED, REMOVED
    }

    public enum AttendanceStatus {
        UNKNOWN, ATTENDED, NO_SHOW
    }
}
