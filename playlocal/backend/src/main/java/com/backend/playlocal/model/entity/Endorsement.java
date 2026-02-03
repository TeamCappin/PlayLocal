package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "endorsement")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Endorsement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "endorsement_id")
    private UUID endorsementId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endorser_user_id", nullable = false)
    private User endorser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endorsed_user_id", nullable = false)
    private User endorsedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(nullable = false)
    private String label; // e.g., "Organizer's Pick"

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
